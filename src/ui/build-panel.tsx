import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerState } from "../model/player";
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
    <div class="recipe-card">
      <div class="recipe-header">
        <span class="recipe-building-icon">{def.icon}</span>
        <span>{def.name}</span>
      </div>
      <div
        class="recipe-grid"
        style:grid-template-columns={`repeat(${maxDc + 1}, 22px)`}
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
  player,
}: {
  match: BuildMatch;
  player: PlayerState;
}) => {
  const def = BUILDINGS[match.building];

  const isSelected = computed(() => {
    const sel = player.selectedMatch();
    return sel?.key === match.key;
  }, `match.${match.key}.selected`);

  const btnClass = computed(
    () => (isSelected() ? "match-btn match-btn--active" : "match-btn"),
    `match.${match.key}.class`
  );

  const cellsLabel = match.cells
    .map((i) => `(${Math.floor(i / GRID_SIZE) + 1},${(i % GRID_SIZE) + 1})`)
    .join(" ");

  return (
    <button
      class={btnClass}
      on:click={() => player.selectMatch(isSelected() ? null : match)}
    >
      <span>{def.icon}</span>
      <span>
        {def.name} {cellsLabel}
      </span>
    </button>
  );
};

export const BuildPanel = ({ player }: { player: PlayerState }) => {
  const matchList = computed(() => {
    const builds = player.availableBuilds();
    if (builds.length === 0) {
      return <div class="no-matches">Нет доступных построек</div>;
    }
    return (
      <div class="match-list">
        {builds.map((match) => (
          <MatchButton match={match} player={player} />
        ))}
      </div>
    );
  }, "buildPanel.matchList");

  return (
    <div class="build-panel">
      <h3 class="panel-title">Рецепты</h3>
      <div class="recipes-list">
        {BUILDING_TYPES.map((type) => (
          <RecipeCard type={type} />
        ))}
      </div>

      <h3 class="panel-title">Постройки</h3>
      {matchList}
      <div class="hint-text">
        Выберите постройку, затем кликните на подсвеченную клетку
      </div>
    </div>
  );
};
