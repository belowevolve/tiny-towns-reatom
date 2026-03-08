import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerState } from "../model/player";
import type { CellAtom, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_ICONS } from "../model/types";

export const Cell = ({
  cellAtom,
  index,
  player,
}: {
  cellAtom: CellAtom;
  index: number;
  player: PlayerState;
}) => {
  const content = computed(() => {
    const c = cellAtom();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return RESOURCE_ICONS[c.resource];
    }
    return BUILDINGS[c.building].icon;
  }, `cell#${index}.content`);

  const isHighlighted = computed(
    () => player.highlightedCells().has(index),
    `cell#${index}.highlighted`
  );

  const cellClass = computed(() => {
    const classes = ["cell"];
    const c = cellAtom();
    if (c?.type === "resource") {
      classes.push("cell--resource");
    }
    if (c?.type === "building") {
      classes.push("cell--building");
    }
    if (isHighlighted()) {
      classes.push("cell--highlighted");
    }
    if (!c && player.selectedResource()) {
      classes.push("cell--droppable");
    }
    return classes.join(" ");
  }, `cell#${index}.class`);

  const handleClick = () => {
    const match = player.selectedMatch();
    if (match && player.highlightedCells().has(index)) {
      player.buildAtCell(match, index);
      return;
    }
    const resource = player.selectedResource();
    if (!cellAtom() && resource) {
      player.placeResource(index, resource);
      player.selectedResource.set(null);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    if (!cellAtom()) {
      e.preventDefault();
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const resource = e.dataTransfer?.getData("text/plain") as
      | Resource
      | undefined;
    if (resource && !cellAtom()) {
      player.placeResource(index, resource);
    }
  };

  return (
    <div
      class={cellClass}
      on:click={handleClick}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      data-row={Math.floor(index / GRID_SIZE)}
      data-col={index % GRID_SIZE}
    >
      {content}
    </div>
  );
};
