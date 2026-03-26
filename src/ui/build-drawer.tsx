import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildMatch, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { Text } from "../shared/ui/text";

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
        <Text size="xl" lh="none">
          {def.icon}
        </Text>
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 1px;
          `}
        >
          <Text size="md" w="semibold">
            {def.name}
          </Text>
          <Text
            size="xs"
            c="muted"
            css={`
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {cellsLabel}
          </Text>
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
}) => (
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
    <Text size="xs" c="muted" w="medium">
      {RESOURCE_NAMES[resource]}
    </Text>
  </Button>
);

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
          <Text
            as="h3"
            size="md"
            w="semibold"
            css={`
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            `}
          >
            Выберите ресурс для хранения
          </Text>
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
          <Text
            as="h3"
            size="md"
            w="semibold"
            css={`
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
          </Text>
          <Text
            as="p"
            size="sm"
            c="muted"
            css={`
              margin: 0;
              text-align: center;
            `}
          >
            Выберите ресурс для замены
          </Text>
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
          <Text
            as="h3"
            size="md"
            w="semibold"
            css={`
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
          </Text>
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
              <Text
                as="p"
                size="sm"
                c="muted"
                css={`
                  margin: 0;
                  text-align: center;
                `}
              >
                Или заменить:
              </Text>
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
        <Text
          as="h3"
          size="md"
          w="semibold"
          css={`
            margin: 0;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          `}
        >
          Выберите вариант
        </Text>
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
