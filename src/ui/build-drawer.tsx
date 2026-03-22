import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerUIState } from "../model/player-ui";
import type { BuildMatch, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";

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
      class={["variant-card", { "variant-card--selected": isSelected }]}
      on:click={onSelect}
    >
      <div class="variant-header">
        <span class="variant-icon">{def.icon}</span>
        <div class="variant-info">
          <span class="variant-name">{def.name}</span>
          <span class="variant-cells">{cellsLabel}</span>
        </div>
      </div>
      <div
        class="variant-grid"
        style:grid-template-columns={`repeat(${cols}, 26px)`}
      >
        {Array.from({ length: rows }, (__, r) =>
          Array.from({ length: cols }, (___, c) => {
            const gridIndex = (minR + r) * GRID_SIZE + (minC + c);
            const inMatch = match.cells.includes(gridIndex);
            return (
              <div
                class={[
                  "variant-mini-cell",
                  { "variant-mini-cell--active": inMatch },
                ]}
                attr:style={
                  inMatch
                    ? `background: ${RESOURCE_COLORS[def.pattern.find((_, pi) => match.cells[pi] === gridIndex)?.resource ?? def.pattern[0].resource]}`
                    : ""
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
  <button class="resource-picker-item" on:click={onPick}>
    <span
      class="resource-swatch"
      attr:style={`background: ${RESOURCE_COLORS[resource]}`}
    />
    <span class="resource-picker-label">{RESOURCE_NAMES[resource]}</span>
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
        <div class="build-drawer-content">
          <h3 class="drawer-title">Выберите ресурс для хранения</h3>
          <div class="resource-picker-list">
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
        <div class="build-drawer-content">
          <h3 class="drawer-title">
            🏭 Заменить{" "}
            <span
              class="resource-swatch resource-swatch--sm"
              attr:style={`background: ${RESOURCE_COLORS[mode.storedResource]}`}
            />{" "}
            {RESOURCE_NAMES[mode.storedResource]}
          </h3>
          <p class="drawer-subtitle">Выберите ресурс для замены</p>
          <div class="resource-picker-list">
            {mode.available.map((r) => (
              <ResourcePickerItem
                resource={r}
                onPick={() => ui.confirmFactorySwap(r)}
              />
            ))}
          </div>
          <div class="drawer-actions">
            <button
              class="btn-secondary"
              on:click={() => ui.cancelFactorySwap()}
            >
              Отмена
            </button>
          </div>
        </div>
      );
    }

    if (mode.type === "warehouseSwap") {
      return (
        <div class="build-drawer-content">
          <h3 class="drawer-title">
            📦 Склад ←{" "}
            <span
              class="resource-swatch resource-swatch--sm"
              attr:style={`background: ${RESOURCE_COLORS[mode.incoming]}`}
            />{" "}
            {RESOURCE_NAMES[mode.incoming]}
          </h3>
          {mode.canStore && (
            <button
              class="btn-action warehouse-store-btn"
              on:click={() => ui.storeOnWarehouseFromPrompt()}
            >
              Положить на склад
            </button>
          )}
          {mode.stored.length > 0 && (
            <>
              <p class="drawer-subtitle">Или заменить:</p>
              <div class="resource-picker-list">
                {mode.stored.map((r, i) => (
                  <ResourcePickerItem
                    resource={r}
                    onPick={() => ui.confirmWarehouseSwap(i)}
                  />
                ))}
              </div>
            </>
          )}
          <div class="drawer-actions">
            <button
              class="btn-secondary"
              on:click={() => ui.cancelWarehouseSwap()}
            >
              Отмена
            </button>
          </div>
        </div>
      );
    }

    const { builds } = mode;

    return (
      <div class="build-drawer-content">
        <h3 class="drawer-title">Выберите вариант</h3>
        <div class="variant-list">
          {builds.map((match, i) => (
            <VariantCard
              match={match}
              isSelected={() => ui.drawerSelectedVariant() === i}
              onSelect={() => ui.selectDrawerVariant(i)}
            />
          ))}
        </div>
        <div class="drawer-actions">
          <button
            class="btn-action"
            disabled={computed(() => ui.drawerSelectedVariant() === null)}
            on:click={() => ui.confirmSelectedVariant()}
          >
            Построить
          </button>
          <button
            class="btn-secondary"
            on:click={() => ui.cancelVariantSelection()}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }, "buildDrawer.content");

  return <>{content}</>;
};
