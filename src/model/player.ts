import { action, atom, computed, peek } from "@reatom/core";

import { calculateGridScore } from "./buildings";
import { findMatches } from "./patterns";
import type {
  BuildMatch,
  BuildingType,
  CellAtom,
  CellContent,
  Resource,
} from "./types";
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

  const selectedBuilding = atom<BuildingType | null>(
    null,
    `${prefix}.selectedBuilding`
  );

  const highlightedCells = atom<Set<number>>(
    new Set<number>(),
    `${prefix}.highlighted`
  );

  const pendingBuilds = atom<BuildMatch[]>([], `${prefix}.pendingBuilds`);
  const pendingTargetCell = atom<number | null>(
    null,
    `${prefix}.pendingTarget`
  );
  const drawerOpen = atom(false, `${prefix}.drawerOpen`);

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

  const selectBuilding = action((type: BuildingType | null) => {
    const next = type === peek(selectedBuilding) ? null : type;

    selectedBuilding.set(next);
    selectedResource.set(null);
    pendingBuilds.set([]);
    drawerOpen.set(false);
    pendingTargetCell.set(null);

    if (next) {
      const matches = findMatches((i) => peek(cells[i]), next);
      const cellSet = new Set<number>();
      for (const match of matches) {
        for (const idx of match.cells) {
          cellSet.add(idx);
        }
      }
      highlightedCells.set(cellSet);
    } else {
      highlightedCells.set(new Set<number>());
    }
  }, `${prefix}.selectBuilding`);

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

  const buildAtCell = action((match: BuildMatch, targetIndex: number) => {
    for (const idx of match.cells) {
      cells[idx]?.set(null);
    }

    cells[targetIndex]?.set({
      building: match.building,
      type: "building",
    });

    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);
    drawerOpen.set(false);
  }, `${prefix}.buildAtCell`);

  const tryBuildAt = action((cellIndex: number) => {
    const building = peek(selectedBuilding);
    if (!building) {
      return;
    }

    const matches = findMatches((i) => peek(cells[i]), building);
    const matchesAtCell = matches.filter((m) => m.cells.includes(cellIndex));

    if (matchesAtCell.length === 0) {
      return;
    }

    if (matchesAtCell.length === 1) {
      buildAtCell(matchesAtCell[0], cellIndex);
      return;
    }

    pendingBuilds.set(matchesAtCell);
    pendingTargetCell.set(cellIndex);
    drawerOpen.set(true);
  }, `${prefix}.tryBuildAt`);

  const confirmBuild = action((match: BuildMatch) => {
    const target = peek(pendingTargetCell);
    if (target === null) {
      return;
    }
    buildAtCell(match, target);
  }, `${prefix}.confirmBuild`);

  const previewVariant = action((match: BuildMatch | null) => {
    if (match) {
      highlightedCells.set(new Set<number>(match.cells));
    } else {
      const building = peek(selectedBuilding);
      if (building) {
        const matches = findMatches((i) => peek(cells[i]), building);
        const cellSet = new Set<number>();
        for (const m of matches) {
          for (const idx of m.cells) {
            cellSet.add(idx);
          }
        }
        highlightedCells.set(cellSet);
      } else {
        highlightedCells.set(new Set<number>());
      }
    }
  }, `${prefix}.previewVariant`);

  const cancelBuild = action(() => {
    pendingBuilds.set([]);
    pendingTargetCell.set(null);
    drawerOpen.set(false);

    const building = peek(selectedBuilding);
    if (building) {
      const matches = findMatches((i) => peek(cells[i]), building);
      const cellSet = new Set<number>();
      for (const m of matches) {
        for (const idx of m.cells) {
          cellSet.add(idx);
        }
      }
      highlightedCells.set(cellSet);
    } else {
      highlightedCells.set(new Set<number>());
    }
  }, `${prefix}.cancelBuild`);

  const reset = action(() => {
    for (const cell of cells) {
      cell.set(null);
    }
    selectedResource.set(null);
    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);
    drawerOpen.set(false);
  }, `${prefix}.reset`);

  return {
    availableBuilds,
    buildAtCell,
    buildingCount,
    cancelBuild,
    cells,
    confirmBuild,
    drawerOpen,
    highlightedCells,
    id,
    name,
    pendingBuilds,
    pendingTargetCell,
    placeResource,
    previewVariant,
    removeResource,
    reset,
    score,
    selectBuilding,
    selectedBuilding,
    selectedResource,
    tryBuildAt,
  };
};

export type PlayerState = ReturnType<typeof reatomPlayer>;
