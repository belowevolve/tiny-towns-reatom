import { peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import type { HostMessage } from "./protocol";
import { onMessage, selfId } from "./transport";

const handleHostMessage = (msg: HostMessage): void => {
  switch (msg.type) {
    case "game-start": {
      for (const p of msg.players) {
        game.addPlayer(p.id, p.name);
      }

      localPlayerId.set(selfId);
      game.startGame();
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
      break;
    }
  }
};

export const initClientListener = (): void => {
  onMessage((msg, _peerId) => {
    handleHostMessage(msg as HostMessage);
  });
};
