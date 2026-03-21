import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { hostPeerId, isHost } from "../lobby";
import type { BuildMatch, Resource } from "../types";
import type { HostMessage } from "./protocol";
import { onMessage, selfId, sendToHost } from "./transport";

const getHostId = (): string | null => peek(hostPeerId);

const setupLocalPlayerCallbacks = (): void => {
  const localPlayer = game.findPlayer(selfId);
  if (!localPlayer) {
    return;
  }

  localPlayer.onPlace.set((index: number, resource: Resource) => {
    const host = getHostId();
    if (host) {
      sendToHost({ index, resource, type: "place-resource" }, host);
    }
  });

  localPlayer.onBuild.set((match: BuildMatch, targetIndex: number) => {
    const host = getHostId();
    if (host) {
      sendToHost({ match, targetIndex, type: "build-at-cell" }, host);
    }
  });
};

const handleHostMessage = (msg: HostMessage): void => {
  switch (msg.type) {
    case "game-start": {
      game.isMultiplayer.set(true);

      for (const p of msg.players) {
        game.addPlayer(p.id, p.name);
      }

      localPlayerId.set(selfId);
      game.startGame();
      setupLocalPlayerCallbacks();
      break;
    }

    case "resource-announced": {
      const alreadyApplied =
        game.currentResource() === msg.resource && game.turnPhase() === "place";
      if (!alreadyApplied) {
        game.announceResource(msg.resource);
      }
      break;
    }

    case "player-action": {
      if (msg.playerId === peek(localPlayerId)) {
        break;
      }

      const player = game.findPlayer(msg.playerId);
      if (!player) {
        break;
      }

      switch (msg.action.kind) {
        case "place-resource": {
          player.placeResource(msg.action.index, msg.action.resource);
          break;
        }
        case "build-at-cell": {
          player.buildAtCell(msg.action.match, msg.action.targetIndex);
          break;
        }
        default: {
          console.warn(`Unknown action: ${JSON.stringify(msg.action)}`);
          break;
        }
      }
      break;
    }

    case "player-eliminated": {
      game.eliminatePlayer(msg.playerId);
      break;
    }

    case "all-done": {
      game.applyTurnEnd(msg.masterBuilderIndex);
      break;
    }

    case "game-over": {
      game.finishGame();
      break;
    }

    case "lobby-state":
    case "kick-player": {
      break;
    }

    default: {
      console.warn(`Unknown message: ${JSON.stringify(msg)}`);
      break;
    }
  }
};

export const initClientListener = (): void => {
  onMessage((msg, _peerId) => {
    handleHostMessage(msg as HostMessage);
  });
};

export const clientAnnounceResource = action((resource: Resource) => {
  if (peek(isHost)) {
    return;
  }
  game.announceResource(resource);
  const host = getHostId();
  if (host) {
    sendToHost({ resource, type: "announce-resource" }, host);
  }
}, "client.announceResource");

export const clientMarkDone = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player || !player.hasPlacedResource()) {
    return;
  }
  game.markPlayerDone(myId);
  const host = getHostId();
  if (host) {
    sendToHost({ type: "turn-done" }, host);
  }
}, "client.markDone");

export const clientEliminateSelf = action(() => {
  const host = getHostId();
  if (host) {
    sendToHost({ type: "player-eliminated-self" }, host);
  }
}, "client.eliminateSelf");
