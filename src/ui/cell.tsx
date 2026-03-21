import { computed, peek } from "@reatom/core";

import { BUILDINGS, calculateCellScore } from "../model/buildings";
import { game } from "../model/game";
import { sendGridSync } from "../model/multiplayer/actions";
import type { PlayerState } from "../model/player";
import type { CellAtom } from "../model/types";
import { GRID_SIZE, RESOURCE_ICONS, RESOURCE_NAMES } from "../model/types";
import { ResourceSwatch } from "./resource-swatch";

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
      return <ResourceSwatch resource={c.resource} />;
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

  const isEmpty = computed(() => !cellAtom(), `cell#${index}.empty`);

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
      if (!peek(player.hasPlacedResource)) {
        player.selectBuilding(null);
        return;
      }
      if (isHighlighted()) {
        player.tryBuildAt(index);
        sendGridSync();
      } else {
        player.selectBuilding(null);
      }
      return;
    }

    const resource = peek(game.currentResource);
    if (!resource || peek(player.hasPlacedResource)) {
      return;
    }

    if (!cellAtom()) {
      player.placeResource(index, resource);
      sendGridSync();
    }
  };

  return (
    <button
      class={[
        "cell",
        {
          "cell--buildable": isBuildable,
          "cell--building": isBuilding,
          "cell--empty": isEmpty,
          "cell--highlighted": isHighlighted,
          "cell--resource": isResource,
        },
      ]}
      attr:interestfor={hintId}
      attr:style={`anchor-name: --${hintId}`}
      on:click={handleClick}
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
