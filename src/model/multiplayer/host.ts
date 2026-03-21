import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { isHost, lobbyPlayers } from "../lobby";
import type { ClientMessage } from "./protocol";
import { broadcast, onMessage, selfId } from "./transport";

const advanceIfAllDone = (): void => {
  const active = game.activePlayers();

  if (active.length === 0) {
    game.finishGame();
    broadcast({
      scores: game.players().map((p) => ({
        grid: p.cells.map((c) => c()),
        playerId: p.id,
        score: p.score(),
      })),
      type: "game-over",
    });
    return;
  }

  const readiness = game.playerReadiness();
  if (!active.every((p) => readiness[p.id])) {
    return;
  }

  const currentIdx = game.masterBuilderIndex();
  const newMBIdx = (currentIdx + 1) % active.length;

  game.endTurn();

  broadcast({
    masterBuilderIndex: newMBIdx,
    turnNumber: game.turnNumber(),
    type: "all-done",
  });
};

export const scheduleAdvanceCheck = (): void => {
  setTimeout(advanceIfAllDone, 0);
};

const handleClientMessage = (msg: ClientMessage, peerId: string): void => {
  switch (msg.type) {
    case "announce-resource": {
      const mb = game.currentMasterBuilder();
      if (!mb || mb.id !== peerId) {
        return;
      }
      game.announceResource(msg.resource);
      broadcast({
        masterBuilderId: peerId,
        resource: msg.resource,
        turnNumber: game.turnNumber(),
        type: "resource-announced",
      });
      break;
    }

    case "grid-sync": {
      const player = game.findPlayer(peerId);
      if (!player) {
        return;
      }
      player.applyGrid(msg.grid, msg.hasPlacedResource);
      broadcast({
        grid: msg.grid,
        hasPlacedResource: msg.hasPlacedResource,
        playerId: peerId,
        type: "player-grid",
      });
      break;
    }

    case "turn-done": {
      const player = game.findPlayer(peerId);
      if (!player || !player.hasPlacedResource()) {
        return;
      }
      game.markPlayerDone(peerId);
      scheduleAdvanceCheck();
      break;
    }

    case "player-eliminated-self": {
      broadcast({ playerId: peerId, type: "player-eliminated" });
      game.eliminatePlayer(peerId);
      scheduleAdvanceCheck();
      break;
    }

    default: {
      break;
    }
  }
};

export const startMultiplayerGame = action(() => {
  if (!peek(isHost)) {
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
  game.startGame();

  broadcast({
    players: players.map((p) => ({ id: p.peerId, name: p.name })),
    type: "game-start",
  });

  onMessage((msg, peerId) => {
    handleClientMessage(msg as ClientMessage, peerId);
  });
}, "host.startGame");
