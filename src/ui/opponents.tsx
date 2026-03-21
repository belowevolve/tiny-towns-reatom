import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import { game, localPlayerId } from "../model/game";
import type { PlayerState } from "../model/player";
import { ResourceSwatch } from "./resource-swatch";

const MiniCell = ({
  player,
  index,
}: {
  player: PlayerState;
  index: number;
}) => {
  const content = computed(() => {
    const c = player.cells[index]();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return <ResourceSwatch resource={c.resource} small />;
    }
    return BUILDINGS[c.building].icon;
  }, `opponent.${player.id}.cell#${index}`);

  const cellClass = computed(() => {
    const c = player.cells[index]();
    if (!c) {
      return "mini-cell";
    }
    if (c.type === "resource") {
      return "mini-cell mini-cell--resource";
    }
    return "mini-cell mini-cell--building";
  }, `opponent.${player.id}.cell#${index}.class`);

  return <div class={cellClass}>{content}</div>;
};

const OpponentBoard = ({ player }: { player: PlayerState }) => {
  const isEliminated = computed(
    () => game.eliminatedPlayers().has(player.id),
    `opponent.${player.id}.eliminated`
  );

  const readiness = computed(
    () => game.playerReadiness()[player.id] ?? false,
    `opponent.${player.id}.ready`
  );

  const isMasterBuilder = computed(
    () => game.currentMasterBuilder()?.id === player.id,
    `opponent.${player.id}.mb`
  );

  return (
    <div
      class={[
        "opponent-card",
        {
          "opponent-card--eliminated": isEliminated,
          "opponent-card--master-builder": isMasterBuilder,
        },
      ]}
    >
      <div class="opponent-header">
        <span class="opponent-name">
          {computed(() => (isMasterBuilder() ? "🔨 " : ""))}
          {player.name}
        </span>
        <span class="opponent-score">{player.score}</span>
      </div>
      <div class="opponent-grid">
        {player.cells.map((_, i) => (
          <MiniCell player={player} index={i} />
        ))}
      </div>
      <div class="opponent-status">
        {computed(() => {
          if (isEliminated()) {
            return "Выбыл";
          }
          if (readiness()) {
            return "✓ Готов";
          }
          return "";
        })}
      </div>
    </div>
  );
};

export const Opponents = () => {
  const opponents = computed(() => {
    const myId = localPlayerId();
    return game.players().filter((p) => p.id !== myId);
  }, "opponents.list");

  return (
    <div class="opponents-panel">
      {computed(() => opponents().map((p) => <OpponentBoard player={p} />))}
    </div>
  );
};
