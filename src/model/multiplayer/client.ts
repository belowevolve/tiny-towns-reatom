import { urlAtom } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { localPlayerUI, reatomPlayerUI } from "../player-ui";
import { on, selfId } from "./transport";

export const initClientListener = (): void => {
  on("game-start", (msg) => {
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
  });

  on("resource-announced", (msg) => {
    if (msg.masterBuilderId === selfId) {
      return;
    }
    const alreadyApplied =
      game.currentResource() === msg.resource && game.turnPhase() === "place";
    if (!alreadyApplied) {
      game.announceResource(msg.resource);
    }
  });

  on("player-grid", (msg) => {
    if (msg.playerId === localPlayerId()) {
      return;
    }
    const player = game.findPlayer(msg.playerId);
    if (!player) {
      return;
    }
    player.applyGrid(msg.grid, msg.hasPlacedResource);
  });

  on("player-eliminated", (msg) => {
    if (msg.playerId === localPlayerId()) {
      return;
    }
    game.eliminatePlayer(msg.playerId);
  });

  on("turn-done", (msg) => {
    if (msg.playerId === localPlayerId()) {
      return;
    }
    game.markPlayerDone(msg.playerId);
  });

  on("all-done", (msg) => {
    game.endTurn(msg.masterBuilderIndex);
  });

  on("game-over", () => {
    game.finishGame();
    urlAtom.go("/results");
  });
};
