import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { hostPeerId, isHost } from "../lobby";
import type { Resource } from "../types";
import { hostAnnounce, scheduleAdvanceCheck } from "./host";
import { broadcast, sendToHost } from "./transport";

const getHostId = (): string | null => peek(hostPeerId);

export const announceResource = action((resource: Resource) => {
  const mb = game.currentMasterBuilder();
  const myId = peek(localPlayerId);
  if (!mb || mb.id !== myId) {
    return;
  }

  if (peek(isHost)) {
    hostAnnounce(resource, myId);
  } else {
    game.announceResource(resource);
    const host = getHostId();
    if (host) {
      sendToHost({ resource, type: "announce-resource" }, host);
    }
  }
}, "mp.announceResource");

export const markDone = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }
  const player = game.findPlayer(myId);
  if (!player || !player.hasPlacedResource()) {
    return;
  }

  game.markPlayerDone(myId);

  if (peek(isHost)) {
    scheduleAdvanceCheck();
    return;
  }
  const host = getHostId();
  if (host) {
    sendToHost({ type: "turn-done" }, host);
  }
}, "mp.markDone");

export const eliminateSelf = action(() => {
  const myId = peek(localPlayerId);
  if (!myId) {
    return;
  }

  if (peek(isHost)) {
    broadcast({ playerId: myId, type: "player-eliminated" });
    game.eliminatePlayer(myId);
  } else {
    const host = getHostId();
    if (host) {
      sendToHost({ type: "player-eliminated-self" }, host);
    }
  }
}, "mp.eliminateSelf");
