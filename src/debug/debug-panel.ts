import { atom, effect } from "@reatom/core";
import { Pane } from "tweakpane";

import { game, localPlayerId } from "../model/game";
import { hostPeerId, isHost } from "../model/lobby";
import {
  connectedPeers,
  connectionStatus,
  currentRoomCode,
  selfId,
} from "../model/multiplayer/transport";
import {
  incomingCount,
  initMessageLog,
  lastIncoming,
  lastOutgoing,
  outgoingCount,
} from "./message-log";
import { reatomPaneFolder, withBinding } from "./tweakpane";
import { reatomDisposable } from "./tweakpane/core";

const debugPane = reatomDisposable(
  () => new Pane({ expanded: true, title: "Debug Panel" }),
  "debug.pane"
);

// ---------------------------------------------------------------------------
// 1. Game State
// ---------------------------------------------------------------------------
const gameFolder = reatomPaneFolder({ title: "Game State" }, debugPane);

const dPhase = atom("lobby", "debug.phase").extend(
  withBinding({ label: "Phase", readonly: true }, gameFolder)
);
const dTurnPhase = atom("announce", "debug.turnPhase").extend(
  withBinding({ label: "Turn Phase", readonly: true }, gameFolder)
);
const dTurnNumber = atom(0, "debug.turnNumber").extend(
  withBinding({ label: "Turn #", readonly: true }, gameFolder)
);
const dCurrentResource = atom("(none)", "debug.currentResource").extend(
  withBinding({ label: "Resource", readonly: true }, gameFolder)
);
const dMBIndex = atom(0, "debug.mbIndex").extend(
  withBinding({ label: "MB Index", readonly: true }, gameFolder)
);
const dMBName = atom("(none)", "debug.mbName").extend(
  withBinding({ label: "MB Name", readonly: true }, gameFolder)
);
const dAllReady = atom(false, "debug.allReady").extend(
  withBinding({ label: "All Ready", readonly: true }, gameFolder)
);
const dActiveCount = atom(0, "debug.activeCount").extend(
  withBinding({ label: "Active Players", readonly: true }, gameFolder)
);

// ---------------------------------------------------------------------------
// 2. Player Readiness
// ---------------------------------------------------------------------------
const readinessFolder = reatomPaneFolder(
  { title: "Player Readiness" },
  debugPane
);

const dReadinessJson = atom("{}", "debug.readinessJson").extend(
  withBinding(
    { label: "Readiness", multiline: true, readonly: true, rows: 6 },
    readinessFolder
  )
);

// ---------------------------------------------------------------------------
// 3. Network
// ---------------------------------------------------------------------------
const networkFolder = reatomPaneFolder({ title: "Network" }, debugPane);

const dIsHost = atom(false, "debug.isHost").extend(
  withBinding({ label: "Is Host", readonly: true }, networkFolder)
);
const dLocalId = atom("", "debug.localId").extend(
  withBinding({ label: "Local Player ID", readonly: true }, networkFolder)
);
const dSelfId = atom("", "debug.selfId").extend(
  withBinding({ label: "Self (Peer) ID", readonly: true }, networkFolder)
);
const dHostPeerId = atom("", "debug.hostPeerId").extend(
  withBinding({ label: "Host Peer ID", readonly: true }, networkFolder)
);
const dConnStatus = atom("disconnected", "debug.connStatus").extend(
  withBinding({ label: "Connection", readonly: true }, networkFolder)
);
const dPeers = atom("[]", "debug.peers").extend(
  withBinding({ label: "Peers", readonly: true }, networkFolder)
);
const dRoomCode = atom("", "debug.roomCode").extend(
  withBinding({ label: "Room Code", readonly: true }, networkFolder)
);

// ---------------------------------------------------------------------------
// 4. Message Log
// ---------------------------------------------------------------------------
const msgFolder = reatomPaneFolder(
  { expanded: false, title: "Message Log" },
  debugPane
);

const dLastIn = atom("(none)", "debug.lastIn").extend(
  withBinding(
    { label: "Last In", multiline: true, readonly: true, rows: 4 },
    msgFolder
  )
);
const dLastOut = atom("(none)", "debug.lastOut").extend(
  withBinding(
    { label: "Last Out", multiline: true, readonly: true, rows: 4 },
    msgFolder
  )
);
const dInCount = atom(0, "debug.inCount").extend(
  withBinding({ label: "In Count", readonly: true }, msgFolder)
);
const dOutCount = atom(0, "debug.outCount").extend(
  withBinding({ label: "Out Count", readonly: true }, msgFolder)
);

// ---------------------------------------------------------------------------
// Sync effects
// ---------------------------------------------------------------------------
const syncAll = () => {
  effect(() => {
    dPhase.set(game.phase());
    dTurnPhase.set(game.turnPhase());
    dTurnNumber.set(game.turnNumber());
    dCurrentResource.set(game.currentResource() ?? "(none)");
    dMBIndex.set(game.masterBuilderIndex());
    dMBName.set(game.currentMasterBuilder()?.name ?? "(none)");
    dAllReady.set(game.allPlayersReady());
    dActiveCount.set(game.activePlayers().length);
  }, "debug.syncGame");

  effect(() => {
    const readiness = game.playerReadiness();
    const players = game.players();
    const active = game.activePlayers();

    const lines: string[] = [];
    for (const p of active) {
      const ready = readiness[p.id] ?? false;
      const placed = p.hasPlacedResource();
      lines.push(`${p.name}: placed=${placed} ready=${ready}`);
    }

    const eliminated = game.eliminatedPlayers();
    for (const p of players) {
      if (eliminated.has(p.id)) {
        lines.push(`${p.name}: ELIMINATED`);
      }
    }

    dReadinessJson.set(lines.join("\n") || "(no players)");
  }, "debug.syncReadiness");

  effect(() => {
    dIsHost.set(isHost());
    dLocalId.set(localPlayerId() ?? "");
    dSelfId.set(selfId);
    dHostPeerId.set(hostPeerId() ?? "");
    dConnStatus.set(connectionStatus());
    dPeers.set(JSON.stringify(connectedPeers()));
    dRoomCode.set(currentRoomCode() ?? "");
  }, "debug.syncNetwork");

  effect(() => {
    dLastIn.set(lastIncoming());
    dLastOut.set(lastOutgoing());
    dInCount.set(incomingCount());
    dOutCount.set(outgoingCount());
  }, "debug.syncMessages");
};

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------
export const initDebugPanel = (): void => {
  initMessageLog();

  debugPane.subscribe();
  gameFolder.subscribe();
  readinessFolder.subscribe();
  networkFolder.subscribe();
  msgFolder.subscribe();

  // subscribe all binding atoms so they mount
  dPhase.subscribe();
  dTurnPhase.subscribe();
  dTurnNumber.subscribe();
  dCurrentResource.subscribe();
  dMBIndex.subscribe();
  dMBName.subscribe();
  dAllReady.subscribe();
  dActiveCount.subscribe();

  dReadinessJson.subscribe();

  dIsHost.subscribe();
  dLocalId.subscribe();
  dSelfId.subscribe();
  dHostPeerId.subscribe();
  dConnStatus.subscribe();
  dPeers.subscribe();
  dRoomCode.subscribe();

  dLastIn.subscribe();
  dLastOut.subscribe();
  dInCount.subscribe();
  dOutCount.subscribe();

  syncAll();
};
