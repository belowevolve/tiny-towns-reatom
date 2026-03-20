import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerState } from "../model/player";
import type { BuildingType } from "../model/types";
import { BUILDING_TYPES, RESOURCE_COLORS } from "../model/types";

const RecipeCard = ({
  type,
  player,
}: {
  type: BuildingType;
  player: PlayerState;
}) => {
  const def = BUILDINGS[type];
  const maxDr = Math.max(...def.pattern.map((c) => c.dr));
  const maxDc = Math.max(...def.pattern.map((c) => c.dc));

  const patternGrid: (string | null)[][] = Array.from(
    { length: maxDr + 1 },
    () => Array.from({ length: maxDc + 1 }, () => null)
  );
  for (const cell of def.pattern) {
    patternGrid[cell.dr][cell.dc] = RESOURCE_COLORS[cell.resource];
  }

  const hasMatches = computed(
    () => player.availableBuilds().some((m) => m.building === type),
    `recipe.${type}.hasMatches`
  );

  const handleClick = () => {
    player.selectBuilding(type);
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", `building:${type}`);
  };

  return (
    <div
      class={[
        "recipe-card",
        {
          "recipe-card--available": hasMatches,
          "recipe-card--selected": () => player.selectedBuilding() === type,
          "recipe-card--unavailable": () =>
            !hasMatches() && player.selectedBuilding() !== type,
        },
      ]}
      on:click={handleClick}
      draggable={true}
      on:dragstart={handleDragStart}
    >
      <div class="recipe-header">
        <span class="recipe-building-icon">{def.icon}</span>
        <span>{def.name}</span>
      </div>
      <div
        class="recipe-grid"
        style:grid-template-columns={`repeat(${maxDc + 1}, 18px)`}
      >
        {patternGrid.flatMap((row) =>
          row.map((color) => (
            <div
              class={[
                "recipe-cell",
                {
                  "recipe-cell--empty": !color,
                },
              ]}
              attr:style={color ? `background: ${color}` : ""}
            />
          ))
        )}
      </div>
      <span class="recipe-description">{def.description}</span>
    </div>
  );
};

export const BuildPanel = ({ player }: { player: PlayerState }) => (
  <div class="build-panel">
    <h3 class="panel-title">Здания</h3>
    <div class="recipes-list">
      {BUILDING_TYPES.map((type) => (
        <RecipeCard type={type} player={player} />
      ))}
    </div>
  </div>
);
