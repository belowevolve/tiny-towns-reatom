import { action, atom, computed, peek } from "@reatom/core";

import { BUILDINGS, calculateCellScore } from "./buildings";
import { game, localPlayerId } from "./game";
import { sendGridSync } from "./multiplayer/sync";
import { findMatches } from "./patterns";
import type { PlayerState } from "./player";
import type {
  BuildMatch,
  BuildingType,
  OnBuildEffect,
  Resource,
} from "./types";
import {
  BUILDING_TYPES,
  RESOURCES,
  RESOURCE_ICONS,
  RESOURCE_NAMES,
} from "./types";

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

export type DrawerMode =
  | { type: "variants"; builds: BuildMatch[] }
  | { type: "onBuild"; validResources: Resource[] }
  | {
      type: "warehouseSwap";
      incoming: Resource;
      stored: Resource[];
      canStore: boolean;
      warehouseIndex: number;
    }
  | { type: "factorySwap"; storedResource: Resource; available: Resource[] }
  | null;

export const reatomPlayerUI = (player: PlayerState) => {
  const prefix = `playerUI#${player.id}`;
  const { cells } = player;

  // ─── Raw UI state atoms ─────────────────────────────────────────

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
  const pendingFactorySwap = atom<{ storedResource: Resource } | null>(
    null,
    `${prefix}.pendingFactorySwap`
  );
  const drawerSelectedVariant = atom<number | null>(
    null,
    `${prefix}.drawerVariant`
  );

  // ─── UI actions ────────────────────────────────────────────────

  const selectBuilding = action((type: BuildingType | null) => {
    if (!peek(player.hasPlacedResource)) {
      return;
    }

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

  const buildAtCell = action((match: BuildMatch, targetIndex: number) => {
    const effect = player.buildAtCell(match, targetIndex);
    sendGridSync();

    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);

    if (effect) {
      pendingBuildEffect.set(effect);
      pendingBuildIndex.set(targetIndex);
      drawerOpen.set(true);
      return;
    }
    drawerOpen.set(false);
  }, `${prefix}.buildAtCell`);

  const storeResourceOnBuilding = action((resource: Resource) => {
    const idx = peek(pendingBuildIndex);
    if (idx === null) {
      return;
    }

    player.storeResourceOnBuilding(idx, resource);
    sendGridSync();
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
    drawerSelectedVariant.set(null);

    const building = peek(selectedBuilding);
    if (building) {
      const matches = findMatches((i) => peek(cells[i]), building);
      highlightedCells.set(buildableTargets(matches));
    } else {
      highlightedCells.set(new Set<number>());
    }
  }, `${prefix}.cancelBuild`);

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
        player.storeOnWarehouse(warehouseIndex, resource);
        player.hasPlacedResource.set(true);
        sendGridSync();
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
        player.storeOnWarehouse(warehouseIndex, resource);
        player.hasPlacedResource.set(true);
        sendGridSync();
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
    player.swapWarehouseResource(swap.warehouseIndex, swap.incoming, swapIdx);
    sendGridSync();

    player.resourceOverride.set(swappedOut);
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

    player.storeOnWarehouse(swap.warehouseIndex, swap.incoming);
    sendGridSync();
    pendingWarehouseSwap.set(null);
    drawerOpen.set(false);
    player.hasPlacedResource.set(true);
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
    player.resourceOverride.set(resource);
    pendingFactorySwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.confirmFactorySwap`);

  const cancelFactorySwap = action(() => {
    pendingFactorySwap.set(null);
    drawerOpen.set(false);
  }, `${prefix}.cancelFactorySwap`);

  // ─── Drawer computed state ─────────────────────────────────────

  const drawerMode = computed((): DrawerMode => {
    const effect = pendingBuildEffect();
    if (effect) {
      const valid = effect.validResources?.length
        ? effect.validResources
        : [...RESOURCES];
      return { type: "onBuild", validResources: valid };
    }
    const factory = pendingFactorySwap();
    if (factory) {
      return {
        available: RESOURCES.filter((r) => r !== factory.storedResource),
        storedResource: factory.storedResource,
        type: "factorySwap",
      };
    }
    const warehouse = pendingWarehouseSwap();
    if (warehouse) {
      return {
        canStore: warehouse.canStore,
        incoming: warehouse.incoming,
        stored: warehouse.stored,
        type: "warehouseSwap",
        warehouseIndex: warehouse.warehouseIndex,
      };
    }
    const builds = pendingBuilds();
    if (builds.length > 0) {
      return { builds, type: "variants" };
    }
    return null;
  }, `${prefix}.drawerMode`);

  const closeDrawer = action(() => {
    if (peek(pendingBuildEffect)) {
      return;
    }
    if (peek(pendingFactorySwap)) {
      cancelFactorySwap();
      return;
    }
    if (peek(pendingWarehouseSwap)) {
      cancelWarehouseSwap();
      return;
    }
    cancelBuild();
  }, `${prefix}.closeDrawer`);

  const selectDrawerVariant = action((index: number) => {
    drawerSelectedVariant.set(index);
    const builds = peek(pendingBuilds);
    if (builds[index]) {
      previewVariant(builds[index]);
    }
  }, `${prefix}.selectVariant`);

  const confirmSelectedVariant = action(() => {
    const idx = peek(drawerSelectedVariant);
    const builds = peek(pendingBuilds);
    if (idx !== null && builds[idx]) {
      confirmBuild(builds[idx]);
      drawerSelectedVariant.set(null);
    }
  }, `${prefix}.confirmVariant`);

  const cancelVariantSelection = action(() => {
    cancelBuild();
    drawerSelectedVariant.set(null);
  }, `${prefix}.cancelVariant`);

  // ─── Cell click handler ────────────────────────────────────────

  const handleCellClick = action((cellIndex: number) => {
    if (peek(selectedBuilding)) {
      if (!peek(player.hasPlacedResource)) {
        selectBuilding(null);
        return;
      }
      if (peek(highlightedCells).has(cellIndex)) {
        tryBuildAt(cellIndex);
      } else {
        selectBuilding(null);
      }
      return;
    }

    const resource =
      peek(player.resourceOverride) ?? peek(game.currentResource);
    if (!resource || peek(player.hasPlacedResource)) {
      return;
    }

    const cellContent = peek(cells[cellIndex]);

    if (
      cellContent?.type === "building" &&
      peek(player.resourceOverride) === null
    ) {
      const mb = peek(game.currentMasterBuilder);
      if (mb?.id !== peek(localPlayerId)) {
        const def = BUILDINGS[cellContent.building];
        if (def.hooks?.modifyPlacement) {
          const grid = cells.map((c) => peek(c));
          const options = def.hooks.modifyPlacement(resource, {
            buildingIndex: cellIndex,
            grid,
            stored: cellContent.stored,
          });

          if (
            cellContent.stored.length > 0 &&
            options.some((o) => o.type === "substituteResource")
          ) {
            activateFactory(cellIndex);
            return;
          }

          if (
            options.some(
              (o) => o.type === "storeOnBuilding" || o.type === "swapWithStored"
            )
          ) {
            initiateWarehouseStore(cellIndex, resource);
            return;
          }
        }
      }
    }

    if (!cellContent) {
      player.placeResource(cellIndex, resource);
      sendGridSync();
    }
  }, `${prefix}.handleCellClick`);

  // ─── Cell view models ──────────────────────────────────────────

  const createCellVM = (index: number) => {
    const cellAtom = cells[index];

    const isHighlighted = computed(
      () => highlightedCells().has(index),
      `${prefix}.c${index}.hl`
    );

    const isBuildable = computed(
      () => isHighlighted() && selectedBuilding() !== null,
      `${prefix}.c${index}.bld`
    );

    const isEmpty = computed(() => !cellAtom(), `${prefix}.c${index}.empty`);

    const isResource = computed(
      () => cellAtom()?.type === "resource",
      `${prefix}.c${index}.res`
    );

    const isBuilding = computed(
      () => cellAtom()?.type === "building",
      `${prefix}.c${index}.bldg`
    );

    const specialActions = computed(
      (): { storable: boolean; substitutable: boolean } => {
        if (selectedBuilding() !== null) {
          return { storable: false, substitutable: false };
        }
        if (player.resourceOverride() !== null) {
          return { storable: false, substitutable: false };
        }
        if (game.currentMasterBuilder()?.id === localPlayerId()) {
          return { storable: false, substitutable: false };
        }
        const c = cellAtom();
        if (c?.type !== "building") {
          return { storable: false, substitutable: false };
        }
        const def = BUILDINGS[c.building];
        if (!def.hooks?.modifyPlacement) {
          return { storable: false, substitutable: false };
        }
        const resource = game.currentResource();
        if (!resource) {
          return { storable: false, substitutable: false };
        }
        const options = def.hooks.modifyPlacement(resource, {
          buildingIndex: index,
          grid: player.gridSnapshot(),
          stored: c.stored,
        });
        return {
          storable: options.some(
            (o) => o.type === "storeOnBuilding" || o.type === "swapWithStored"
          ),
          substitutable:
            c.stored.length > 0 &&
            options.some((o) => o.type === "substituteResource"),
        };
      },
      `${prefix}.c${index}.spec`
    );

    const isStorable = computed(
      () => specialActions().storable,
      `${prefix}.c${index}.stor`
    );
    const isSubstitutable = computed(
      () => specialActions().substitutable,
      `${prefix}.c${index}.sub`
    );

    const storedResources = computed((): Resource[] => {
      const c = cellAtom();
      if (!c || c.type !== "building") {
        return [];
      }
      return c.stored;
    }, `${prefix}.c${index}.strd`);

    const hint = computed((): { title: string; desc: string } => {
      const c = cellAtom();
      if (!c) {
        return { desc: "Штраф за пустую ячейку", title: "Пустая клетка" };
      }
      if (c.type === "resource") {
        return {
          desc: "Штраф если ресурс останется",
          title: `${RESOURCE_ICONS[c.resource]} ${RESOURCE_NAMES[c.resource]}`,
        };
      }
      const b = BUILDINGS[c.building];
      const desc =
        c.stored.length > 0
          ? `${b.description}\nХранится: ${c.stored.map((r) => RESOURCE_NAMES[r]).join(", ")}`
          : b.description;
      return { desc, title: `${b.icon} ${b.name}` };
    }, `${prefix}.c${index}.hint`);

    const hintTitle = computed(() => hint().title, `${prefix}.c${index}.hT`);
    const hintDesc = computed(() => hint().desc, `${prefix}.c${index}.hD`);

    const cellScore = computed(
      () => calculateCellScore(player.gridSnapshot(), index),
      `${prefix}.c${index}.score`
    );

    const isPositiveScore = computed(
      () => cellScore() > 0,
      `${prefix}.c${index}.pos`
    );

    const scoreText = computed(() => {
      const s = cellScore();
      return s > 0 ? `+${s}` : String(s);
    }, `${prefix}.c${index}.sTxt`);

    return {
      cellAtom,
      click: () => handleCellClick(index),
      hintDesc,
      hintTitle,
      isBuildable,
      isBuilding,
      isEmpty,
      isHighlighted,
      isPositiveScore,
      isResource,
      isStorable,
      isSubstitutable,
      scoreText,
      storedResources,
    };
  };

  const cellVMs = cells.map((_, i) => createCellVM(i));

  // ─── Building view models ──────────────────────────────────────

  const buildingVMs = Object.fromEntries(
    BUILDING_TYPES.map((type) => [
      type,
      {
        hasMatches: computed(
          () => player.availableBuilds().some((m) => m.building === type),
          `${prefix}.bld.${type}.has`
        ),
        isSelected: computed(
          () => selectedBuilding() === type,
          `${prefix}.bld.${type}.sel`
        ),
        isUnavailable: computed(
          () =>
            !player.availableBuilds().some((m) => m.building === type) &&
            selectedBuilding() !== type,
          `${prefix}.bld.${type}.unav`
        ),
      },
    ])
  ) as Record<
    BuildingType,
    {
      hasMatches: ReturnType<typeof computed<boolean>>;
      isSelected: ReturnType<typeof computed<boolean>>;
      isUnavailable: ReturnType<typeof computed<boolean>>;
    }
  >;

  // ─── Reset ─────────────────────────────────────────────────────

  const reset = action(() => {
    selectedBuilding.set(null);
    highlightedCells.set(new Set<number>());
    pendingBuilds.set([]);
    pendingTargetCell.set(null);
    drawerOpen.set(false);
    pendingBuildEffect.set(null);
    pendingBuildIndex.set(null);
    pendingWarehouseSwap.set(null);
    pendingFactorySwap.set(null);
    drawerSelectedVariant.set(null);
  }, `${prefix}.reset`);

  return {
    buildingVMs,
    cancelFactorySwap,
    cancelVariantSelection,
    cancelWarehouseSwap,
    cellVMs,
    closeDrawer,
    confirmFactorySwap,
    confirmSelectedVariant,
    confirmWarehouseSwap,
    drawerMode,
    drawerOpen,
    drawerSelectedVariant,
    handleCellClick,
    player,
    reset,
    selectBuilding,
    selectDrawerVariant,
    storeOnWarehouseFromPrompt,
    storeResourceOnBuilding,
  };
};

export type PlayerUIState = ReturnType<typeof reatomPlayerUI>;
export type CellVM = PlayerUIState["cellVMs"][number];

export const localPlayerUI = atom<PlayerUIState | null>(null, "localPlayerUI");
