import type {
  BuildingDef,
  BuildingType,
  CellContent,
  ScoringContext,
} from "./types";
import { GRID_SIZE } from "./types";

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
): cell is { type: "building"; building: BuildingType } =>
  cell?.type === "building" && cell.building === type;

const FEEDER_BUILDINGS: ReadonlySet<BuildingType> = new Set<BuildingType>([
  "well",
  "factory",
]);

const isCottageFed = (cottageIndex: number, ctx: ScoringContext): boolean => {
  const adj = getAdjacentIndices(cottageIndex, ctx.gridSize);
  return adj.some((i) => {
    const cell = ctx.grid[i];
    return cell?.type === "building" && FEEDER_BUILDINGS.has(cell.building);
  });
};

const TAVERN_SCORES = [0, 1, 4, 9, 17];

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  chapel: {
    description: '1 очко за каждый "накормленный" коттедж на поле',
    icon: "⛪",
    name: "Часовня",
    pattern: [
      { dc: 1, dr: 0, resource: "glass" },
      { dc: 0, dr: 1, resource: "stone" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "glass" },
    ],
    score: (ctx) =>
      ctx.allBuildings
        .filter((b) => b.type === "cottage")
        .filter((b) => isCottageFed(b.index, ctx)).length,
  },

  cottage: {
    description: "3 очка если рядом есть источник еды (колодец/фабрика)",
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
    description: "Источник еды для коттеджей. 0 очков за себя",
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
  },

  tavern: {
    description: "Очки растут с количеством: 1 / 4 / 9 / 17",
    icon: "🍺",
    name: "Таверна",
    pattern: [
      { dc: 0, dr: 0, resource: "brick" },
      { dc: 1, dr: 0, resource: "brick" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "wheat" },
    ],
    score: (ctx) => {
      const tavernCount = ctx.allBuildings.filter(
        (b) => b.type === "tavern"
      ).length;
      const total =
        TAVERN_SCORES[Math.min(tavernCount, TAVERN_SCORES.length - 1)] ?? 0;
      return Math.floor(total / tavernCount);
    },
  },

  theater: {
    description:
      "1 очко за каждый уникальный тип здания в его строке и столбце",
    icon: "🎭",
    name: "Театр",
    pattern: [
      { dc: 1, dr: 0, resource: "glass" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "wood" },
      { dc: 1, dr: 2, resource: "glass" },
    ],
    score: (ctx) => {
      const row = Math.floor(ctx.index / ctx.gridSize);
      const col = ctx.index % ctx.gridSize;
      const uniqueTypes = new Set<BuildingType>();

      for (const b of ctx.allBuildings) {
        if (b.index === ctx.index) {
          continue;
        }
        const bRow = Math.floor(b.index / ctx.gridSize);
        const bCol = b.index % ctx.gridSize;
        if (bRow === row || bCol === col) {
          uniqueTypes.add(b.type);
        }
      }

      return uniqueTypes.size;
    },
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

export const EMPTY_CELL_PENALTY = -1;

export const calculateGridScore = (grid: CellContent[]): number => {
  const allBuildings: { type: BuildingType; index: number }[] = [];
  let emptyCount = 0;

  for (let i = 0; i < grid.length; i += 1) {
    const cell = grid[i];
    if (cell?.type === "building") {
      allBuildings.push({ index: i, type: cell.building });
    } else if (cell === null) {
      emptyCount += 1;
    }
  }

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
