import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { isHost, lobbyPlayers } from "../lobby";
import type { BuildMatch, Resource } from "../types";
import type { ClientMessage } from "./protocol";
import { broadcast, onMessage, selfId } from "./transport";

/**
 * Deferred to a microtask so it always reads fully committed atom values.
 * When called from inside a reatom action (e.g. hostMarkDone), atom reads
 * may return stale pre-commit values; deferring guarantees the transaction
 * has settled before we inspect readiness.
 */
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

const scheduleAdvanceCheck = (): void => {
  queueMicrotask(advanceIfAllDone);
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

    case "place-resource": {
      if (game.turnPhase() !== "place") {
        return;
      }
      const player = game.findPlayer(peerId);
      if (!player) {
        return;
      }
      player.placeResource(msg.index, msg.resource);
      broadcast({
        action: {
          index: msg.index,
          kind: "place-resource",
          resource: msg.resource,
        },
        playerId: peerId,
        type: "player-action",
      });
      break;
    }

    case "build-at-cell": {
      const player = game.findPlayer(peerId);
      if (!player) {
        return;
      }
      player.buildAtCell(msg.match, msg.targetIndex);
      broadcast({
        action: {
          kind: "build-at-cell",
          match: msg.match,
          targetIndex: msg.targetIndex,
        },
        playerId: peerId,
        type: "player-action",
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

// --- Exported actions ---

export const hostAnnounceResource = action((resource: Resource) => {
  if (!peek(isHost)) {
    return;
  }
  const mb = game.currentMasterBuilder();
  if (!mb || mb.id !== peek(localPlayerId)) {
    return;
  }

  game.announceResource(resource);
  broadcast({
    masterBuilderId: mb.id,
    resource,
    turnNumber: game.turnNumber(),
    type: "resource-announced",
  });
}, "host.announce");

export const hostMarkDone = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player || !player.hasPlacedResource()) {
    return;
  }
  game.markPlayerDone(myId);
  scheduleAdvanceCheck();
}, "host.markDone");

export const hostEliminateSelf = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }
  broadcast({ playerId: myId, type: "player-eliminated" });
  game.eliminatePlayer(myId);
  scheduleAdvanceCheck();
}, "host.eliminateSelf");

export const startMultiplayerGame = action(() => {
  if (!peek(isHost)) {
    return;
  }

  const players = lobbyPlayers();
  if (players.length < 2) {
    return;
  }

  game.isMultiplayer.set(true);

  for (const p of players) {
    game.addPlayer(p.peerId, p.name);
  }

  localPlayerId.set(selfId);
  game.startGame();

  const localPlayer = game.findPlayer(selfId);
  if (localPlayer) {
    localPlayer.onPlace.set((index: number, resource: Resource) => {
      broadcast({
        action: { index, kind: "place-resource", resource },
        playerId: selfId,
        type: "player-action",
      });
    });

    localPlayer.onBuild.set((match: BuildMatch, targetIndex: number) => {
      broadcast({
        action: { kind: "build-at-cell", match, targetIndex },
        playerId: selfId,
        type: "player-action",
      });
    });
  }

  broadcast({
    players: players.map((p) => ({ id: p.peerId, name: p.name })),
    type: "game-start",
  });

  onMessage((msg, peerId) => {
    handleClientMessage(msg as ClientMessage, peerId);
  });
}, "host.startGame");
