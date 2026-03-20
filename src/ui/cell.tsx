import { computed } from "@reatom/core";

import { BUILDINGS, calculateCellScore } from "../model/buildings";
import type { PlayerState } from "../model/player";
import type { BuildingType, CellAtom, Resource } from "../model/types";
import {
  GRID_SIZE,
  RESOURCE_COLORS,
  RESOURCE_ICONS,
  RESOURCE_NAMES,
} from "../model/types";

const handleDragOver = (e: DragEvent) => {
  if (e.dataTransfer?.types.includes("text/plain")) {
    e.preventDefault();
  }
};

export const Cell = ({
  cellAtom,
  index,
  player,
}: {
  cellAtom: CellAtom;
  index: number;
  player: PlayerState;
}) => {
  const hintId = `cell-hint-${index}`;

  const content = computed(() => {
    const c = cellAtom();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return (
        <span
          class="cell-swatch"
          attr:style={`background: ${RESOURCE_COLORS[c.resource]}`}
        />
      );
    }
    return BUILDINGS[c.building].icon;
  }, `cell#${index}.content`);

  const isHighlighted = computed(
    () => player.highlightedCells().has(index),
    `cell#${index}.highlighted`
  );

  const isBuildable = computed(
    () => isHighlighted() && player.selectedBuilding() !== null,
    `cell#${index}.buildable`
  );

  const isBuilding = computed(
    () => cellAtom()?.type === "building",
    `cell#${index}.isBuilding`
  );

  const isResource = computed(
    () => cellAtom()?.type === "resource",
    `cell#${index}.isResource`
  );

  const isDroppable = computed(
    () =>
      !cellAtom() &&
      player.selectedResource() !== null &&
      player.selectedBuilding() === null,
    `cell#${index}.droppable`
  );

  const hintTitle = computed(() => {
    const c = cellAtom();
    if (!c) {
      return "Пустая клетка";
    }
    if (c.type === "resource") {
      return `${RESOURCE_ICONS[c.resource]} ${RESOURCE_NAMES[c.resource]}`;
    }
    const b = BUILDINGS[c.building];
    return `${b.icon} ${b.name}`;
  }, `cell#${index}.hint.title`);

  const hintDesc = computed(() => {
    const c = cellAtom();
    if (!c) {
      return "Штраф за пустую ячейку";
    }
    if (c.type === "resource") {
      return "Штраф если ресурс останется";
    }
    return BUILDINGS[c.building].description;
  }, `cell#${index}.hint.desc`);

  const cellScore = computed(
    () => calculateCellScore(player.gridSnapshot(), index),
    `cell#${index}.hint.score`
  );

  const isPositive = computed(() => cellScore() > 0, `cell#${index}.hint.pos`);

  const scoreText = computed(() => {
    const s = cellScore();
    return s > 0 ? `+${s}` : String(s);
  }, `cell#${index}.hint.scoreText`);

  const handleClick = () => {
    if (player.selectedBuilding()) {
      if (isHighlighted()) {
        player.tryBuildAt(index);
      } else {
        player.selectBuilding(null);
      }
      return;
    }

    const resource = player.selectedResource();
    if (!cellAtom() && resource) {
      player.placeResource(index, resource);
      player.selectedResource.set(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer?.getData("text/plain");
    if (!raw) {
      return;
    }

    if (raw.startsWith("building:")) {
      const type = raw.slice(9) as BuildingType;
      player.selectBuilding(type);
      if (player.highlightedCells().has(index)) {
        player.tryBuildAt(index);
      }
      return;
    }

    const resource = raw as Resource;
    if (!cellAtom()) {
      player.placeResource(index, resource);
    }
  };

  return (
    <button
      class={[
        "cell",
        {
          "cell--buildable": isBuildable,
          "cell--building": isBuilding,
          "cell--droppable": isDroppable,
          "cell--highlighted": isHighlighted,
          "cell--resource": isResource,
        },
      ]}
      attr:interestfor={hintId}
      attr:style={`anchor-name: --${hintId}`}
      on:click={handleClick}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      data-row={Math.floor(index / GRID_SIZE)}
      data-col={index % GRID_SIZE}
    >
      {content}
      <div
        id={hintId}
        popover="hint"
        attr:style={`position-anchor: --${hintId}; position-area: top;`}
        class={[
          "cell-popover",
          isPositive() ? "cell-popover--positive" : "cell-popover--negative",
        ]}
      >
        <div class="cell-popover__title">{hintTitle}</div>
        <div class="cell-popover__desc">{hintDesc}</div>
        <div class="cell-popover__score">{scoreText}</div>
      </div>
    </button>
  );
};
