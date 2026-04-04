import { action, atom, withLocalStorage } from "@reatom/core";

import { initClientListener } from "./multiplayer/client";
import { hostPeerId, isHost } from "./multiplayer/state";
import {
  broadcast,
  connectedPeers,
  connectToRoom,
  connectionStatus,
  currentRoomCode,
  disconnect,
  generateRoomCode,
  on,
  onPeerLeave,
  selfId,
  send,
  onPeerJoin,
} from "./multiplayer/transport";
import type { LobbyPlayer } from "./types";
import { MAX_PLAYERS } from "./types";

export const playerName = atom("", "lobby.playerName").extend(
  withLocalStorage("player-name")
);
export const lobbyPlayers = atom<LobbyPlayer[]>([], "lobby.players");
export const lobbyError = atom<string | null>(null, "lobby.error");

export { connectionStatus, currentRoomCode, selfId };

const broadcastLobbyState = (): void => {
  broadcast({
    hostId: selfId,
    players: lobbyPlayers(),
    type: "lobby-state",
  });
};

const initLobbyListeners = (): void => {
  on("player-info", (msg, peerId) => {
    if (!isHost()) {
      return;
    }
    const current = lobbyPlayers();
    if (current.length >= MAX_PLAYERS) {
      return;
    }
    if (current.some((p) => p.peerId === peerId)) {
      return;
    }

    lobbyPlayers.set([...current, { name: msg.name, peerId, ready: false }]);
    broadcastLobbyState();
  });

  on("lobby-state", (msg) => {
    if (isHost()) {
      return;
    }
    lobbyPlayers.set(msg.players);
    hostPeerId.set(msg.hostId);
    connectionStatus.set("connected");
  });

  on("kick-player", (msg) => {
    if (msg.peerId !== selfId) {
      return;
    }
    disconnect();
    lobbyPlayers.set([]);
    lobbyError.set("Вас удалили из комнаты");
  });

  onPeerLeave((peerId) => {
    if (!isHost()) {
      return;
    }
    const current = lobbyPlayers();
    if (!current.some((p) => p.peerId === peerId)) {
      return;
    }
    lobbyPlayers.set(current.filter((p) => p.peerId !== peerId));
    broadcastLobbyState();
  });
};

export const createRoom = action(() => {
  const name = playerName();
  if (!name.trim()) {
    return;
  }

  lobbyError.set(null);
  isHost.set(true);

  const code = generateRoomCode();
  connectToRoom(code);
  connectionStatus.set("connected");

  lobbyPlayers.set([{ name, peerId: selfId, ready: true }]);
  hostPeerId.set(selfId);

  initLobbyListeners();
}, "lobby.createRoom");

export const joinRoom = action((code: string) => {
  const name = playerName();
  if (!name.trim() || !code.trim()) {
    return;
  }

  lobbyError.set(null);
  isHost.set(false);

  connectToRoom(code);
  lobbyPlayers.set([]);

  initLobbyListeners();
  initClientListener();

  onPeerJoin((peerId) => {
    send({ name, type: "player-info" }, peerId);
  });
  for (const peerId of connectedPeers()) {
    send({ name, type: "player-info" }, peerId);
  }
}, "lobby.joinRoom");

export const kickPlayer = action((peerId: string) => {
  if (!isHost()) {
    return;
  }
  lobbyPlayers.set(lobbyPlayers().filter((p) => p.peerId !== peerId));
  broadcast({ peerId, type: "kick-player" });
  broadcastLobbyState();
}, "lobby.kickPlayer");

export const leaveRoom = action(() => {
  disconnect();
  lobbyPlayers.set([]);
  isHost.set(false);
  hostPeerId.set(null);
  lobbyError.set(null);
}, "lobby.leaveRoom");

export const toggleReady = action(() => {
  if (isHost()) {
    lobbyPlayers.set(
      lobbyPlayers().map((p) =>
        p.peerId === selfId ? { ...p, ready: !p.ready } : p
      )
    );
    broadcastLobbyState();
  }
}, "lobby.toggleReady");
