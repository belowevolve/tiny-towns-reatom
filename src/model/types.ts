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

export const RESOURCE_NAMES: Record<Resource, string> = {
  brick: "Кирпич",
  glass: "Стекло",
  stone: "Камень",
  wheat: "Пшеница",
  wood: "Дерево",
};

export const RESOURCE_COLORS: Record<Resource, string> = {
  brick: "var(--resource-brick)",
  glass: "var(--resource-glass)",
  stone: "var(--resource-stone)",
  wheat: "var(--resource-wheat)",
  wood: "var(--resource-wood)",
};

export const BUILDING_TYPES = [
  "cottage",
  "farm",
  "well",
  "chapel",
  "tavern",
  "bakery",
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export interface PatternCell {
  dr: number;
  dc: number;
  resource: Resource;
}

export interface ScoringContext {
  index: number;
  grid: CellContent[];
  gridSize: number;
  allBuildings: { type: BuildingType; index: number }[];
}

export interface BuildingDef {
  name: string;
  icon: string;
  description: string;
  pattern: PatternCell[];
  score: (ctx: ScoringContext) => number;
}

export type CellContent =
  | null
  | { type: "resource"; resource: Resource }
  | { type: "building"; building: BuildingType };

export const GRID_SIZE = 4;

export interface BuildMatch {
  building: BuildingType;
  cells: number[];
  wildcardCells: number[];
  key: string;
}

export type CellAtom = Atom<CellContent, [newState: CellContent]>;

export type GamePhase = "lobby" | "playing" | "finished";
export type TurnPhase = "announce" | "place";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface LobbyPlayer {
  peerId: string;
  name: string;
  ready: boolean;
}

export const MAX_PLAYERS = 6;
