import { computed } from "@reatom/core";
import { css } from "@reatom/jsx";

import { BUILDINGS } from "../model/buildings";
import type { CellVM } from "../model/player-ui";
import { GRID_SIZE, RESOURCE_COLORS } from "../model/types";
import {
  palette,
  pulseAnimation,
  radius,
  shadow,
} from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";

const cellCss = css`
  padding: 0;
  color: inherit;
  border: 2px solid ${palette.border};
  border-radius: ${radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${palette.cellBg};
  user-select: none;
  aspect-ratio: 1;
  position: relative;
  box-shadow: ${shadow.cell};

  &:hover {
    border-color: ${palette.borderHover};
    background: ${palette.surfaceHover};
  }

  &[data-resource="true"] {
    background: ${palette.cellResource};
    border-color: ${palette.borderHover};
  }

  &[data-building="true"] {
    background: ${palette.building};
    border-color: ${palette.buildingBorder};
  }

  &[data-highlighted="true"] {
    background: ${palette.highlightSoft};
    border-color: ${palette.highlight};
    box-shadow: 0 0 12px ${palette.highlightGlow};
  }

  &[data-buildable="true"] {
    background: ${palette.accentSoft};
    border-color: ${palette.accent};
    box-shadow: 0 0 10px rgba(124, 154, 110, 0.3);
    ${pulseAnimation}
  }

  &[data-buildable="true"]:hover {
    background: ${palette.accent};
    border-color: ${palette.accentHover};
  }

  &[data-storable="true"] {
    border-color: ${palette.highlight};
    box-shadow: 0 0 10px ${palette.highlightGlow};
    ${pulseAnimation}
  }

  &[data-storable="true"]:hover {
    border-color: ${palette.accent};
    background: ${palette.accentSoft};
  }

  &[data-substitutable="true"] {
    border-color: ${palette.selected};
    box-shadow: 0 0 10px ${palette.selectedGlow};
    ${pulseAnimation}
  }

  &[data-substitutable="true"]:hover {
    border-color: ${palette.accent};
    background: ${palette.accentSoft};
  }

  @media (max-width: 400px) {
    font-size: 1.6rem;
    border-radius: ${radius.sm};
  }
`;

const storedPreviewCss = css`
  position: absolute;
  top: 3px;
  right: 3px;
  display: flex;
  gap: 2px;
`;

const dotCss = css`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  display: block;

  @media (max-width: 400px) {
    width: 7px;
    height: 7px;
  }
`;

const popoverCss = css`
  margin: 0;
  padding: 8px 12px;
  border: 1px solid ${palette.border};
  border-radius: ${radius.sm};
  background: ${palette.surface};
  box-shadow: ${shadow.elevated};
  color: ${palette.text};
  max-width: 220px;
  inset: unset;
  position-area: top;
  margin-bottom: 6px;

  &[data-positive="true"] {
    border-color: ${palette.buildingBorder};
  }

  &[data-negative="true"] {
    border-color: ${palette.danger};
  }
`;

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
      <div css={storedPreviewCss}>
        {stored.map((r) => (
          <span css={dotCss} style:background={RESOURCE_COLORS[r]} />
        ))}
      </div>
    );
  }, `cell#${index}.storedPreview`);

  return (
    <button
      css={cellCss}
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
        css={popoverCss}
        attr:data-negative={!vm.isPositiveScore}
        attr:data-positive={vm.isPositiveScore}
      >
        <div css="font-weight: 600; font-size: 0.8rem; line-height: 1.2;">
          {vm.hintTitle}
        </div>
        <div
          css={`
            font-size: 0.7rem;
            color: ${palette.textMuted};
            line-height: 1.3;
            white-space: pre-line;
          `}
        >
          {vm.hintDesc}
        </div>
        <div
          css={computed(
            () =>
              `font-weight: 700; font-size: 0.85rem; margin-top: 1px; color: ${vm.isPositiveScore() ? palette.accent : palette.danger};`
          )}
        >
          {vm.scoreText}
        </div>
      </div>
    </button>
  );
};
