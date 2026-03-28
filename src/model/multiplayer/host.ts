import { action, urlAtom } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { lobbyPlayers } from "../lobby";
import { localPlayerUI, reatomPlayerUI } from "../player-ui";
import type { Resource } from "../types";
import type { ClientMessage } from "./protocol";
import { isHost } from "./state";
import { broadcast, onMessage, selfId } from "./transport";

const advanceIfAllDone = (): void => {
  const active = game.activePlayers();

  if (active.length === 0) {
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
    return;
  }

  broadcast({
    masterBuilderIndex: game.masterBuilderIndex(),
    turnNumber: game.turnNumber(),
    type: "all-done",
  });
};

export const scheduleAdvanceCheck = (): void => {
  setTimeout(advanceIfAllDone, 0);
};

export const hostAnnounce = (resource: Resource, announcerId: string): void => {
  const eliminated = game.announceResource(resource);
  for (const id of eliminated) {
    broadcast({ playerId: id, type: "player-eliminated" });
  }
  broadcast({
    masterBuilderId: announcerId,
    resource,
    turnNumber: game.turnNumber(),
    type: "resource-announced",
  });
  if (eliminated.length > 0) {
    scheduleAdvanceCheck();
  }
};

const handleClientMessage = (msg: ClientMessage, peerId: string): void => {
  switch (msg.type) {
    case "announce-resource": {
      const mb = game.currentMasterBuilder();
      if (!mb || mb.id !== peerId) {
        return;
      }
      hostAnnounce(msg.resource, peerId);
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

  onMessage((msg, peerId) => {
    handleClientMessage(msg as ClientMessage, peerId);
  });
}, "host.startGame");
