import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import { availableBuilds, selectMatch, selectedMatch } from "../model/game";
import type { BuildMatch, BuildingType } from "../model/types";
import { BUILDING_TYPES, GRID_SIZE, RESOURCE_ICONS } from "../model/types";

const RecipeCard = ({ type }: { type: BuildingType }) => {
  const def = BUILDINGS[type];
  const maxDr = Math.max(...def.pattern.map((c) => c.dr));
  const maxDc = Math.max(...def.pattern.map((c) => c.dc));

  const patternGrid: (string | null)[][] = Array.from(
    { length: maxDr + 1 },
    () => Array.from({ length: maxDc + 1 }, () => null)
  );
  for (const cell of def.pattern) {
    patternGrid[cell.dr][cell.dc] = RESOURCE_ICONS[cell.resource];
  }

  return (
    <div
      css={`
        padding: 8px;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .recipe-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
        }

        .recipe-header span:first-child {
          font-size: 1.3rem;
        }

        .recipe-grid {
          display: inline-grid;
          gap: 2px;
          justify-self: center;
        }

        .recipe-cell {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          background: #222;
          border-radius: 3px;
        }

        .recipe-cell--empty {
          opacity: 0.2;
        }
      `}
    >
      <div class="recipe-header">
        <span>{def.icon}</span>
        <span>{def.name}</span>
      </div>
      <div
        class="recipe-grid"
        style:grid-template-columns={`repeat(${maxDc + 1}, 24px)`}
      >
        {patternGrid.flatMap((row) =>
          row.map((icon) => (
            <div
              class={icon ? "recipe-cell" : "recipe-cell recipe-cell--empty"}
            >
              {icon ?? "·"}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MatchButton = ({
  match,
  index,
}: {
  match: BuildMatch;
  index: number;
}) => {
  const def = BUILDINGS[match.building];

  const isSelected = computed(() => {
    const sel = selectedMatch();
    if (!sel) {
      return false;
    }
    return (
      sel.building === match.building &&
      sel.cells.join(",") === match.cells.join(",")
    );
  }, `matchBtn#${index}.selected`);

  const btnClass = computed(
    () => (isSelected() ? "match-btn match-btn--active" : "match-btn"),
    `matchBtn#${index}.class`
  );

  const cellsLabel = match.cells
    .map((i) => `(${Math.floor(i / GRID_SIZE)},${i % GRID_SIZE})`)
    .join(" ");

  return (
    <button
      class={btnClass}
      on:click={() => selectMatch(isSelected() ? null : match)}
      css={`
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        color: #ddd;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        text-align: left;

        &:hover {
          background: #333;
          border-color: #666;
        }

        &.match-btn--active {
          background: #3a2a1a;
          border-color: #f0a030;
        }
      `}
    >
      <span>{def.icon}</span>
      <span>
        {def.name} {cellsLabel}
      </span>
    </button>
  );
};

export const BuildPanel = () => {
  const matchList = computed(() => {
    const builds = availableBuilds();
    if (builds.length === 0) {
      return <div class="no-matches">Нет доступных построек</div>;
    }
    return (
      <div class="match-list">
        {builds.map((match, i) => (
          <MatchButton match={match} index={i} />
        ))}
      </div>
    );
  }, "buildPanel.matchList");

  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 180px;

        h3 {
          margin: 0;
          font-size: 0.9rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .recipes {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .no-matches {
          font-size: 0.8rem;
          color: #666;
          padding: 8px;
        }

        .match-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hint {
          font-size: 0.75rem;
          color: #777;
          padding: 4px 0;
        }
      `}
    >
      <h3>Рецепты</h3>
      <div class="recipes">
        {BUILDING_TYPES.map((type) => (
          <RecipeCard type={type} />
        ))}
      </div>

      <h3>Доступные постройки</h3>
      {matchList}
      <div class="hint">
        Выберите постройку, затем кликните на подсвеченную клетку, куда
        поставить здание
      </div>
    </div>
  );
};
