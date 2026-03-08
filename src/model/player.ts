import { action, atom, computed, peek } from "@reatom/core";

import { calculateGridScore } from "./buildings";
import { findMatches } from "./patterns";
import type { BuildMatch, CellAtom, CellContent, Resource } from "./types";
import { GRID_SIZE } from "./types";

export const reatomPlayer = (id: string, name: string) => {
  const prefix = `player#${id}`;

  const cells: CellAtom[] = Array.from(
    { length: GRID_SIZE * GRID_SIZE },
    (_, i) => atom<CellContent>(null, `${prefix}.cell#${i}`)
  );

  const selectedResource = atom<Resource | null>(
    null,
    `${prefix}.selectedResource`
  );

  const highlightedCells = atom<Set<number>>(
    new Set<number>(),
    `${prefix}.highlighted`
  );

  const selectedMatch = atom<BuildMatch | null>(
    null,
    `${prefix}.selectedMatch`
  );

  const gridSnapshot = computed(
    (): CellContent[] => cells.map((cell) => cell()),
    `${prefix}.gridSnapshot`
  );

  const availableBuilds = computed((): BuildMatch[] => {
    gridSnapshot();
    return findMatches((i) => peek(cells[i]));
  }, `${prefix}.availableBuilds`);

  const score = computed(
    (): number => calculateGridScore(gridSnapshot()),
    `${prefix}.score`
  );

  const buildingCount = computed(
    (): number => gridSnapshot().filter((c) => c?.type === "building").length,
    `${prefix}.buildingCount`
  );

  const placeResource = action((index: number, resource: Resource) => {
    const content = peek(cells[index]);
    if (content !== null) {
      return;
    }
    cells[index]?.set({ resource, type: "resource" });
  }, `${prefix}.placeResource`);

  const removeResource = action((index: number) => {
    const content = peek(cells[index]);
    if (content?.type !== "resource") {
      return;
    }
    cells[index]?.set(null);
  }, `${prefix}.removeResource`);

  const selectMatch = action((match: BuildMatch | null) => {
    selectedMatch.set(match);
    highlightedCells.set(
      match ? new Set<number>(match.cells) : new Set<number>()
    );
  }, `${prefix}.selectMatch`);

  const buildAtCell = action((match: BuildMatch, targetIndex: number) => {
    for (const idx of match.cells) {
      cells[idx]?.set(null);
    }

    cells[targetIndex]?.set({
      building: match.building,
      type: "building",
    });

    selectedMatch.set(null);
    highlightedCells.set(new Set<number>());
  }, `${prefix}.buildAtCell`);

  const reset = action(() => {
    for (const cell of cells) {
      cell.set(null);
    }
    selectedResource.set(null);
    selectedMatch.set(null);
    highlightedCells.set(new Set<number>());
  }, `${prefix}.reset`);

  return {
    availableBuilds,
    buildAtCell,
    buildingCount,
    cells,
    highlightedCells,
    id,
    name,
    placeResource,
    removeResource,
    reset,
    score,
    selectMatch,
    selectedMatch,
    selectedResource,
  };
};

export type PlayerState = ReturnType<typeof reatomPlayer>;
