import { action, urlAtom } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { lobbyPlayers } from "../lobby";
import { localPlayerUI, reatomPlayerUI } from "../player-ui";
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

const scheduleAdvanceCheck = (): void => {
  setTimeout(advanceIfAllDone, 0);
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
    scheduleAdvanceCheck();
  });

  on("player-eliminated", (msg, peerId) => {
    if (peerId !== selfId) {
      game.eliminatePlayer(msg.playerId);
    }
    scheduleAdvanceCheck();
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
    scheduleAdvanceCheck();
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
    scheduleAdvanceCheck();
  });
};

export const startMultiplayerGame = action(() => {
  if (!isHost()) {
    return;
  }

  const players = lobbyPlayers();
  if (players.length < 2) {
    return;
  }

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
