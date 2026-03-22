import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { hostPeerId, isHost } from "../lobby";
import { broadcast, selfId, sendToHost } from "./transport";

export const sendGridSync = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player) {
    return;
  }

  const grid = player.cells.map((c) => c());
  const hasPlaced = player.hasPlacedResource();

  if (peek(isHost)) {
    broadcast({
      grid,
      hasPlacedResource: hasPlaced,
      playerId: selfId,
      type: "player-grid",
    });
  } else {
    const host = peek(hostPeerId);
    if (host) {
      sendToHost(
        { grid, hasPlacedResource: hasPlaced, type: "grid-sync" },
        host
      );
    }
  }
}, "mp.sendGridSync");
