import { computed } from "@reatom/core";

import type { PlayerState } from "../model/player";
import type { Resource } from "../model/types";
import { RESOURCES, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";

const ResourceItem = ({
  resource,
  player,
}: {
  resource: Resource;
  player: PlayerState;
}) => {
  const isSelected = computed(
    () => player.selectedResource() === resource,
    `resourceItem.${resource}.selected`
  );

  const handleClick = () => {
    player.selectedResource.set(isSelected() ? null : resource);
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", resource);
  };

  return (
    <div
      class={[
        "resource-item",
        {
          "resource-item--selected": isSelected,
        },
      ]}
      draggable={true}
      on:click={handleClick}
      on:dragstart={handleDragStart}
    >
      <span
        class="resource-swatch"
        attr:style={`background: ${RESOURCE_COLORS[resource]}`}
      />
      <span class="resource-label">{RESOURCE_NAMES[resource]}</span>
    </div>
  );
};

export const ResourcePanel = ({ player }: { player: PlayerState }) => (
  <div class="panel">
    <h3 class="panel-title">Ресурсы</h3>
    {RESOURCES.map((resource) => (
      <ResourceItem resource={resource} player={player} />
    ))}
  </div>
);
