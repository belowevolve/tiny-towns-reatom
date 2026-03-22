import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { CellVM } from "../model/player-ui";
import { GRID_SIZE, RESOURCE_COLORS } from "../model/types";
import { ResourceSwatch } from "./resource-swatch";

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
      <div class="cell-stored-preview">
        {stored.map((r) => (
          <span
            class="cell-stored-dot"
            attr:style={`background: ${RESOURCE_COLORS[r]}`}
          />
        ))}
      </div>
    );
  }, `cell#${index}.storedPreview`);

  return (
    <button
      class={[
        "cell",
        {
          "cell--buildable": vm.isBuildable,
          "cell--building": vm.isBuilding,
          "cell--empty": vm.isEmpty,
          "cell--highlighted": vm.isHighlighted,
          "cell--resource": vm.isResource,
          "cell--storable": vm.isStorable,
          "cell--substitutable": vm.isSubstitutable,
        },
      ]}
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
        class={[
          "cell-popover",
          { "cell-popover--positive": vm.isPositiveScore },
        ]}
      >
        <div class="cell-popover__title">{vm.hintTitle}</div>
        <div class="cell-popover__desc">{vm.hintDesc}</div>
        <div class="cell-popover__score">{vm.scoreText}</div>
      </div>
    </button>
  );
};
