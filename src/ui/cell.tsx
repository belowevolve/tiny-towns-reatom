import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import type { PlayerState } from "../model/player";
import type { BuildingType, CellAtom, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_ICONS } from "../model/types";

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
    <div
      class={[
        "cell",
        {
          "cell--buildable": () =>
            isHighlighted() && player.selectedBuilding() !== null,
          "cell--building": () => cellAtom()?.type === "building",
          "cell--droppable": () =>
            !cellAtom() &&
            player.selectedResource() !== null &&
            player.selectedBuilding() === null,
          "cell--highlighted": isHighlighted,
          "cell--resource": () => cellAtom()?.type === "resource",
        },
      ]}
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
