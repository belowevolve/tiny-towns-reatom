import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildingType } from "../model/types";
import { BUILDING_TYPES, RESOURCE_COLORS } from "../model/types";

const RecipeCard = ({
  type,
  ui,
}: {
  type: BuildingType;
  ui: PlayerUIState;
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

  const bvm = ui.buildingVMs[type];

  return (
    <div
      class={[
        "recipe-card",
        {
          "recipe-card--available": bvm.hasMatches,
          "recipe-card--selected": bvm.isSelected,
          "recipe-card--unavailable": bvm.isUnavailable,
        },
      ]}
      on:click={() => ui.selectBuilding(type)}
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
              class={["recipe-cell", { "recipe-cell--empty": !color }]}
              attr:style={color ? `background: ${color}` : ""}
            />
          ))
        )}
      </div>
      <span class="recipe-description">{def.description}</span>
    </div>
  );
};

export const BuildPanel = ({ ui }: { ui: PlayerUIState }) => (
  <div class="build-panel">
    <h3 class="panel-title">Здания</h3>
    <div class="recipes-list">
      {BUILDING_TYPES.map((type) => (
        <RecipeCard type={type} ui={ui} />
      ))}
    </div>
  </div>
);
