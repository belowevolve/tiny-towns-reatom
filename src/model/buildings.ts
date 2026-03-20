import type {
  BuildingDef,
  BuildingType,
  CellContent,
  PlacementOption,
  Resource,
  ScoringContext,
} from "./types";
import { GRID_SIZE, RESOURCES } from "./types";

const getAdjacentIndices = (index: number, gridSize: number): number[] => {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  const adj: number[] = [];
  if (row > 0) {
    adj.push((row - 1) * gridSize + col);
  }
  if (row < gridSize - 1) {
    adj.push((row + 1) * gridSize + col);
  }
  if (col > 0) {
    adj.push(row * gridSize + (col - 1));
  }
  if (col < gridSize - 1) {
    adj.push(row * gridSize + (col + 1));
  }
  return adj;
};

const isBuilding = (
  cell: CellContent,
  type: BuildingType
): cell is { type: "building"; building: BuildingType; stored: Resource[] } =>
  cell?.type === "building" && cell.building === type;

const FEED_CAPACITY: Partial<Record<BuildingType, number>> = {
  farm: 4,
};

const countFeedCapacity = (ctx: ScoringContext): number => {
  let capacity = 0;
  for (const b of ctx.allBuildings) {
    capacity += FEED_CAPACITY[b.type] ?? 0;
  }
  return capacity;
};

const isCottageFed = (_cottageIndex: number, ctx: ScoringContext): boolean => {
  const cottages = ctx.allBuildings.filter((b) => b.type === "cottage");
  const capacity = countFeedCapacity(ctx);
  const cottagePos = cottages.findIndex((c) => c.index === _cottageIndex);
  return cottagePos !== -1 && cottagePos < capacity;
};

const isAdjacentToFeeder = (index: number, ctx: ScoringContext): boolean => {
  const adj = getAdjacentIndices(index, ctx.gridSize);
  return adj.some((i) => {
    const cell = ctx.grid[i];
    return (
      cell?.type === "building" && FEED_CAPACITY[cell.building] !== undefined
    );
  });
};

const TAVERN_SCORES = [0, 2, 5, 9, 14, 20];

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  bakery: {
    description: "3 очка если рядом есть здание-кормилец (ферма)",
    icon: "🍞",
    name: "Пекарня",
    pattern: [
      { dc: 1, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 1, dr: 1, resource: "glass" },
      { dc: 2, dr: 1, resource: "brick" },
    ],
    score: (ctx) => (isAdjacentToFeeder(ctx.index, ctx) ? 3 : 0),
  },

  bank: {
    description:
      "4 VP. При постройке — положить уникальный ресурс. Как главный стороить вы больше не можете исопльзовать этот ресурс",
    hooks: {
      masterBuilderRestriction: (stored) => [...stored],
      onBuild: (ctx) => {
        const banks = new Set(
          ctx.grid
            .filter(
              (c): c is Extract<CellContent, { type: "building" }> =>
                c?.type === "building" && c.building === "bank"
            )
            .flatMap((c) => c.stored)
        );
        const valid = RESOURCES.filter((r) => !banks.has(r));
        return { type: "promptStoreResource", validResources: valid };
      },
    },
    icon: "🏦",
    name: "Банк",
    pattern: [
      { dc: 0, dr: 0, resource: "wheat" },
      { dc: 1, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "glass" },
      { dc: 2, dr: 1, resource: "brick" },
    ],
    score: () => 4,
    storageCapacity: 1,
  },

  chapel: {
    description: '1 очко за каждый "накормленный" коттедж на поле',
    icon: "⛪",
    name: "Часовня",
    pattern: [
      { dc: 2, dr: 0, resource: "glass" },
      { dc: 0, dr: 1, resource: "stone" },
      { dc: 1, dr: 1, resource: "glass" },
      { dc: 2, dr: 1, resource: "stone" },
    ],
    score: (ctx) =>
      ctx.allBuildings
        .filter((b) => b.type === "cottage")
        .filter((b) => isCottageFed(b.index, ctx)).length,
  },

  cottage: {
    description: "3 очка если снабжён (ферма кормит до 4 в любом месте)",
    icon: "🏡",
    name: "Коттедж",
    pattern: [
      { dc: 1, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 1, dr: 1, resource: "glass" },
    ],
    score: (ctx) => (isCottageFed(ctx.index, ctx) ? 3 : 0),
  },

  factory: {
    description:
      "При постройке — положить ресурс. Можно менять тип при размещении.",
    hooks: {
      modifyPlacement: () => [{ type: "substituteResource" }],
      onBuild: () => ({ type: "promptStoreResource" }),
    },
    icon: "🏭",
    name: "Фабрика",
    pattern: [
      { dc: 0, dr: 0, resource: "wood" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "stone" },
      { dc: 3, dr: 1, resource: "brick" },
    ],
    score: () => 0,
    storageCapacity: 1,
  },

  farm: {
    description: "Кормит до 4 коттеджей в любом месте города.",
    icon: "🌻",
    name: "Ферма",
    pattern: [
      { dc: 0, dr: 0, resource: "wheat" },
      { dc: 1, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "wood" },
    ],
    score: () => 0,
  },

  tavern: {
    description: "Очки за группу: 2 / 5 / 9 / 14 / 20",
    icon: "🍺",
    name: "Таверна",
    pattern: [
      { dc: 0, dr: 0, resource: "brick" },
      { dc: 1, dr: 0, resource: "brick" },
      { dc: 2, dr: 0, resource: "glass" },
    ],
    score: (ctx) => {
      const taverns = ctx.allBuildings.filter((b) => b.type === "tavern");
      if (taverns[0]?.index !== ctx.index) {
        return 0;
      }
      return TAVERN_SCORES[Math.min(taverns.length, TAVERN_SCORES.length - 1)];
    },
  },

  tradingPost: {
    description: "1 VP. Считается любым ресурсом для будущих построек",
    hooks: {
      matchAsResource: () => true,
    },
    icon: "🏪",
    name: "Торговый пост",
    pattern: [
      { dc: 0, dr: 0, resource: "stone" },
      { dc: 1, dr: 0, resource: "wood" },
      { dc: 0, dr: 1, resource: "stone" },
      { dc: 1, dr: 1, resource: "wood" },
      { dc: 2, dr: 1, resource: "brick" },
    ],
    score: () => 1,
  },

  warehouse: {
    description:
      "-1 VP за каждый хранимый ресурс (до 3). Можно хранить/менять.",
    hooks: {
      modifyPlacement: (_announced, ctx) => {
        const options: PlacementOption[] = [];
        if (ctx.stored.length < 3) {
          options.push({ type: "storeOnBuilding" });
        }
        if (ctx.stored.length > 0) {
          options.push({ type: "swapWithStored" });
        }
        return options;
      },
    },
    icon: "📦",
    name: "Склад",
    pattern: [
      { dc: 0, dr: 0, resource: "wheat" },
      { dc: 1, dr: 0, resource: "wood" },
      { dc: 2, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 2, dr: 1, resource: "brick" },
    ],
    score: (ctx) => {
      const cell = ctx.grid[ctx.index];
      if (cell?.type !== "building") {
        return 0;
      }
      return -cell.stored.length;
    },
    storageCapacity: 3,
  },

  well: {
    description: "1 очко за каждый смежный коттедж",
    icon: "⛲",
    name: "Колодец",
    pattern: [
      { dc: 0, dr: 0, resource: "wood" },
      { dc: 1, dr: 0, resource: "stone" },
    ],
    score: (ctx) => {
      const adj = getAdjacentIndices(ctx.index, ctx.gridSize);
      return adj.filter((i) => isBuilding(ctx.grid[i], "cottage")).length;
    },
  },
};

//

export const EMPTY_CELL_PENALTY = -1;

const collectBuildings = (
  grid: CellContent[]
): { type: BuildingType; index: number; stored: Resource[] }[] => {
  const result: { type: BuildingType; index: number; stored: Resource[] }[] =
    [];
  for (let i = 0; i < grid.length; i += 1) {
    const c = grid[i];
    if (c?.type === "building") {
      result.push({ index: i, stored: c.stored, type: c.building });
    }
  }
  return result;
};

export const calculateCellScore = (
  grid: CellContent[],
  index: number
): number => {
  const cell = grid[index];
  if (!cell || cell.type !== "building") {
    return EMPTY_CELL_PENALTY;
  }

  const ctx: ScoringContext = {
    allBuildings: collectBuildings(grid),
    grid,
    gridSize: GRID_SIZE,
    index,
  };

  return BUILDINGS[cell.building].score(ctx);
};

export const calculateGridScore = (grid: CellContent[]): number => {
  const allBuildings = collectBuildings(grid);
  const emptyCount = grid.length - allBuildings.length;

  let total = emptyCount * EMPTY_CELL_PENALTY;

  for (const b of allBuildings) {
    const ctx: ScoringContext = {
      allBuildings,
      grid,
      gridSize: GRID_SIZE,
      index: b.index,
    };
    total += BUILDINGS[b.type].score(ctx);
  }

  return total;
};
