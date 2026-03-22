import { action, atom, computed, peek } from "@reatom/core";

import { BUILDINGS, calculateGridScore } from "./buildings";
import { findMatches } from "./patterns";
import type {
  BuildMatch,
  CellAtom,
  CellContent,
  OnBuildEffect,
  Resource,
} from "./types";
import { GRID_SIZE, RESOURCES } from "./types";

export const reatomPlayer = (id: string, name: string) => {
  const prefix = `player#${id}`;

  const cells: CellAtom[] = Array.from(
    { length: GRID_SIZE * GRID_SIZE },
    (_, i) => atom<CellContent>(null, `${prefix}.cell#${i}`)
  );

  const resourceOverride = atom<Resource | null>(
    null,
    `${prefix}.resourceOverride`
  );

  const hasPlacedResource = atom(false, `${prefix}.hasPlacedResource`);

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

  const scoreDetails = computed((): string => {
    const snap = gridSnapshot();
    const buildings = snap.filter((c) => c?.type === "building").length;
    const resources = snap.filter((c) => c?.type === "resource").length;
    const empty = snap.filter((c) => c === null).length;
    const parts: string[] = [];
    if (buildings > 0) {
      parts.push(`${buildings} зд.`);
    }
    if (resources > 0) {
      parts.push(`${resources} рес.`);
    }
    if (empty > 0) {
      parts.push(`${empty} пусто`);
    }
    return parts.join(" · ");
  }, `${prefix}.scoreDetails`);

  const isBoardFull = computed(
    (): boolean => gridSnapshot().every((c) => c !== null),
    `${prefix}.isBoardFull`
  );

  const buildingCount = computed(
    (): number => gridSnapshot().filter((c) => c?.type === "building").length,
    `${prefix}.buildingCount`
  );

  const restrictedResources = computed((): Set<Resource> => {
    const grid = gridSnapshot();
    const restricted = new Set<Resource>();
    for (const c of grid) {
      if (c?.type !== "building") {
        continue;
      }
      const hook = BUILDINGS[c.building].hooks?.masterBuilderRestriction;
      if (hook) {
        for (const r of hook(c.stored)) {
          restricted.add(r);
        }
      }
    }
    return restricted;
  }, `${prefix}.restrictedResources`);

  const availableResources = computed((): Resource[] => {
    const restricted = restrictedResources();
    return RESOURCES.filter((r) => !restricted.has(r));
  }, `${prefix}.availableResources`);

  const placeResource = action((index: number, resource: Resource) => {
    const content = peek(cells[index]);
    if (content !== null) {
      return;
    }
    cells[index]?.set({ resource, type: "resource" });
    hasPlacedResource.set(true);
    resourceOverride.set(null);
  }, `${prefix}.placeResource`);

  const removeResource = action((index: number) => {
    const content = peek(cells[index]);
    if (content?.type !== "resource") {
      return;
    }
    cells[index]?.set(null);
  }, `${prefix}.removeResource`);

  const storeOnWarehouse = action(
    (warehouseIndex: number, resource: Resource) => {
      const content = peek(cells[warehouseIndex]);
      if (content?.type !== "building") {
        return;
      }
      const def = BUILDINGS[content.building];
      const capacity = def.storageCapacity ?? 0;
      if (content.stored.length >= capacity) {
        return;
      }

      cells[warehouseIndex]?.set({
        ...content,
        stored: [...content.stored, resource],
      });
    },
    `${prefix}.storeOnWarehouse`
  );

  const swapWarehouseResource = action(
    (warehouseIndex: number, incoming: Resource, swapIdx: number) => {
      const content = peek(cells[warehouseIndex]);
      if (content?.type !== "building") {
        return;
      }
      if (swapIdx < 0 || swapIdx >= content.stored.length) {
        return;
      }

      const newStored = [...content.stored];
      newStored[swapIdx] = incoming;
      cells[warehouseIndex]?.set({ ...content, stored: newStored });
    },
    `${prefix}.swapWarehouse`
  );

  const buildAtCell = action(
    (match: BuildMatch, targetIndex: number): OnBuildEffect | null => {
      for (const idx of match.cells) {
        if (!match.wildcardCells.includes(idx)) {
          cells[idx]?.set(null);
        }
      }

      cells[targetIndex]?.set({
        building: match.building,
        stored: [],
        type: "building",
      });

      const def = BUILDINGS[match.building];
      const hook = def.hooks?.onBuild;
      if (hook) {
        const grid = cells.map((c) => peek(c));
        return (
          hook({
            buildingIndex: targetIndex,
            buildingType: match.building,
            grid,
          }) ?? null
        );
      }
      return null;
    },
    `${prefix}.buildAtCell`
  );

  const storeResourceOnBuilding = action(
    (buildingIndex: number, resource: Resource) => {
      const content = peek(cells[buildingIndex]);
      if (content?.type !== "building") {
        return;
      }
      const def = BUILDINGS[content.building];
      const capacity = def.storageCapacity ?? 0;
      if (content.stored.length >= capacity) {
        return;
      }

      cells[buildingIndex]?.set({
        ...content,
        stored: [...content.stored, resource],
      });
    },
    `${prefix}.storeResource`
  );

  const applyGrid = action((grid: CellContent[], placed: boolean) => {
    for (let i = 0; i < cells.length; i += 1) {
      cells[i]?.set(grid[i] ?? null);
    }
    hasPlacedResource.set(placed);
  }, `${prefix}.applyGrid`);

  const reset = action(() => {
    for (const cell of cells) {
      cell.set(null);
    }
    resourceOverride.set(null);
    hasPlacedResource.set(false);
  }, `${prefix}.reset`);

  return {
    applyGrid,
    availableBuilds,
    availableResources,
    buildAtCell,
    buildingCount,
    cells,
    gridSnapshot,
    hasPlacedResource,
    id,
    isBoardFull,
    name,
    placeResource,
    removeResource,
    reset,
    resourceOverride,
    restrictedResources,
    score,
    scoreDetails,
    storeOnWarehouse,
    storeResourceOnBuilding,
    swapWarehouseResource,
  };
};

export type PlayerState = ReturnType<typeof reatomPlayer>;
