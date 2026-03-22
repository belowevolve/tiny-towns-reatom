import { action, atom, withLocalStorage } from "@reatom/core";

import { initClientListener } from "./multiplayer/client";
import type { NetworkMessage } from "./multiplayer/protocol";
import {
  broadcast,
  connectedPeers,
  connectToRoom,
  connectionStatus,
  currentRoomCode,
  disconnect,
  generateRoomCode,
  onMessage,
  selfId,
  send,
} from "./multiplayer/transport";
import type { LobbyPlayer } from "./types";
import { MAX_PLAYERS } from "./types";

export const playerName = atom("", "lobby.playerName").extend(
  withLocalStorage("player-name")
);
export const isHost = atom(false, "lobby.isHost");
export const lobbyPlayers = atom<LobbyPlayer[]>([], "lobby.players");
export const hostPeerId = atom<string | null>(null, "lobby.hostPeerId");
export const lobbyError = atom<string | null>(null, "lobby.error");

export { connectionStatus, currentRoomCode, selfId };

const broadcastLobbyState = (): void => {
  broadcast({
    hostId: selfId,
    players: lobbyPlayers(),
    type: "lobby-state",
  });
};

const handleLobbyMessage = (msg: NetworkMessage, peerId: string): void => {
  if (msg.type === "player-info" && isHost()) {
    const current = lobbyPlayers();
    if (current.length >= MAX_PLAYERS) {
      return;
    }
    if (current.some((p) => p.peerId === peerId)) {
      return;
    }

    lobbyPlayers.set([...current, { name: msg.name, peerId, ready: false }]);
    broadcastLobbyState();
  }

  if (msg.type === "lobby-state" && !isHost()) {
    lobbyPlayers.set(msg.players);
    hostPeerId.set(msg.hostId);
  }

  if (msg.type === "kick-player" && msg.peerId === selfId) {
    disconnect();
    lobbyPlayers.set([]);
    lobbyError.set("Вас удалили из комнаты");
  }
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

  lobbyPlayers.set([{ name, peerId: selfId, ready: true }]);
  hostPeerId.set(selfId);

  onMessage(handleLobbyMessage);
}, "lobby.createRoom");

export const joinRoom = action((code: string) => {
  const name = playerName();
  if (!name.trim() || !code.trim()) {
    return;
  }

  lobbyError.set(null);
  isHost.set(false);

  connectToRoom(code.toUpperCase());
  lobbyPlayers.set([]);

  onMessage(handleLobbyMessage);
  initClientListener();

  const unsub = connectedPeers.subscribe((peers) => {
    if (peers.length > 0) {
      send({ name, type: "player-info" }, peers[0]);
      unsub();
    }
  });
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
