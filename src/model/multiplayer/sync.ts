import { action } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { hostPeerId, isHost } from "./state";
import { broadcast, selfId, sendToHost } from "./transport";

export const sendGridSync = action(() => {
  const myId = localPlayerId();
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player) {
    return;
  }

  const grid = player.cells.map((c) => c());
  const hasPlaced = player.hasPlacedResource();

  if (isHost()) {
    broadcast({
      grid,
      hasPlacedResource: hasPlaced,
      playerId: selfId,
      type: "player-grid",
    });
  } else {
    const host = hostPeerId();
    if (host) {
      sendToHost(
        { grid, hasPlacedResource: hasPlaced, type: "grid-sync" },
        host
      );
    }
  }
}, "mp.sendGridSync");
