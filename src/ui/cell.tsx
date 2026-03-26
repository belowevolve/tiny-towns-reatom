import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { CellVM } from "../model/player-ui";
import { GRID_SIZE, RESOURCE_COLORS } from "../model/types";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { Text } from "../shared/ui/text";

export const Cell = ({ vm, index }: { vm: CellVM; index: number }) => {
  const hintId = `cell-hint-${index}`;

  const content = computed(() => {
    const c = vm.cellAtom();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return <ResourceSwatch resource={c.resource} />;
    }
    return BUILDINGS[c.building].icon;
  }, `cell#${index}.content`);

  const storedPreview = computed(() => {
    const stored = vm.storedResources();
    if (stored.length === 0) {
      return "";
    }
    return (
      <div
        css={`
          position: absolute;
          top: 3px;
          right: 3px;
          display: flex;
          gap: 2px;
        `}
      >
        {stored.map((r) => (
          <span
            css={`
              width: 10px;
              height: 10px;
              border-radius: 50%;
              border: 1.5px solid oklch(1 0 0 / 0.9);
              box-shadow: 0 0 2px oklch(0 0 0 / 0.2);
              display: block;

              @media (max-width: 400px) {
                width: 7px;
                height: 7px;
              }
            `}
            style:background={RESOURCE_COLORS[r]}
          />
        ))}
      </div>
    );
  }, `cell#${index}.storedPreview`);

  return (
    <button
      css={`
        padding: 0;
        color: inherit;
        border: 2px solid ${colors.border};
        border-radius: ${radius.md};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.15s ease;
        background: ${colors.cellBg};
        user-select: none;
        aspect-ratio: 1;
        position: relative;
        box-shadow: ${shadow.cell};

        &:hover {
          border-color: ${colors.borderHover};
          background: ${colors.surfaceHover};
        }

        &[data-resource="true"] {
          background: ${colors.cellResource};
          border-color: ${colors.borderHover};
        }

        &[data-building="true"] {
          background: ${colors.building};
          border-color: ${colors.buildingBorder};
        }

        &[data-highlighted="true"] {
          background: ${colors.highlightSoft};
          border-color: ${colors.highlight};
          box-shadow: 0 0 12px ${colors.highlightGlow};
        }

        &[data-buildable="true"] {
          background: ${colors.accentSoft};
          border-color: ${colors.accent};
          box-shadow: 0 0 10px oklch(0.69 0.07 135 / 0.3);
          animation: cell-pulse 1.2s ease-in-out infinite;
        }

        &[data-buildable="true"]:hover {
          background: ${colors.accent};
          border-color: ${colors.accentHover};
        }

        &[data-storable="true"] {
          border-color: ${colors.highlight};
          box-shadow: 0 0 10px ${colors.highlightGlow};
          animation: cell-pulse 1.2s ease-in-out infinite;
        }

        &[data-storable="true"]:hover {
          border-color: ${colors.accent};
          background: ${colors.accentSoft};
        }

        &[data-substitutable="true"] {
          border-color: ${colors.selected};
          box-shadow: 0 0 10px ${colors.selectedGlow};
          animation: cell-pulse 1.2s ease-in-out infinite;
        }

        &[data-substitutable="true"]:hover {
          border-color: ${colors.accent};
          background: ${colors.accentSoft};
        }

        @media (max-width: 400px) {
          font-size: 1.6rem;
          border-radius: ${radius.sm};
        }
      `}
      attr:data-buildable={vm.isBuildable}
      attr:data-building={vm.isBuilding}
      attr:data-highlighted={vm.isHighlighted}
      attr:data-resource={vm.isResource}
      attr:data-storable={vm.isStorable}
      attr:data-substitutable={vm.isSubstitutable}
      attr:interestfor={hintId}
      attr:style={`anchor-name: --${hintId}`}
      on:click={vm.click}
      data-row={Math.floor(index / GRID_SIZE)}
      data-col={index % GRID_SIZE}
    >
      {content}
      {storedPreview}
      <div
        id={hintId}
        popover="hint"
        attr:style={`position-anchor: --${hintId}; position-area: top;`}
        css={`
          margin: 0;
          padding: 8px 12px;
          border: 1px solid ${colors.border};
          border-radius: ${radius.sm};
          background: ${colors.surface};
          box-shadow: ${shadow.elevated};
          color: ${colors.text.base};
          max-width: 220px;
          inset: unset;
          position-area: top;
          margin-bottom: 6px;

          &[data-positive="true"] {
            border-color: ${colors.buildingBorder};
          }

          &[data-negative="true"] {
            border-color: ${colors.danger};
          }
        `}
        attr:data-negative={!vm.isPositiveScore}
        attr:data-positive={vm.isPositiveScore}
      >
        <Text size="sm" w="semibold">
          {vm.hintTitle}
        </Text>
        <Text
          size="xs"
          c="muted"
          css={`
            white-space: pre-line;
          `}
        >
          {vm.hintDesc}
        </Text>
        <Text
          size="md"
          w="bold"
          c={vm.isPositiveScore() ? "accent" : "danger"}
          css={`
            margin-top: 1px;
          `}
        >
          {vm.scoreText}
        </Text>
      </div>
    </button>
  );
};
