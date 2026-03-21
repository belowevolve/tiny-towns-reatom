import { action, peek } from "@reatom/core";

import { game, localPlayerId } from "../game";
import { hostPeerId, isHost } from "../lobby";
import type { BuildMatch, Resource } from "../types";
import { broadcast, selfId, sendToHost } from "./transport";

const getHostId = (): string | null => peek(hostPeerId);

export const announceResource = action((resource: Resource) => {
  const mb = game.currentMasterBuilder();
  const myId = peek(localPlayerId);
  if (!mb || mb.id !== myId) {
    return;
  }

  game.announceResource(resource);

  if (peek(isHost)) {
    broadcast({
      masterBuilderId: myId,
      resource,
      turnNumber: game.turnNumber(),
      type: "resource-announced",
    });
  } else {
    const host = getHostId();
    if (host) {
      sendToHost({ resource, type: "announce-resource" }, host);
    }
  }
}, "mp.announceResource");

export const sendPlaceResource = action((index: number, resource: Resource) => {
  if (peek(isHost)) {
    broadcast({
      action: { index, kind: "place-resource", resource },
      playerId: selfId,
      type: "player-action",
    });
  } else {
    const host = getHostId();
    if (host) {
      sendToHost({ index, resource, type: "place-resource" }, host);
    }
  }
}, "mp.sendPlace");

export const sendBuildAtCell = action(
  (match: BuildMatch, targetIndex: number) => {
    if (peek(isHost)) {
      broadcast({
        action: { kind: "build-at-cell", match, targetIndex },
        playerId: selfId,
        type: "player-action",
      });
    } else {
      const host = getHostId();
      if (host) {
        sendToHost({ match, targetIndex, type: "build-at-cell" }, host);
      }
    }
  },
  "mp.sendBuild"
);

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
