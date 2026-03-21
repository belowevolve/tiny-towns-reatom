import { action, atom } from "@reatom/core";
import type { Room } from "trystero";
import { joinRoom, selfId } from "trystero/nostr";

import type { ConnectionStatus } from "../types";
import type { NetworkMessage } from "./protocol";

const APP_ID = "tiny-towns-reatom";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 4;

export const generateRoomCode = (): string => {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
};

export { selfId };

export const connectionStatus = atom<ConnectionStatus>(
  "disconnected",
  "transport.status"
);
export const connectedPeers = atom<string[]>([], "transport.peers");
export const currentRoom = atom<Room | null>(null, "transport.room");
export const currentRoomCode = atom<string | null>(null, "transport.roomCode");

type MessageHandler = (msg: NetworkMessage, peerId: string) => void;

const messageHandlers: MessageHandler[] = [];
let sendFn: ((data: NetworkMessage, target?: string) => void) | null = null;

export const onMessage = (handler: MessageHandler): void => {
  messageHandlers.push(handler);
};

export const clearMessageHandlers = (): void => {
  messageHandlers.length = 0;
};

export const send = (msg: NetworkMessage, targetPeerId?: string): void => {
  if (!sendFn) {
    return;
  }
  if (targetPeerId) {
    sendFn(msg, targetPeerId);
  } else {
    sendFn(msg);
  }
};

export const sendToHost = (msg: NetworkMessage, hostPeerId: string): void => {
  send(msg, hostPeerId);
};

export const broadcast = (msg: NetworkMessage): void => {
  send(msg);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- trystero JsonValue index sig mismatch
  const [sendMsg, getMsg] = room.makeAction<any>("msg");

  sendFn = (data, target) => {
    sendMsg(data, target);
  };

  getMsg((data: unknown, peerId: string) => {
    for (const handler of messageHandlers) {
      handler(data as NetworkMessage, peerId);
    }
  });

  room.onPeerJoin((peerId) => {
    connectionStatus.set("connected");
    connectedPeers.set([...connectedPeers(), peerId]);
  });

  room.onPeerLeave((peerId) => {
    connectedPeers.set(connectedPeers().filter((id) => id !== peerId));
    if (connectedPeers().length === 0) {
      connectionStatus.set("connecting");
    }
  });

  currentRoom.set(room);
  connectionStatus.set("connected");
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
  clearMessageHandlers();
}, "transport.disconnect");
