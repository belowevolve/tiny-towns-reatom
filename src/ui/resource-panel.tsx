import { computed } from "@reatom/core";

import { selectedResource } from "../model/game";
import type { Resource } from "../model/types";
import { RESOURCES, RESOURCE_ICONS } from "../model/types";

const ResourceItem = ({ resource }: { resource: Resource }) => {
  const isSelected = computed(
    () => selectedResource() === resource,
    `resourceItem.${resource}.selected`
  );

  const itemClass = computed(
    () =>
      isSelected() ? "resource-item resource-item--selected" : "resource-item",
    `resourceItem.${resource}.class`
  );

  const handleClick = () => {
    selectedResource.set(selectedResource() === resource ? null : resource);
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", resource);
    selectedResource.set(resource);
  };

  return (
    <div
      class={itemClass}
      draggable={true}
      on:click={handleClick}
      on:dragstart={handleDragStart}
      css={`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        border: 2px solid #444;
        border-radius: 10px;
        cursor: grab;
        transition: all 0.15s ease;
        background: #2a2a2a;
        user-select: none;

        &:hover {
          border-color: #666;
          background: #333;
        }

        &:active {
          cursor: grabbing;
        }

        &.resource-item--selected {
          border-color: #4a8af0;
          background: #1a2a3a;
          box-shadow: 0 0 12px rgba(74, 138, 240, 0.3);
        }

        span:first-child {
          font-size: 2rem;
        }

        span:last-child {
          font-size: 0.7rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}
    >
      <span>{RESOURCE_ICONS[resource]}</span>
      <span>{resource}</span>
    </div>
  );
};

export const ResourcePanel = () => (
  <div
    css={`
      display: flex;
      flex-direction: column;
      gap: 8px;

      h3 {
        margin: 0 0 8px;
        font-size: 0.9rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
    `}
  >
    <h3>Ресурсы</h3>
    {RESOURCES.map((resource) => (
      <ResourceItem resource={resource} />
    ))}
  </div>
);
