import { computed, peek } from "@reatom/core";

import { BUILDINGS, calculateCellScore } from "../model/buildings";
import { game, localPlayerId } from "../model/game";
import { sendGridSync } from "../model/multiplayer/actions";
import type { PlayerState } from "../model/player";
import type { CellAtom } from "../model/types";
import {
  GRID_SIZE,
  RESOURCE_COLORS,
  RESOURCE_ICONS,
  RESOURCE_NAMES,
} from "../model/types";
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

  const storedPreview = computed(() => {
    const c = cellAtom();
    if (!c || c.type !== "building" || c.stored.length === 0) {
      return "";
    }
    return (
      <div class="cell-stored-preview">
        {c.stored.map((r) => (
          <span
            class="cell-stored-dot"
            attr:style={`background: ${RESOURCE_COLORS[r]}`}
          />
        ))}
      </div>
    );
  }, `cell#${index}.storedPreview`);

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

  const isMasterBuilder = computed(
    () => game.currentMasterBuilder()?.id === localPlayerId(),
    `cell#${index}.isMB`
  );

  const isStorable = computed(() => {
    if (player.selectedBuilding() !== null) {
      return false;
    }
    if (player.resourceOverride() !== null) {
      return false;
    }
    if (isMasterBuilder()) {
      return false;
    }
    const c = cellAtom();
    if (c?.type !== "building") {
      return false;
    }
    const def = BUILDINGS[c.building];
    if (!def.hooks?.modifyPlacement) {
      return false;
    }
    const resource = game.currentResource();
    if (!resource) {
      return false;
    }
    const options = def.hooks.modifyPlacement(resource, {
      buildingIndex: index,
      grid: player.gridSnapshot(),
      stored: c.stored,
    });
    return options.some(
      (o) => o.type === "storeOnBuilding" || o.type === "swapWithStored"
    );
  }, `cell#${index}.storable`);

  const isSubstitutable = computed(() => {
    if (player.selectedBuilding() !== null) {
      return false;
    }
    if (player.resourceOverride() !== null) {
      return false;
    }
    if (isMasterBuilder()) {
      return false;
    }
    const c = cellAtom();
    if (c?.type !== "building" || c.stored.length === 0) {
      return false;
    }
    const def = BUILDINGS[c.building];
    if (!def.hooks?.modifyPlacement) {
      return false;
    }
    const resource = game.currentResource();
    if (!resource) {
      return false;
    }
    const options = def.hooks.modifyPlacement(resource, {
      buildingIndex: index,
      grid: player.gridSnapshot(),
      stored: c.stored,
    });
    return options.some((o) => o.type === "substituteResource");
  }, `cell#${index}.substitutable`);

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
    const desc = BUILDINGS[c.building].description;
    if (c.stored.length > 0) {
      const storedNames = c.stored.map((r) => RESOURCE_NAMES[r]).join(", ");
      return `${desc}\nХранится: ${storedNames}`;
    }
    return desc;
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

    const resource =
      peek(player.resourceOverride) ?? peek(game.currentResource);
    if (!resource || peek(player.hasPlacedResource)) {
      return;
    }

    if (isSubstitutable()) {
      player.activateFactory(index);
      return;
    }

    if (isStorable()) {
      player.initiateWarehouseStore(index, resource);
      sendGridSync();
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
          "cell--storable": isStorable,
          "cell--substitutable": isSubstitutable,
        },
      ]}
      attr:interestfor={hintId}
      attr:style={`anchor-name: --${hintId}`}
      on:click={handleClick}
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
