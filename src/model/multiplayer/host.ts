import { action, computed, urlAtom } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { lobbyPlayers } from "../lobby";
import { localPlayerUI, reatomPlayerUI } from "../player-ui";
import { MAX_PLAYERS } from "../types";
import { isHost } from "./state";
import { broadcast, on, onPeerLeave, selfId } from "./transport";

const broadcastGameOver = (): void => {
  game.finishGame();
  urlAtom.go("/results");
  broadcast({
    scores: game.players().map((p) => ({
      grid: p.cells.map((c) => c()),
      playerId: p.id,
      score: p.score(),
    })),
    type: "game-over",
  });
};

const advanceIfAllDone = (): void => {
  const active = game.activePlayers();

  if (active.length === 0) {
    broadcastGameOver();
    return;
  }

  const readiness = game.playerReadiness();
  if (!active.every((p) => readiness[p.id])) {
    return;
  }

  game.endTurn();

  const eliminated = game.autoEliminateFullBoards();
  for (const id of eliminated) {
    broadcast({ playerId: id, type: "player-eliminated" });
  }

  if (game.activePlayers().length === 0) {
    broadcastGameOver();
    return;
  }

  broadcast({
    masterBuilderIndex: game.masterBuilderIndex(),
    turnNumber: game.turnNumber(),
    type: "all-done",
  });
};

const initHostGameListeners = (): void => {
  on("turn-done", (msg, peerId) => {
    if (peerId !== selfId) {
      const player = game.findPlayer(msg.playerId);
      if (!player || !player.hasPlacedResource()) {
        return;
      }
      game.markPlayerDone(msg.playerId);
    }
    advanceIfAllDone();
  });

  on("player-eliminated", (msg, peerId) => {
    if (peerId !== selfId) {
      game.eliminatePlayer(msg.playerId);
    }
    advanceIfAllDone();
  });

  on("player-grid", (msg, peerId) => {
    if (peerId === selfId) {
      return;
    }
    const player = game.findPlayer(msg.playerId);
    if (!player) {
      return;
    }
    player.applyGrid(msg.grid, msg.hasPlacedResource);
  });

  on("resource-announced", (msg, peerId) => {
    if (peerId !== selfId) {
      const mb = game.currentMasterBuilder();
      if (!mb || mb.id !== msg.masterBuilderId) {
        return;
      }
      game.announceResource(msg.resource);
    }
    advanceIfAllDone();
  });

  onPeerLeave((peerId) => {
    if (game.phase() !== "playing") {
      return;
    }
    const player = game.findPlayer(peerId);
    if (!player) {
      return;
    }
    game.eliminatePlayer(peerId);
    broadcast({ playerId: peerId, type: "player-eliminated" });
    advanceIfAllDone();
  });
};

export const canStartMultiplayerGame = computed(() => {
  if (!isHost()) {
    return false;
  }
  const players = lobbyPlayers();
  return players.length >= 2 && players.length <= MAX_PLAYERS;
});

export const startMultiplayerGame = action(() => {
  if (!canStartMultiplayerGame()) {
    return;
  }

  const players = lobbyPlayers();
  for (const p of players) {
    game.addPlayer(p.peerId, p.name);
  }

  localPlayerId.set(selfId);
  const me = game.findPlayer(selfId);
  if (me) {
    localPlayerUI.set(reatomPlayerUI(me));
  }
  game.startGame();
  urlAtom.go("/game");

  broadcast({
    players: players.map((p) => ({ id: p.peerId, name: p.name })),
    type: "game-start",
  });

  initHostGameListeners();
}, "host.startGame");
