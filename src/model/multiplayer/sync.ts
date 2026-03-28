import { action } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { broadcast, selfId } from "./transport";

export const sendGridSync = action(() => {
  const myId = localPlayerId();
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player) {
    return;
  }

  broadcast({
    grid: player.cells.map((c) => c()),
    hasPlacedResource: player.hasPlacedResource(),
    playerId: selfId,
    type: "player-grid",
  });
}, "mp.sendGridSync");
