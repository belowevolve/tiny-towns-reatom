import { action, atom, computed, peek } from "@reatom/core";

import { BUILDINGS, calculateGridScore } from "./buildings";
import { findMatches } from "./patterns";
import type {
  BuildMatch,
  BuildingType,
  CellAtom,
  CellContent,
  OnBuildEffect,
  Resource,
} from "./types";
import { GRID_SIZE, RESOURCES } from "./types";

const buildableTargets = (matches: BuildMatch[]): Set<number> => {
  const cellSet = new Set<number>();
  for (const match of matches) {
    for (const idx of match.cells) {
      if (!match.wildcardCells.includes(idx)) {
        cellSet.add(idx);
      }
    }
  }
  return cellSet;
};

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

  const pendingBuildEffect = atom<OnBuildEffect | null>(
    null,
    `${prefix}.pendingBuildEffect`
  );
  const pendingBuildIndex = atom<number | null>(
    null,
    `${prefix}.pendingBuildIndex`
  );

  const pendingWarehouseSwap = atom<{
    warehouseIndex: number;
    incoming: Resource;
    stored: Resource[];
    canStore: boolean;
  } | null>(null, `${prefix}.pendingWarehouseSwap`);

  const pendingFactorySwap = atom<{
    storedResource: Resource;
  } | null>(null, `${prefix}.pendingFactorySwap`);

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

  const selectBuilding = action((type: BuildingType | null) => {
    const next = type === peek(selectedBuilding) ? null : type;

    selectedBuilding.set(next);
    pendingBuilds.set([]);
    drawerOpen.set(false);
    pendingTargetCell.set(null);

    if (next) {
      const matches = findMatches((i) => peek(cells[i]), next);
      highlightedCells.set(buildableTargets(matches));
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

  const initiateWarehouseStore = action(
    (warehouseIndex: number, resource: Resource) => {
      const content = peek(cells[warehouseIndex]);
      if (content?.type !== "building") {
        return;
      }
      const def = BUILDINGS[content.building];
      const capacity = def.storageCapacity ?? 0;
      const hasCapacity = content.stored.length < capacity;
      const alreadyStored = content.stored.includes(resource);

      if (alreadyStored && hasCapacity) {
        storeOnWarehouse(warehouseIndex, resource);
        hasPlacedResource.set(true);
        return;
      }

      if (!alreadyStored && content.stored.length > 0) {
        pendingWarehouseSwap.set({
          canStore: hasCapacity,
          incoming: resource,
          stored: [...content.stored],
          warehouseIndex,
        });
        drawerOpen.set(true);
        return;
      }

      if (hasCapacity) {
        storeOnWarehouse(warehouseIndex, resource);
        hasPlacedResource.set(true);
      }
    },
    `${prefix}.initiateWarehouseStore`
  );

  const confirmWarehouseSwap = action((swapIdx: number) => {
    const swap = peek(pendingWarehouseSwap);
    if (!swap) {
      return;
    }

    const content = peek(cells[swap.warehouseIndex]);
    if (content?.type !== "building") {
      return;
    }
    if (swapIdx < 0 || swapIdx >= content.stored.length) {
      return;
    }

    const swappedOut = content.stored[swapIdx];
    swapWarehouseResource(swap.warehouseIndex, swap.incoming, swapIdx);

    resourceOverride.set(swappedOut);
    pendingWarehouseSwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.confirmWarehouseSwap`);

  const cancelWarehouseSwap = action(() => {
    pendingWarehouseSwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.cancelWarehouseSwap`);

  const storeOnWarehouseFromPrompt = action(() => {
    const swap = peek(pendingWarehouseSwap);
    if (!swap) {
      return;
    }
    storeOnWarehouse(swap.warehouseIndex, swap.incoming);
    pendingWarehouseSwap.set(null);
    drawerOpen.set(false);
    hasPlacedResource.set(true);
  }, `${prefix}.storeFromPrompt`);

  const activateFactory = action((factoryIndex: number) => {
    const content = peek(cells[factoryIndex]);
    if (content?.type !== "building" || content.stored.length === 0) {
      return;
    }
    pendingFactorySwap.set({ storedResource: content.stored[0] });
    drawerOpen.set(true);
  }, `${prefix}.activateFactory`);

  const confirmFactorySwap = action((resource: Resource) => {
    resourceOverride.set(resource);
    pendingFactorySwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.confirmFactorySwap`);

  const cancelFactorySwap = action(() => {
    pendingFactorySwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.cancelFactorySwap`);

  const buildAtCell = action((match: BuildMatch, targetIndex: number) => {
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

    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);

    const def = BUILDINGS[match.building];
    const hook = def.hooks?.onBuild;
    if (hook) {
      const grid = cells.map((c) => peek(c));
      const effect = hook({
        buildingIndex: targetIndex,
        buildingType: match.building,
        grid,
      });
      if (effect) {
        pendingBuildEffect.set(effect);
        pendingBuildIndex.set(targetIndex);
        drawerOpen.set(true);
        return;
      }
    }

    drawerOpen.set(false);
  }, `${prefix}.buildAtCell`);

  const storeResourceOnBuilding = action((resource: Resource) => {
    const idx = peek(pendingBuildIndex);
    if (idx === null) {
      return;
    }
    const content = peek(cells[idx]);
    if (content?.type !== "building") {
      return;
    }
    const def = BUILDINGS[content.building];
    const capacity = def.storageCapacity ?? 0;
    if (content.stored.length >= capacity) {
      return;
    }

    cells[idx]?.set({
      ...content,
      stored: [...content.stored, resource],
    });

    pendingBuildEffect.set(null);
    pendingBuildIndex.set(null);
    drawerOpen.set(false);
  }, `${prefix}.storeResource`);

  const tryBuildAt = action((cellIndex: number) => {
    const building = peek(selectedBuilding);
    if (!building) {
      return;
    }

    const matches = findMatches((i) => peek(cells[i]), building);
    const matchesAtCell = matches.filter(
      (m) => m.cells.includes(cellIndex) && !m.wildcardCells.includes(cellIndex)
    );

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
      const nonWild = match.cells.filter(
        (idx) => !match.wildcardCells.includes(idx)
      );
      highlightedCells.set(new Set<number>(nonWild));
    } else {
      const building = peek(selectedBuilding);
      if (building) {
        const matches = findMatches((i) => peek(cells[i]), building);
        highlightedCells.set(buildableTargets(matches));
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
      highlightedCells.set(buildableTargets(matches));
    } else {
      highlightedCells.set(new Set<number>());
    }
  }, `${prefix}.cancelBuild`);

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
    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);
    drawerOpen.set(false);
    pendingBuildEffect.set(null);
    pendingBuildIndex.set(null);
    pendingWarehouseSwap.set(null);
    pendingFactorySwap.set(null);
    hasPlacedResource.set(false);
  }, `${prefix}.reset`);

  return {
    activateFactory,
    applyGrid,
    availableBuilds,
    availableResources,
    buildAtCell,
    buildingCount,
    cancelBuild,
    cancelFactorySwap,
    cancelWarehouseSwap,
    cells,
    confirmBuild,
    confirmFactorySwap,
    confirmWarehouseSwap,
    drawerOpen,
    gridSnapshot,
    hasPlacedResource,
    highlightedCells,
    id,
    initiateWarehouseStore,
    name,
    pendingBuildEffect,
    pendingBuildIndex,
    pendingBuilds,
    pendingFactorySwap,
    pendingTargetCell,
    pendingWarehouseSwap,
    placeResource,
    previewVariant,
    removeResource,
    reset,
    resourceOverride,
    restrictedResources,
    score,
    selectBuilding,
    selectedBuilding,
    storeOnWarehouse,
    storeOnWarehouseFromPrompt,
    storeResourceOnBuilding,
    swapWarehouseResource,
    tryBuildAt,
  };
};

export type PlayerState = ReturnType<typeof reatomPlayer>;
