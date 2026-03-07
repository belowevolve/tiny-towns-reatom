import { computed } from "@reatom/core";

import {
  buildAtCell,
  highlightedCells,
  placeResource,
  selectedMatch,
  selectedResource,
} from "../model/game";
import type { CellAtom, Resource } from "../model/types";
import { GRID_SIZE, RESOURCE_ICONS } from "../model/types";

export const Cell = ({
  cellAtom,
  index,
}: {
  cellAtom: CellAtom;
  index: number;
}) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;

  const content = computed(() => {
    const c = cellAtom();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return RESOURCE_ICONS[c.resource];
    }
    return c.icon;
  }, `cell#${index}.content`);

  const isHighlighted = computed(
    () => highlightedCells().has(index),
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
    if (!c && selectedResource()) {
      classes.push("cell--droppable");
    }
    return classes.join(" ");
  }, `cell#${index}.class`);

  const handleClick = () => {
    const match = selectedMatch();
    if (match && highlightedCells().has(index)) {
      buildAtCell(match, index);
      return;
    }
    if (!cellAtom() && selectedResource()) {
      placeResource(index);
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
      selectedResource.set(resource);
      placeResource(index);
    }
  };

  return (
    <div
      class={cellClass}
      on:click={handleClick}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      data-row={row}
      data-col={col}
      css={`
        width: 80px;
        height: 80px;
        border: 2px solid #444;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.15s ease;
        background: #2a2a2a;
        user-select: none;

        &:hover {
          border-color: #666;
        }

        &.cell--resource {
          background: #333;
          border-color: #555;
        }

        &.cell--building {
          background: #1a3a1a;
          border-color: #4a8a4a;
        }

        &.cell--highlighted {
          background: #3a2a1a;
          border-color: #f0a030;
          box-shadow: 0 0 12px rgba(240, 160, 48, 0.4);
          animation: pulse 1s ease-in-out infinite;
        }

        &.cell--droppable:hover {
          background: #1a2a3a;
          border-color: #4a8af0;
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 8px rgba(240, 160, 48, 0.3);
          }
          50% {
            box-shadow: 0 0 16px rgba(240, 160, 48, 0.6);
          }
        }
      `}
    >
      {content}
    </div>
  );
};
