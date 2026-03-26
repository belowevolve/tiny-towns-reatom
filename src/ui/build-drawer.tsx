import { computed } from "@reatom/core";
import { css } from "@reatom/jsx";

import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildMatch, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { palette, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";

const contentCss = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const titleCss = css`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${palette.text};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const subtitleCss = css`
  margin: 0;
  font-size: 0.8rem;
  color: ${palette.textMuted};
  text-align: center;
`;

const actionsCss = css`
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 4px;
`;

const variantListCss = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const variantCardCss = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: ${palette.cellBg};
  border: 2px solid ${palette.border};
  border-radius: ${radius.md};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${palette.borderHover};
    background: ${palette.surfaceHover};
  }

  &[data-selected="true"] {
    border-color: ${palette.highlight};
    background: ${palette.highlightSoft};
    box-shadow: 0 0 10px ${palette.highlightGlow};
  }
`;

const variantHeaderCss = css`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const variantInfoCss = css`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const variantGridCss = css`
  display: inline-grid;
  gap: 3px;
  justify-self: start;
`;

const miniCellCss = css`
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  background: ${palette.surface};
  border-radius: 4px;
  border: 1px solid ${palette.border};

  &[data-active="true"] {
    border-color: ${palette.borderHover};
  }
`;

const pickerListCss = css`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

const pickerItemCss = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: 2px solid ${palette.border};
  border-radius: ${radius.md};
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${palette.surface};
  font-family: inherit;

  &:hover {
    border-color: ${palette.accent};
    box-shadow: ${shadow.card};
    transform: translateY(-2px);
  }
`;

const pickerLabelCss = css`
  font-size: 0.72rem;
  color: ${palette.textMuted};
  font-weight: 500;
`;

const VariantCard = ({
  match,
  isSelected,
  onSelect,
}: {
  match: BuildMatch;
  isSelected: () => boolean;
  onSelect: () => void;
}) => {
  const def = BUILDINGS[match.building];

  const minR = Math.min(...match.cells.map((i) => Math.floor(i / GRID_SIZE)));
  const maxR = Math.max(...match.cells.map((i) => Math.floor(i / GRID_SIZE)));
  const minC = Math.min(...match.cells.map((i) => i % GRID_SIZE));
  const maxC = Math.max(...match.cells.map((i) => i % GRID_SIZE));
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const cellsLabel = match.cells
    .map((i) => `(${Math.floor(i / GRID_SIZE) + 1},${(i % GRID_SIZE) + 1})`)
    .join(" ");

  return (
    <div
      css={variantCardCss}
      attr:data-selected={String(isSelected())}
      on:click={onSelect}
    >
      <div css={variantHeaderCss}>
        <span css="font-size: 1.5rem; line-height: 1;">{def.icon}</span>
        <div css={variantInfoCss}>
          <span css="font-size: 0.9rem; font-weight: 600;">{def.name}</span>
          <span
            css={`
              font-size: 0.7rem;
              color: ${palette.textMuted};
            `}
          >
            {cellsLabel}
          </span>
        </div>
      </div>
      <div
        css={variantGridCss}
        style:grid-template-columns={`repeat(${cols}, 26px)`}
      >
        {Array.from({ length: rows }, (__, r) =>
          Array.from({ length: cols }, (___, c) => {
            const gridIndex = (minR + r) * GRID_SIZE + (minC + c);
            const inMatch = match.cells.includes(gridIndex);
            return (
              <div
                css={miniCellCss}
                attr:data-active={String(inMatch)}
                style:background={
                  inMatch
                    ? RESOURCE_COLORS[
                        def.pattern.find(
                          (_, pi) => match.cells[pi] === gridIndex
                        )?.resource ?? def.pattern[0].resource
                      ]
                    : undefined
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const ResourcePickerItem = ({
  resource,
  onPick,
}: {
  resource: Resource;
  onPick: () => void;
}) => (
  <button css={pickerItemCss} on:click={onPick}>
    <ResourceSwatch resource={resource} />
    <span css={pickerLabelCss}>{RESOURCE_NAMES[resource]}</span>
  </button>
);

export const BuildDrawer = ({ ui }: { ui: PlayerUIState }) => {
  const content = computed(() => {
    const mode = ui.drawerMode();
    if (!mode) {
      return <div />;
    }

    if (mode.type === "onBuild") {
      return (
        <div css={contentCss}>
          <h3 css={titleCss}>Выберите ресурс для хранения</h3>
          <div css={pickerListCss}>
            {mode.validResources.map((r) => (
              <ResourcePickerItem
                resource={r}
                onPick={() => ui.storeResourceOnBuilding(r)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (mode.type === "factorySwap") {
      return (
        <div css={contentCss}>
          <h3 css={titleCss}>
            🏭 Заменить <ResourceSwatch resource={mode.storedResource} small />{" "}
            {RESOURCE_NAMES[mode.storedResource]}
          </h3>
          <p css={subtitleCss}>Выберите ресурс для замены</p>
          <div css={pickerListCss}>
            {mode.available.map((r) => (
              <ResourcePickerItem
                resource={r}
                onPick={() => ui.confirmFactorySwap(r)}
              />
            ))}
          </div>
          <div css={actionsCss}>
            <Button variant="secondary" on:click={() => ui.cancelFactorySwap()}>
              Отмена
            </Button>
          </div>
        </div>
      );
    }

    if (mode.type === "warehouseSwap") {
      return (
        <div css={contentCss}>
          <h3 css={titleCss}>
            📦 Склад ← <ResourceSwatch resource={mode.incoming} small />{" "}
            {RESOURCE_NAMES[mode.incoming]}
          </h3>
          {mode.canStore && (
            <Button
              css="align-self: center;"
              on:click={() => ui.storeOnWarehouseFromPrompt()}
            >
              Положить на склад
            </Button>
          )}
          {mode.stored.length > 0 && (
            <>
              <p css={subtitleCss}>Или заменить:</p>
              <div css={pickerListCss}>
                {mode.stored.map((r, i) => (
                  <ResourcePickerItem
                    resource={r}
                    onPick={() => ui.confirmWarehouseSwap(i)}
                  />
                ))}
              </div>
            </>
          )}
          <div css={actionsCss}>
            <Button
              variant="secondary"
              on:click={() => ui.cancelWarehouseSwap()}
            >
              Отмена
            </Button>
          </div>
        </div>
      );
    }

    const { builds } = mode;

    return (
      <div css={contentCss}>
        <h3 css={titleCss}>Выберите вариант</h3>
        <div css={variantListCss}>
          {builds.map((match, i) => (
            <VariantCard
              match={match}
              isSelected={() => ui.drawerSelectedVariant() === i}
              onSelect={() => ui.selectDrawerVariant(i)}
            />
          ))}
        </div>
        <div css={actionsCss}>
          <Button
            disabled={computed(() => ui.drawerSelectedVariant() === null)}
            on:click={() => ui.confirmSelectedVariant()}
          >
            Построить
          </Button>
          <Button
            variant="secondary"
            on:click={() => ui.cancelVariantSelection()}
          >
            Отмена
          </Button>
        </div>
      </div>
    );
  }, "buildDrawer.content");

  return <>{content}</>;
};
