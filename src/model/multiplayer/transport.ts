import { action, atom } from "@reatom/core";

import type { NetworkMessage } from "./protocol";

export const selfId = crypto.randomUUID();

const WS_URL = import.meta.env.VITE_WS_URL as string;

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
export const currentRoomCode = atom<string | null>(null, "transport.roomCode");

type Handler<T = NetworkMessage> = (data: T, peerId: string) => void;
type PeerHandler = (peerId: string) => void;

const msgHandlers = new Map<string, Set<Handler>>();
const peerJoinHandlers = new Set<PeerHandler>();
const peerLeaveHandlers = new Set<PeerHandler>();

let ws: WebSocket | null = null;
let intentionalClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BACKOFF_BASE = 1000;
const BACKOFF_MAX = 30_000;

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

const wsSend = (payload: Record<string, unknown>): void => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

export const send = (msg: NetworkMessage, targetPeerId: string): void => {
  wsSend({ data: msg, target: targetPeerId, type: "msg" });
};

export const broadcast = (msg: NetworkMessage): void => {
  wsSend({ data: msg, type: "msg" });
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

const cancelReconnect = (): void => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempt = 0;
};

const dispatchServerMessage = (raw: string): void => {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  if (msg.type === "joined") {
    reconnectAttempt = 0;
    connectionStatus.set("connected");
    connectedPeers.set(msg.peers as string[]);
    for (const peerId of msg.peers as string[]) {
      for (const handler of peerJoinHandlers) {
        handler(peerId);
      }
    }
    return;
  }

  if (msg.type === "peer-joined") {
    const peerId = msg.peerId as string;
    connectedPeers.set([...connectedPeers(), peerId]);
    for (const handler of peerJoinHandlers) {
      handler(peerId);
    }
    return;
  }

  if (msg.type === "peer-left") {
    const peerId = msg.peerId as string;
    connectedPeers.set(connectedPeers().filter((id) => id !== peerId));
    for (const handler of peerLeaveHandlers) {
      handler(peerId);
    }
    return;
  }

  if (msg.type === "msg") {
    const data = msg.data as NetworkMessage;
    const from = msg.from as string;
    const handlers = msgHandlers.get(data.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(data, from);
      }
    }
  }
};

// createSocket and scheduleReconnect reference each other (reconnect -> create -> on close -> reconnect).
// Using `let` + assignment to break the circular `const` forward-reference issue.
/* oxlint-disable no-use-before-define, prefer-const */
let createSocket: (roomCode: string) => void;
let scheduleReconnect: (roomCode: string) => void;

scheduleReconnect = (roomCode) => {
  if (intentionalClose) {
    return;
  }
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    connectionStatus.set("error");
    return;
  }

  const delay = Math.min(BACKOFF_BASE * 2 ** reconnectAttempt, BACKOFF_MAX);
  reconnectAttempt += 1;
  connectionStatus.set("connecting");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createSocket(roomCode);
  }, delay);
};

createSocket = (roomCode) => {
  if (ws) {
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws.close();
    }
    ws = null;
  }

  const socket = new WebSocket(WS_URL);
  ws = socket;

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ peerId: selfId, roomCode, type: "join" }));
  });

  socket.addEventListener("message", (event) => {
    dispatchServerMessage(event.data as string);
  });

  socket.addEventListener("close", () => {
    if (!intentionalClose && currentRoomCode() === roomCode) {
      scheduleReconnect(roomCode);
    }
  });

  socket.addEventListener("error", () => {
    // close fires after error — reconnection handled there
  });
};
/* oxlint-enable no-use-before-define */

export const connectToRoom = action((roomCode: string) => {
  cancelReconnect();
  intentionalClose = false;

  if (ws) {
    intentionalClose = true;
    ws.close();
    intentionalClose = false;
  }

  clearHandlers();
  connectionStatus.set("connecting");
  currentRoomCode.set(roomCode);
  connectedPeers.set([]);

  createSocket(roomCode);
}, "transport.connect");

export const disconnect = action(() => {
  intentionalClose = true;
  cancelReconnect();

  if (ws) {
    ws.close();
    ws = null;
  }

  currentRoomCode.set(null);
  connectedPeers.set([]);
  connectionStatus.set("disconnected");
  clearHandlers();
}, "transport.disconnect");
