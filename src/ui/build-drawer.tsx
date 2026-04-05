import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildMatch, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { text } from "../shared/ui/text";

const VariantCard = ({
  match,
  isSelected,
  onSelect,
}: {
  match: BuildMatch;
  isSelected: boolean;
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
      css={`
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: ${colors.cellBg};
        border: 2px solid ${colors.border};
        border-radius: ${radius.md};
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: ${colors.borderHover};
          background: ${colors.surfaceHover};
        }

        &[data-selected="true"] {
          border-color: ${colors.highlight};
          background: ${colors.highlightSoft};
          box-shadow: 0 0 10px ${colors.highlightGlow};
        }
      `}
      attr:data-selected={isSelected}
      on:click={onSelect}
    >
      <div
        css={`
          display: flex;
          align-items: center;
          gap: 10px;
        `}
      >
        <span css={text({ size: "xl" })}>{def.icon}</span>
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 1px;
          `}
        >
          <span css={text({ fw: "semibold" })}>{def.name}</span>
          <span
            css={`
              ${text({ c: "muted", size: "xs" })}
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {cellsLabel}
          </span>
        </div>
      </div>
      <div
        css={`
          display: inline-grid;
          gap: 3px;
          justify-self: start;
        `}
        style:grid-template-columns={`repeat(${cols}, 26px)`}
      >
        {Array.from({ length: rows }, (__, r) =>
          Array.from({ length: cols }, (___, c) => {
            const gridIndex = (minR + r) * GRID_SIZE + (minC + c);
            const inMatch = match.cells.includes(gridIndex);
            return (
              <div
                css={`
                  width: 26px;
                  height: 26px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 0.8rem;
                  background: ${colors.surface};
                  border-radius: 4px;
                  border: 1px solid ${colors.border};

                  &[data-active="true"] {
                    border-color: ${colors.borderHover};
                  }
                `}
                attr:data-active={inMatch}
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
}) => {
  return (
    <Button
      size="icon"
      variant="secondary"
      css={`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        border: 2px solid ${colors.border};
        border-radius: ${radius.md};
        cursor: pointer;
        background: ${colors.surface};

        &:hover {
          border-color: ${colors.accent};
          box-shadow: ${shadow.card};
          transform: translateY(-2px);
        }
      `}
      on:click={onPick}
    >
      <ResourceSwatch resource={resource} />
      <span css={text({ c: "muted", size: "xs" })}>
        {RESOURCE_NAMES[resource]}
      </span>
    </Button>
  );
};

export const BuildDrawer = ({ ui }: { ui: PlayerUIState }) => {
  const content = computed(() => {
    const mode = ui.drawerMode();
    if (!mode) {
      return <div />;
    }

    if (mode.type === "onBuild") {
      return (
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 16px;
          `}
        >
          <h3
            css={`
              ${text({ fw: "semibold" })}
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            `}
          >
            Выберите ресурс для хранения
          </h3>
          <div
            css={`
              display: flex;
              gap: 8px;
              justify-content: center;
              flex-wrap: wrap;
            `}
          >
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
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 16px;
          `}
        >
          <h3
            css={`
              ${text({ fw: "semibold" })}
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            `}
          >
            🏭 Заменить{" "}
            <ResourceSwatch resource={mode.storedResource} size="sm" />{" "}
            {RESOURCE_NAMES[mode.storedResource]}
          </h3>
          <p
            css={`
              ${text({ c: "muted", size: "sm" })}
              margin: 0;
              text-align: center;
            `}
          >
            Выберите ресурс для замены
          </p>
          <div
            css={`
              display: flex;
              gap: 8px;
              justify-content: center;
              flex-wrap: wrap;
            `}
          >
            {mode.available.map((r) => (
              <ResourcePickerItem
                resource={r}
                onPick={() => ui.confirmFactorySwap(r)}
              />
            ))}
          </div>
          <div
            css={`
              display: flex;
              gap: 10px;
              justify-content: center;
              padding-top: 4px;
            `}
          >
            <Button variant="secondary" on:click={() => ui.cancelFactorySwap()}>
              Отмена
            </Button>
          </div>
        </div>
      );
    }

    if (mode.type === "warehouseSwap") {
      return (
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 16px;
          `}
        >
          <h3
            css={`
              ${text({ fw: "semibold" })}
              margin: 0;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            `}
          >
            📦 Склад ← <ResourceSwatch resource={mode.incoming} size="sm" />{" "}
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
              <p
                css={`
                  ${text({ c: "muted", size: "sm" })}
                  margin: 0;
                  text-align: center;
                `}
              >
                Или заменить:
              </p>
              <div
                css={`
                  display: flex;
                  gap: 8px;
                  justify-content: center;
                  flex-wrap: wrap;
                `}
              >
                {mode.stored.map((r, i) => (
                  <ResourcePickerItem
                    resource={r}
                    onPick={() => ui.confirmWarehouseSwap(i)}
                  />
                ))}
              </div>
            </>
          )}
          <div
            css={`
              display: flex;
              gap: 10px;
              justify-content: center;
              padding-top: 4px;
            `}
          >
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
      <div
        css={`
          display: flex;
          flex-direction: column;
          gap: 16px;
        `}
      >
        <h3
          css={`
            ${text({ fw: "semibold" })}
            margin: 0;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          `}
        >
          Выберите вариант
        </h3>
        <div
          css={`
            display: flex;
            flex-direction: row;
            gap: 8px;
          `}
        >
          {builds.map((match, i) => (
            <VariantCard
              match={match}
              isSelected={ui.drawerSelectedVariant() === i}
              onSelect={() => ui.selectDrawerVariant(i)}
            />
          ))}
        </div>
        <div
          css={`
            display: flex;
            gap: 10px;
            justify-content: center;
            padding-top: 4px;
          `}
        >
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
