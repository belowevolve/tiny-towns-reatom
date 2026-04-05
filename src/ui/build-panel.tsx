import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildingType } from "../model/types";
import { BUILDING_TYPES, RESOURCE_COLORS } from "../model/types";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { flex } from "../shared/ui/flex";
import { text } from "../shared/ui/text";

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
        background: ${colors.surface};
        border: 1px solid ${colors.border};
        border-radius: ${radius.md};
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: ${shadow.cell};
        scroll-snap-align: start;

        &[data-selected="true"] {
          border-color: ${colors.selected};
          background: ${colors.selectedSoft};
          box-shadow: 0 0 0 2px ${colors.selectedGlow};
        }

        &[data-available="true"] {
          cursor: pointer;
          border-color: ${colors.accent};
        }

        &[data-available="true"]:hover {
          background: ${colors.surfaceHover};
          border-color: ${colors.accentHover};
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
      <div css={flex({ align: "center", direction: "row", gap: 1 })}>
        <span css={text({ size: "sm" })}>{def.icon}</span>
        <span css={text({ size: "xs" })}>{def.name}</span>
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
                  background: ${colors.cellBg};
                  border-color: transparent;
                }
              `}
              attr:data-empty={!color}
              style:background={color}
            />
          ))
        )}
      </div>
      <span css={text({ c: "muted", size: "xs" })}>{def.description}</span>
    </div>
  );
};

export const BuildPanel = ({ ui }: { ui: PlayerUIState }) => {
  return (
    <div
      css={`
        ${flex({ gap: 1.5 })}
        min-width: 0;
      `}
    >
      <span css={text({ c: "muted", fw: "semibold", size: "xs" })}>Здания</span>
      <div
        css={`
          ${flex({ direction: "row", gap: 2 })}
          overflow-x: auto;
          padding-bottom: 4px;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;

          &::-webkit-scrollbar {
            height: 4px;
          }

          &::-webkit-scrollbar-track {
            background: ${colors.cellBg};
            border-radius: 2px;
          }

          &::-webkit-scrollbar-thumb {
            background: ${colors.borderHover};
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
};
