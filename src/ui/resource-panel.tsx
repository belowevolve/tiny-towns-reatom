import type { PlayerState } from "../model/player";
import type { Resource } from "../model/types";
import { RESOURCES, RESOURCE_ICONS, RESOURCE_NAMES } from "../model/types";

const ResourceItem = ({
  resource,
  player,
}: {
  resource: Resource;
  player: PlayerState;
}) => {
  const handleClick = () => {
    player.selectedResource.set(
      player.selectedResource() === resource ? null : resource
    );
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", resource);
  };

  return (
    <div
      class={() =>
        player.selectedResource() === resource
          ? "resource-item resource-item--selected"
          : "resource-item"
      }
      draggable={true}
      on:click={handleClick}
      on:dragstart={handleDragStart}
    >
      <span class="resource-icon">{RESOURCE_ICONS[resource]}</span>
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
