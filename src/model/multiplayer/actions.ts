import { action } from "@reatom/core";

import { game, localPlayerId } from "../game";
import type { Resource } from "../types";
import { broadcast } from "./transport";

export const announceResource = action((resource: Resource) => {
  const mb = game.currentMasterBuilder();
  const myId = localPlayerId();
  if (!mb || mb.id !== myId) {
    return;
  }

  game.announceResource(resource);
  broadcast({
    masterBuilderId: myId,
    resource,
    turnNumber: game.turnNumber(),
    type: "resource-announced",
  });
}, "mp.announceResource");

export const markDone = action(() => {
  const myId = localPlayerId();
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player || !player.hasPlacedResource()) {
    return;
  }

  game.markPlayerDone(myId);
  broadcast({ playerId: myId, type: "turn-done" });
}, "mp.markDone");

export const eliminateSelf = action(() => {
  const myId = localPlayerId();
  if (!myId) {
    return;
  }

  game.eliminatePlayer(myId);
  broadcast({ playerId: myId, type: "player-eliminated" });
}, "mp.eliminateSelf");
