import { top, withChangeHook, withConnectHook, wrap } from "@reatom/core";
import type { Atom, AtomLike, EnumAtom, Frame } from "@reatom/core";
import type { Formatter } from "@tweakpane/core";
import type { BindingParams, ListParamsOptions } from "tweakpane";

import { reatomDisposable, rootPane } from "./core";
import type { BladeRackApi } from "./core";

const isEnumAtom = (target: Atom<unknown>): target is EnumAtom<string> =>
  "enum" in target && typeof target.enum === "object" && target.enum !== null;

const toBindingObject = <T>(target: Atom<T>, frame: Frame) => ({
  get value() {
    return frame.run(target);
  },
  set value(v: T) {
    frame.run(target.set, v);
  },
});

export const withBinding =
  <T>(
    bindingParams: Omit<BindingParams, "options" | "format"> & {
      options?: ListParamsOptions<T>;
      format?: Formatter<T>;
    },
    parent: AtomLike<BladeRackApi> = rootPane
  ) =>
  (target: Atom<T>) => {
    const params: BindingParams = isEnumAtom(target)
      ? { options: target.enum, ...bindingParams }
      : bindingParams;

    const bindingAtom = reatomDisposable(() => {
      const parentApi = parent();

      const bindingObject = toBindingObject(target, top().root.frame);
      const bindingApi = parentApi.addBinding(bindingObject, "value", params);
      bindingApi.on(
        "change",
        wrap(({ value }) => {
          if (typeof value === "object") {
            target.set({ ...value });
          }
        })
      );
      return bindingApi;
    }, `${parent.name}.${target.name}.binding`);

    target.extend(
      withConnectHook(() => bindingAtom.subscribe()),
      withChangeHook(() => void bindingAtom().refresh())
    );

    return { binding: bindingAtom };
  };
