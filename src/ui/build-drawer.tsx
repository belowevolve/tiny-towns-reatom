import { atom, computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerState } from "../model/player";
import type { BuildMatch } from "../model/types";
import { GRID_SIZE, RESOURCE_ICONS } from "../model/types";

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
      class={[
        "variant-card",
        {
          "variant-card--selected": isSelected,
        },
      ]}
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
                  {
                    "variant-mini-cell--active": inMatch,
                  },
                ]}
              >
                {inMatch
                  ? RESOURCE_ICONS[
                      def.pattern.find((_, pi) => match.cells[pi] === gridIndex)
                        ?.resource ?? def.pattern[0].resource
                    ]
                  : ""}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const BuildDrawer = ({ player }: { player: PlayerState }) => {
  const selectedIndex = atom<number | null>(null, "buildDrawer.selectedIdx");

  const content = computed(() => {
    const builds = player.pendingBuilds();
    if (builds.length === 0) {
      return <div />;
    }

    const handleConfirm = () => {
      const idx = selectedIndex();
      if (idx !== null && builds[idx]) {
        player.confirmBuild(builds[idx]);
        selectedIndex.set(null);
      }
    };

    const handleCancel = () => {
      player.cancelBuild();
      selectedIndex.set(null);
    };

    const handleSelect = (i: number) => {
      selectedIndex.set(i);
      player.previewVariant(builds[i]);
    };

    return (
      <div class="build-drawer-content">
        <h3 class="drawer-title">Выберите вариант</h3>
        <div class="variant-list">
          {builds.map((match, i) => (
            <VariantCard
              match={match}
              isSelected={() => selectedIndex() === i}
              onSelect={() => handleSelect(i)}
            />
          ))}
        </div>
        <div class="drawer-actions">
          <button
            class="btn-action"
            disabled={selectedIndex() === null}
            on:click={handleConfirm}
          >
            Построить
          </button>
          <button class="btn-secondary" on:click={handleCancel}>
            Отмена
          </button>
        </div>
      </div>
    );
  }, "buildDrawer.content");

  return <>{content}</>;
};
