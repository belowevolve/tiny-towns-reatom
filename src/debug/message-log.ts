import { atom } from "@reatom/core";

import type { NetworkMessage } from "../model/multiplayer/protocol";
import { onMessage, onSend } from "../model/multiplayer/transport";

const MAX_LOG_ENTRIES = 50;

export interface LogEntry {
  direction: "in" | "out";
  type: string;
  data: NetworkMessage;
  target?: string;
  timestamp: number;
}

export const messageLog = atom<LogEntry[]>([], "debug.messageLog");
export const lastIncoming = atom<string>("(none)", "debug.lastIncoming");
export const lastOutgoing = atom<string>("(none)", "debug.lastOutgoing");
export const incomingCount = atom(0, "debug.incomingCount");
export const outgoingCount = atom(0, "debug.outgoingCount");

export const initMessageLog = (): void => {
  onMessage((msg, _peerId) => {
    const entry: LogEntry = {
      data: msg,
      direction: "in",
      timestamp: Date.now(),
      type: msg.type,
    };
    messageLog.set((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
    lastIncoming.set(JSON.stringify(msg, null, 2));
    incomingCount.set(incomingCount() + 1);
  });

  onSend((msg, targetPeerId) => {
    const entry: LogEntry = {
      data: msg,
      direction: "out",
      target: targetPeerId,
      timestamp: Date.now(),
      type: msg.type,
    };
    messageLog.set((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
    lastOutgoing.set(JSON.stringify(msg, null, 2));
    outgoingCount.set(outgoingCount() + 1);
  });
};
