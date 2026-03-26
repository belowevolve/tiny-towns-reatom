import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildingType } from "../model/types";
import { BUILDING_TYPES, RESOURCE_COLORS } from "../model/types";
import { palette, radius, shadow } from "../shared/ui/design-system";

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
      css={`
        flex-shrink: 0;
        min-width: 110px;
        padding: 8px 10px;
        background: ${palette.surface};
        border: 1px solid ${palette.border};
        border-radius: ${radius.md};
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: ${shadow.cell};
        scroll-snap-align: start;

        &[data-selected="true"] {
          border-color: ${palette.selected};
          background: ${palette.selectedSoft};
          box-shadow: 0 0 0 2px ${palette.selectedGlow};
        }

        &[data-available="true"] {
          cursor: pointer;
          border-color: ${palette.accent};
        }

        &[data-available="true"]:hover {
          background: ${palette.surfaceHover};
          border-color: ${palette.accentHover};
        }

        &[data-unavailable="true"] {
          opacity: 0.5;
          cursor: default;
        }
      `}
      attr:data-available={bvm.hasMatches}
      attr:data-selected={bvm.isSelected}
      attr:data-unavailable={bvm.isUnavailable}
      on:click={() => ui.selectBuilding(type)}
    >
      <div
        css={`
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        `}
      >
        <span css="font-size: 1rem;">{def.icon}</span>
        <span>{def.name}</span>
      </div>
      <div
        css={`
          display: inline-grid;
          gap: 2px;
        `}
        style:grid-template-columns={`repeat(${maxDc + 1}, 18px)`}
      >
        {patternGrid.flatMap((row) =>
          row.map((color) => (
            <div
              css={`
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.65rem;
                border-radius: 3px;
                border: 1px solid oklch(0 0 0 / 0.08);

                &[data-empty="true"] {
                  opacity: 0.15;
                  background: ${palette.cellBg};
                  border-color: transparent;
                }
              `}
              attr:data-empty={!color}
              style:background={color}
            />
          ))
        )}
      </div>
      <span
        css={`
          font-size: 0.6rem;
          color: ${palette.textMuted};
          line-height: 1.2;
        `}
      >
        {def.description}
      </span>
    </div>
  );
};

export const BuildPanel = ({ ui }: { ui: PlayerUIState }) => (
  <div
    css={`
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `}
  >
    <h3
      css={`
        display: block;
        margin: 0;
        font-size: 0.7rem;
        font-weight: 600;
        color: ${palette.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.1em;
      `}
    >
      Здания
    </h3>
    <div
      css={`
        display: flex;
        flex-direction: row;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scroll-snap-type: x proximity;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
          height: 4px;
        }

        &::-webkit-scrollbar-track {
          background: ${palette.cellBg};
          border-radius: 2px;
        }

        &::-webkit-scrollbar-thumb {
          background: ${palette.borderHover};
          border-radius: 2px;
        }
      `}
    >
      {BUILDING_TYPES.map((type) => (
        <RecipeCard type={type} ui={ui} />
      ))}
    </div>
  </div>
);
