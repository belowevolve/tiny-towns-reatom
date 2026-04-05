import type { ServerWebSocket } from "bun";

const PORT = Number.parseInt(process.env.PORT || "3001", 10);
const MAX_ROOM_SIZE = 6;
const ROOM_CODE_RE = /^[a-z2-9]{4}$/;

interface WsData {
  peerId: string;
  roomCode: string;
}

const rooms = new Map<string, Map<string, ServerWebSocket<WsData>>>();

const removeFromRoom = (ws: ServerWebSocket<WsData>): void => {
  const { peerId, roomCode } = ws.data;
  if (!roomCode) {
    return;
  }

  ws.publish(`room:${roomCode}`, JSON.stringify({ peerId, type: "peer-left" }));
  ws.unsubscribe(`room:${roomCode}`);

  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }
  room.delete(peerId);
  if (room.size === 0) {
    rooms.delete(roomCode);
  }
};

const bun = Bun.serve<WsData>({
  fetch(req, server) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return new Response("ok");
    }

    if (server.upgrade(req, { data: { peerId: "", roomCode: "" } })) {
      return;
    }

    return new Response("expected websocket", { status: 426 });
  },

  port: PORT,

  websocket: {
    close(ws) {
      removeFromRoom(ws);
    },
    idleTimeout: 60,

    message(ws, raw) {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw as string);
      } catch {
        ws.send(JSON.stringify({ message: "invalid json", type: "error" }));
        return;
      }

      if (msg.type === "join") {
        const roomCode = msg.roomCode as string;
        const peerId = msg.peerId as string;

        if (!roomCode || !ROOM_CODE_RE.test(roomCode)) {
          ws.send(
            JSON.stringify({ message: "invalid room code", type: "error" })
          );
          return;
        }
        if (!peerId) {
          ws.send(
            JSON.stringify({ message: "missing peer id", type: "error" })
          );
          return;
        }

        if (ws.data.roomCode) {
          removeFromRoom(ws);
        }

        let room = rooms.get(roomCode);
        if (!room) {
          room = new Map();
          rooms.set(roomCode, room);
        }

        if (room.size >= MAX_ROOM_SIZE && !room.has(peerId)) {
          ws.send(JSON.stringify({ message: "room is full", type: "error" }));
          return;
        }

        const existingPeers = [...room.keys()].filter((id) => id !== peerId);

        room.set(peerId, ws);
        ws.data = { peerId, roomCode };
        ws.subscribe(`room:${roomCode}`);

        ws.send(JSON.stringify({ peers: existingPeers, type: "joined" }));
        ws.publish(
          `room:${roomCode}`,
          JSON.stringify({ peerId, type: "peer-joined" })
        );
        return;
      }

      if (msg.type === "msg") {
        if (!ws.data.roomCode) {
          return;
        }

        const envelope = JSON.stringify({
          data: msg.data,
          from: ws.data.peerId,
          type: "msg",
        });

        if (msg.target) {
          const target = rooms.get(ws.data.roomCode)?.get(msg.target as string);
          if (target) {
            target.send(envelope);
          }
        } else {
          ws.publish(`room:${ws.data.roomCode}`, envelope);
        }
      }
    },

    open(_ws) {
      console.log("ws opened");
    },

    sendPings: true,
  },
});

console.log(`tiny-towns ws server on :${bun.port}`);
