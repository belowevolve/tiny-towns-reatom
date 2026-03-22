import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import { opponents, reatomOpponentVM } from "../model/game-ui";
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
  }, `opp.${player.id}.cell#${index}`);

  const cellClass = computed(() => {
    const c = player.cells[index]();
    if (!c) {
      return "mini-cell";
    }
    if (c.type === "resource") {
      return "mini-cell mini-cell--resource";
    }
    return "mini-cell mini-cell--building";
  }, `opp.${player.id}.cell#${index}.cls`);

  return <div class={cellClass}>{content}</div>;
};

const OpponentBadge = ({ player }: { player: PlayerState }) => {
  const vm = reatomOpponentVM(player);

  return (
    <div
      class={[
        "opponent-badge",
        {
          "opponent-badge--eliminated": vm.isEliminated,
          "opponent-badge--master-builder": vm.isMasterBuilder,
        },
      ]}
    >
      <div class="opponent-badge__header">
        <span class="opponent-badge__name">
          {computed(() => (vm.isMasterBuilder() ? "🔨 " : ""))}
          {player.name}
        </span>
        <span class="opponent-badge__score">{player.score}</span>
      </div>
      <div class="opponent-badge__grid">
        {player.cells.map((_, i) => (
          <MiniCell player={player} index={i} />
        ))}
      </div>
      <div class="opponent-badge__status">
        {computed(() => {
          if (vm.isEliminated()) {
            return "Выбыл";
          }
          if (vm.readiness()) {
            return "✓";
          }
          return "";
        })}
      </div>
    </div>
  );
};

export const Opponents = () => (
  <div class="opponents-row">
    {computed(() => opponents().map((p) => <OpponentBadge player={p} />))}
  </div>
);
