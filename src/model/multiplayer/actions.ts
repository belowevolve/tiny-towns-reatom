import { action } from "@reatom/core";

import { game, localPlayerId } from "../game";
import type { Resource } from "../types";
import { hostAnnounce, scheduleAdvanceCheck } from "./host";
import { hostPeerId, isHost } from "./state";
import { broadcast, sendToHost } from "./transport";

export const announceResource = action((resource: Resource) => {
  const mb = game.currentMasterBuilder();
  const myId = localPlayerId();
  if (!mb || mb.id !== myId) {
    return;
  }

  if (isHost()) {
    hostAnnounce(resource, myId);
  } else {
    game.announceResource(resource);
    const host = hostPeerId();
    if (host) {
      sendToHost({ resource, type: "announce-resource" }, host);
    }
  }
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

  if (isHost()) {
    scheduleAdvanceCheck();
    return;
  }
  const host = hostPeerId();
  if (host) {
    sendToHost({ type: "turn-done" }, host);
  }
}, "mp.markDone");

export const eliminateSelf = action(() => {
  const myId = localPlayerId();
  if (!myId) {
    return;
  }

  if (isHost()) {
    broadcast({ playerId: myId, type: "player-eliminated" });
    game.eliminatePlayer(myId);
  } else {
    const host = hostPeerId();
    if (host) {
      sendToHost({ type: "player-eliminated-self" }, host);
    }
  }
}, "mp.eliminateSelf");
