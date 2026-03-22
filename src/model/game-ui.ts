import { computed } from "@reatom/core";

import { currentPlayer, game, localPlayerId } from "./game";
import type { PlayerState } from "./player";
import type { Resource } from "./types";

export const turnLabel = computed(
  () => `Ход ${game.turnNumber() + 1}`,
  "gameUI.turnLabel"
);

export const masterBuilderLabel = computed(() => {
  const mb = game.currentMasterBuilder();
  if (!mb) {
    return "";
  }
  const myId = localPlayerId();
  return mb.id === myId ? "🔨 Вы — строитель" : `🔨 ${mb.name}`;
}, "gameUI.masterBuilderLabel");

export type ActionBarMode =
  | { type: "eliminated" }
  | { type: "picker"; restricted: Set<Resource> }
  | { type: "waiting"; name: string }
  | { type: "place"; resource: Resource }
  | { type: "ready"; resource: Resource }
  | { type: "done"; resource: Resource };

export const actionBarMode = computed((): ActionBarMode => {
  const myId = localPlayerId();
  if (!myId || game.eliminatedPlayers().has(myId)) {
    return { type: "eliminated" };
  }

  if (game.turnPhase() === "announce") {
    const mb = game.currentMasterBuilder();
    if (mb?.id === myId) {
      return {
        restricted:
          currentPlayer()?.restrictedResources() ?? new Set<Resource>(),
        type: "picker",
      };
    }
    return { name: mb?.name ?? "", type: "waiting" };
  }

  const resource = game.currentResource();
  if (!resource) {
    return { type: "eliminated" };
  }

  if (!currentPlayer()?.hasPlacedResource()) {
    return { resource, type: "place" };
  }

  if (game.playerReadiness()[myId]) {
    return { resource, type: "ready" };
  }

  return { resource, type: "done" };
}, "gameUI.actionBarMode");

export const sortedScores = computed(
  () =>
    game
      .players()
      .map((p) => ({ id: p.id, name: p.name, score: p.score() }))
      .toSorted((a, b) => b.score - a.score),
  "gameUI.sortedScores"
);

export const opponents = computed(() => {
  const myId = localPlayerId();
  return game.players().filter((p) => p.id !== myId);
}, "gameUI.opponents");

export const reatomOpponentVM = (player: PlayerState) => ({
  isEliminated: computed(
    () => game.eliminatedPlayers().has(player.id),
    `oppVM#${player.id}.elim`
  ),
  isMasterBuilder: computed(
    () => game.currentMasterBuilder()?.id === player.id,
    `oppVM#${player.id}.mb`
  ),
  player,
  readiness: computed(
    () => game.playerReadiness()[player.id] ?? false,
    `oppVM#${player.id}.ready`
  ),
});

export type OpponentVM = ReturnType<typeof reatomOpponentVM>;
