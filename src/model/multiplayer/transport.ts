import { action, atom } from "@reatom/core";
import type { Room } from "trystero";
import { joinRoom, selfId } from "trystero/nostr";

import type { NetworkMessage } from "./protocol";

export { selfId };
const APP_ID = "tiny-towns-reatom";

const ROOM_CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
export const ROOM_CODE_LENGTH = 4;
export const generateRoomCode = (): string => {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
};

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";
export const connectionStatus = atom<ConnectionStatus>(
  "disconnected",
  "transport.status"
);
export const connectedPeers = atom<string[]>([], "transport.peers");
export const currentRoom = atom<Room | null>(null, "transport.room");
export const currentRoomCode = atom<string | null>(null, "transport.roomCode");

type Handler<T = NetworkMessage> = (data: T, peerId: string) => void;
type PeerHandler = (peerId: string) => void;

const msgHandlers = new Map<string, Set<Handler>>();
const peerJoinHandlers = new Set<PeerHandler>();
const peerLeaveHandlers = new Set<PeerHandler>();
let sendFn: ((data: NetworkMessage, target?: string) => void) | null = null;

export const on = <T extends NetworkMessage["type"]>(
  type: T,
  handler: Handler<Extract<NetworkMessage, { type: T }>>
): (() => void) => {
  let set = msgHandlers.get(type);
  if (!set) {
    set = new Set();
    msgHandlers.set(type, set);
  }
  set.add(handler as Handler);
  return () => {
    set.delete(handler as Handler);
  };
};

export const onPeerJoin = (handler: PeerHandler): (() => void) => {
  peerJoinHandlers.add(handler);
  return () => {
    peerJoinHandlers.delete(handler);
  };
};

export const onPeerLeave = (handler: PeerHandler): (() => void) => {
  peerLeaveHandlers.add(handler);
  return () => {
    peerLeaveHandlers.delete(handler);
  };
};

export const send = (msg: NetworkMessage, targetPeerId: string): void => {
  sendFn?.(msg, targetPeerId);
};

export const broadcast = (msg: NetworkMessage): void => {
  sendFn?.(msg);
  const handlers = msgHandlers.get(msg.type);
  if (handlers) {
    for (const handler of handlers) {
      handler(msg, selfId);
    }
  }
};

const clearHandlers = (): void => {
  msgHandlers.clear();
  peerJoinHandlers.clear();
  peerLeaveHandlers.clear();
};

export const connectToRoom = action((roomCode: string) => {
  const existing = currentRoom();
  if (existing) {
    existing.leave();
  }

  connectionStatus.set("connecting");
  currentRoomCode.set(roomCode);
  connectedPeers.set([]);

  const room = joinRoom({ appId: APP_ID }, roomCode);

  // oxlint-disable-next-line typescript/no-explicit-any -- TODO: recheck this
  const [sendMsg, getMsg] = room.makeAction<any>("msg");

  sendFn = (msg, target) => {
    sendMsg(msg, target);
  };

  getMsg((msg: NetworkMessage, peerId: string) => {
    const handlers = msgHandlers.get(msg.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(msg, peerId);
      }
    }
  });

  room.onPeerJoin((peerId) => {
    connectedPeers.set([...connectedPeers(), peerId]);
    for (const handler of peerJoinHandlers) {
      handler(peerId);
    }
  });

  room.onPeerLeave((peerId) => {
    connectedPeers.set(connectedPeers().filter((id) => id !== peerId));
    for (const handler of peerLeaveHandlers) {
      handler(peerId);
    }
  });

  currentRoom.set(room);
}, "transport.connect");

export const disconnect = action(() => {
  const room = currentRoom();
  if (room) {
    room.leave();
  }
  currentRoom.set(null);
  currentRoomCode.set(null);
  connectedPeers.set([]);
  connectionStatus.set("disconnected");
  sendFn = null;
  clearHandlers();
}, "transport.disconnect");
