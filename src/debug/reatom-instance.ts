import {
  abortVar,
  computed,
  reset,
  withAbort,
  withDisconnectHook,
} from "@reatom/core";

export const reatomInstance = <I>(
  create: () => I,
  dispose?: (instance: I) => void,
  name?: string
) => {
  const resource = computed(() => {
    const instance = create();
    abortVar.subscribe(() => dispose?.(instance));
    return instance;
  }, name).extend(
    withAbort(),
    withDisconnectHook(() => {
      resource.abort("disconnect");
      reset(resource);
    })
  );
  return resource;
};
