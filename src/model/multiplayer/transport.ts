import { action, atom } from "@reatom/core";
import { joinRoom, selfId } from "trystero";
import type { Room } from "trystero";

import type { NetworkMessage } from "./protocol";

export { selfId };
const APP_ID = "tiny-towns-reatom";
const ROOM_CONFIG = {
  appId: APP_ID,
  rtcConfig: {
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        credential: "cYhUHvyDTPSbYSxo",
        urls: "turn:global.relay.metered.ca:80",
        username: "c08ca9be8b256a49197fc7e5",
      },
      {
        credential: "cYhUHvyDTPSbYSxo",
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "c08ca9be8b256a49197fc7e5",
      },
      {
        credential: "cYhUHvyDTPSbYSxo",
        urls: "turn:global.relay.metered.ca:443",
        username: "c08ca9be8b256a49197fc7e5",
      },
      {
        credential: "cYhUHvyDTPSbYSxo",
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "c08ca9be8b256a49197fc7e5",
      },
    ],
  },
};

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
  clearHandlers();
  sendFn = null;

  connectionStatus.set("connecting");
  currentRoomCode.set(roomCode);
  connectedPeers.set([]);

  const room = joinRoom(ROOM_CONFIG, roomCode);

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
