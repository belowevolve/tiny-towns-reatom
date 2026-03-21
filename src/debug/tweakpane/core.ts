import type { AtomLike } from "@reatom/core";
import type {
  BaseParams,
  Controller,
  FolderApi,
  RackApi,
  TabPageApi,
} from "@tweakpane/core";
import { Pane } from "tweakpane";
import type { FolderParams } from "tweakpane";

import { reatomInstance } from "../reatom-instance";

export type BladeRackApi = FolderApi | RackApi | TabPageApi;

export interface Disposable {
  dispose: () => void;
  controller: Controller;
}

export const reatomDisposable = <T extends Disposable>(
  create: () => T,
  name?: string
) =>
  reatomInstance(
    () => create(),
    (disposable) => disposable.dispose(),
    name
  );

export type PaneConfig = ConstructorParameters<typeof Pane>[0];

export const reatomPane = (params: PaneConfig & { name: string }) =>
  reatomDisposable(() => new Pane(params), `tweakpane.pane.${params.name}`);

export const rootPane = reatomPane({ name: "rootPane" });

export const reatomPaneFolder = (
  params: FolderParams,
  parent: AtomLike<BladeRackApi> = rootPane
) =>
  reatomDisposable(
    () => parent().addFolder(params),
    `${parent.name}.${params.title}`
  );

export const reatomPaneSeparator = (
  params: BaseParams,
  parent: AtomLike<BladeRackApi> = rootPane
) =>
  reatomDisposable(
    () => parent().addBlade({ view: "separator", ...params }),
    `${parent.name}.separator`
  );
