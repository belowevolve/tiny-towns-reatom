import { action, atom, computed, peek } from "@reatom/core";

import { BUILDINGS } from "./buildings";
import { findMatches } from "./patterns";
import type { BuildMatch, CellAtom, CellContent, Resource } from "./types";
import { GRID_SIZE } from "./types";

export const cells: CellAtom[] = Array.from(
  { length: GRID_SIZE * GRID_SIZE },
  (_, i) => atom<CellContent>(null, `grid.cell#${i}`)
);

export const selectedResource = atom<Resource | null>(
  null,
  "game.selectedResource"
);

export const highlightedCells = atom<Set<number>>(
  new Set<number>(),
  "game.highlightedCells"
);

export const selectedMatch = atom<BuildMatch | null>(
  null,
  "game.selectedMatch"
);

export const score = atom(0, "game.score");

const getCellContent = (index: number): CellContent => peek(cells[index]);

export const availableBuilds = computed((): BuildMatch[] => {
  for (const cell of cells) {
    cell();
  }
  return findMatches(getCellContent);
}, "game.availableBuilds");

export const placeResource = action((index: number) => {
  const resource = selectedResource();
  if (!resource) {
    return;
  }

  const content = peek(cells[index]);
  if (content !== null) {
    return;
  }

  cells[index]?.set({ resource, type: "resource" });
  selectedResource.set(null);
}, "game.placeResource");

export const selectMatch = action((match: BuildMatch | null) => {
  selectedMatch.set(match);
  highlightedCells.set(
    match ? new Set<number>(match.cells) : new Set<number>()
  );
}, "game.selectMatch");

export const buildAtCell = action((match: BuildMatch, targetIndex: number) => {
  const def = BUILDINGS[match.building];

  for (const idx of match.cells) {
    cells[idx]?.set(null);
  }

  cells[targetIndex]?.set({
    building: match.building,
    icon: def.icon,
    type: "building",
  });

  score.set((s) => s + 1);
  selectedMatch.set(null);
  highlightedCells.set(new Set<number>());
}, "game.buildAtCell");

export const resetGame = action(() => {
  for (const cell of cells) {
    cell.set(null);
  }
  score.set(0);
  selectedResource.set(null);
  selectedMatch.set(null);
  highlightedCells.set(new Set<number>());
}, "game.reset");
