import { urlAtom } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { localPlayerUI, reatomPlayerUI } from "../player-ui";
import type { HostMessage } from "./protocol";
import { onMessage, selfId } from "./transport";

const handleHostMessage = (msg: HostMessage): void => {
  switch (msg.type) {
    case "game-start": {
      for (const p of msg.players) {
        game.addPlayer(p.id, p.name);
      }

      localPlayerId.set(selfId);
      const me = game.findPlayer(selfId);
      if (me) {
        localPlayerUI.set(reatomPlayerUI(me));
      }
      game.startGame();
      urlAtom.go("/game");
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

    case "player-grid": {
      if (msg.playerId === localPlayerId()) {
        break;
      }

      const player = game.findPlayer(msg.playerId);
      if (!player) {
        break;
      }

      player.applyGrid(msg.grid, msg.hasPlacedResource);
      break;
    }

    case "player-eliminated": {
      game.eliminatePlayer(msg.playerId);
      break;
    }

    case "all-done": {
      game.endTurn(msg.masterBuilderIndex);
      break;
    }

    case "game-over": {
      game.finishGame();
      urlAtom.go("/results");
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
