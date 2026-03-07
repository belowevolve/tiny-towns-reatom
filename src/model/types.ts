import type { Atom } from "@reatom/core";

export const RESOURCES = ["wood", "stone", "wheat", "brick", "glass"] as const;
export type Resource = (typeof RESOURCES)[number];

export const RESOURCE_ICONS: Record<Resource, string> = {
  brick: "🧱",
  glass: "🔮",
  stone: "🪨",
  wheat: "🌾",
  wood: "🪵",
};

export const BUILDING_TYPES = [
  "well",
  "cottage",
  "chapel",
  "tavern",
  "theater",
  "factory",
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export interface PatternCell {
  dr: number;
  dc: number;
  resource: Resource;
}

export interface BuildingDef {
  name: string;
  icon: string;
  description: string;
  pattern: PatternCell[];
}

export type CellContent =
  | null
  | { type: "resource"; resource: Resource }
  | { type: "building"; building: BuildingType; icon: string };

export const GRID_SIZE = 4;

export interface BuildMatch {
  building: BuildingType;
  cells: number[];
}

export type CellAtom = Atom<CellContent, [newState: CellContent]>;
