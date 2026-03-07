import { BUILDINGS } from "./buildings";
import type {
  BuildMatch,
  BuildingType,
  CellContent,
  PatternCell,
} from "./types";
import { BUILDING_TYPES, GRID_SIZE } from "./types";

const normalizePattern = (pattern: PatternCell[]): PatternCell[] => {
  if (pattern.length === 0) {
    return pattern;
  }
  const minDr = Math.min(...pattern.map((c) => c.dr));
  const minDc = Math.min(...pattern.map((c) => c.dc));
  const shifted = pattern.map(
    (c): PatternCell => ({
      dc: c.dc - minDc,
      dr: c.dr - minDr,
      resource: c.resource,
    })
  );
  shifted.sort((a, b) => a.dr - b.dr || a.dc - b.dc);
  return shifted;
};

const rotatePattern90 = (pattern: PatternCell[]): PatternCell[] =>
  normalizePattern(
    pattern.map((c) => ({ dc: -c.dr, dr: c.dc, resource: c.resource }))
  );

const mirrorPattern = (pattern: PatternCell[]): PatternCell[] =>
  normalizePattern(
    pattern.map((c) => ({ dc: -c.dc, dr: c.dr, resource: c.resource }))
  );

const patternKey = (pattern: PatternCell[]): string =>
  pattern.map((c) => `${c.dr},${c.dc},${c.resource}`).join("|");

export const generateVariants = (pattern: PatternCell[]): PatternCell[][] => {
  const seen = new Set<string>();
  const variants: PatternCell[][] = [];

  let current = normalizePattern(pattern);
  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (const variant of [current, mirrorPattern(current)]) {
      const key = patternKey(variant);
      if (!seen.has(key)) {
        seen.add(key);
        variants.push(variant);
      }
    }
    current = rotatePattern90(current);
  }

  return variants;
};

const allVariantsCache = new Map<BuildingType, PatternCell[][]>();

export const getBuildingVariants = (type: BuildingType): PatternCell[][] => {
  let cached = allVariantsCache.get(type);
  if (!cached) {
    cached = generateVariants(BUILDINGS[type].pattern);
    allVariantsCache.set(type, cached);
  }
  return cached;
};

export const findMatches = (
  getCellContent: (index: number) => CellContent
): BuildMatch[] => {
  const matches: BuildMatch[] = [];

  for (const buildingType of BUILDING_TYPES) {
    const variants = getBuildingVariants(buildingType);

    for (const variant of variants) {
      for (let anchorRow = 0; anchorRow < GRID_SIZE; anchorRow += 1) {
        for (let anchorCol = 0; anchorCol < GRID_SIZE; anchorCol += 1) {
          const cellIndices: number[] = [];
          let valid = true;

          for (const cell of variant) {
            const row = anchorRow + cell.dr;
            const col = anchorCol + cell.dc;

            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
              valid = false;
              break;
            }

            const index = row * GRID_SIZE + col;
            const content = getCellContent(index);
            if (
              !content ||
              content.type !== "resource" ||
              content.resource !== cell.resource
            ) {
              valid = false;
              break;
            }

            cellIndices.push(index);
          }

          if (valid) {
            matches.push({ building: buildingType, cells: cellIndices });
          }
        }
      }
    }
  }

  return matches;
};
