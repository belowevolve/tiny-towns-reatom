import { atom, computed } from "@reatom/core";

import {
  connectionStatus,
  currentRoomCode,
  joinRoom,
  kickPlayer,
  leaveRoom,
  lobbyError,
  lobbyPlayers,
  playerName,
  selfId,
} from "@/model/lobby";
import { startMultiplayerGame } from "@/model/multiplayer/host";
import { isHost } from "@/model/multiplayer/state";
import { MAX_PLAYERS } from "@/model/types";
import { rootRoute } from "@/shared/lib/router";
import { Button } from "@/shared/ui/button";
import { colors, radius } from "@/shared/ui/design-system";
import { flex } from "@/shared/ui/flex";
import { Input } from "@/shared/ui/input";
import { text } from "@/shared/ui/text";

const PlayerListItem = ({
  isSelf,
  name,
  peerId,
  ready,
}: {
  isSelf: boolean;
  name: string;
  peerId: string;
  ready: boolean;
}) => (
  <div
    css={`
      ${flex({ align: "center", direction: "row", gap: 2.5 })}
      padding: 10px 14px;
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: ${radius.sm};
      margin-bottom: 6px;

      &[data-self="true"] {
        border-color: ${colors.accent};
        background: ${colors.accentSoft};
      }
    `}
    attr:data-self={isSelf}
  >
    <span
      css={`
        ${text({ fw: "medium", size: "md" })}
        flex: 1;
      `}
    >
      {name}
    </span>
    <span css={text({ c: "muted", size: "sm" })}>
      {ready ? "✓ Готов" : "Ожидание…"}
    </span>
    {computed(() =>
      isHost() && !isSelf ? (
        <Button
          size="icon-sm"
          variant="danger"
          on:click={() => kickPlayer(peerId)}
        >
          ✕
        </Button>
      ) : (
        ""
      )
    )}
  </div>
);

const RoomView = () => {
  const canStart = computed(() => {
    const players = lobbyPlayers();
    return isHost() && players.length >= 2 && players.length <= MAX_PLAYERS;
  }, "room.canStart");

  return (
    <div
      css={`
        ${flex({ align: "center", gap: 5 })}
        width: 100%;
        max-width: 400px;
      `}
    >
      <div css={flex({ align: "center", gap: 1 })}>
        <span css={text({ c: "muted", fw: "semibold", size: "sm" })}>
          Код комнаты
        </span>
        <span css={text({ c: "accent", fw: "bold", size: "xl" })}>
          {currentRoomCode}
        </span>
      </div>

      <span css={text({ c: "muted", size: "sm" })}>
        {computed(() => {
          const status = connectionStatus();
          if (status === "connecting") {
            return "Подключение…";
          }
          if (status === "connected") {
            return "Подключено";
          }
          if (status === "error") {
            return "Ошибка подключения";
          }
          return "";
        })}
      </span>

      <div css="width: 100%;">
        <h3
          css={`
            ${text({ c: "muted", fw: "semibold", size: "md" })}margin: 0 0 10px;
          `}
        >
          Игроки ({computed(() => lobbyPlayers().length)}/{MAX_PLAYERS})
        </h3>
        {computed(() =>
          lobbyPlayers().map((p) => (
            <PlayerListItem
              isSelf={p.peerId === selfId}
              name={p.name}
              peerId={p.peerId}
              ready={p.ready}
            />
          ))
        )}
      </div>

      <div css={flex({ align: "center", direction: "row", gap: 2.5 })}>
        {computed(() =>
          isHost() ? (
            <Button
              disabled={!canStart()}
              on:click={() => startMultiplayerGame()}
            >
              Начать игру
            </Button>
          ) : (
            <span css={text({ c: "muted", size: "md" })}>Ожидание хоста…</span>
          )
        )}
        <Button
          variant="secondary"
          on:click={() => {
            leaveRoom();
            rootRoute.go();
          }}
        >
          Покинуть
        </Button>
      </div>
    </div>
  );
};

const NamePrompt = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const nameValue = atom("", "room.namePrompt");

  return (
    <div
      css={`
        ${flex({ align: "center", gap: 6 })}
        width: 100%;
      `}
    >
      <h1 css={text({ fw: "bold", size: "xl" })}>Tiny Towns</h1>
      <p
        css={`
          ${text({ c: "muted", size: "md" })}
          margin: 4px 0 24px;
          text-align: center;
        `}
      >
        Введите имя чтобы продолжить
      </p>
      <div
        css={`
          ${flex({ gap: 3 })}
          width: 100%;
          max-width: 300px;
        `}
      >
        <label
          css={`
            ${text({ c: "muted", fw: "semibold", size: "sm" })}
            display: flex;
            flex-direction: column;
            gap: 6px;
          `}
        >
          Ваше имя
          <Input
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            model:value={nameValue}
          />
        </label>
      </div>
      <div
        css={`
          ${flex({ gap: 3 })}
          width: 100%;
          max-width: 300px;
        `}
      >
        <Button
          css="width: 100%;"
          on:click={() => {
            const name = nameValue();
            if (name.trim()) {
              onSubmit(name);
            }
          }}
        >
          Продолжить
        </Button>
      </div>
    </div>
  );
};

export const RoomPage = ({ code }: { code: string }) => {
  const errorDisplay = computed(() => {
    const err = lobbyError();
    if (!err) {
      return "";
    }
    return (
      <div
        css={`
          padding: 10px 16px;
          background: ${colors.dangerSoft};
          border: 1px solid ${colors.danger};
          border-radius: ${radius.md};
          margin-bottom: 16px;
          text-align: center;
        `}
      >
        <span css={text({ c: "danger", size: "sm" })}>{err}</span>
      </div>
    );
  }, "room.errorDisplay");

  const view = computed(() => {
    const requestedCode = code;
    const currentCode = currentRoomCode();

    if (currentCode === requestedCode) {
      return <RoomView />;
    }

    if (!playerName()) {
      return (
        <NamePrompt
          onSubmit={(name) => {
            playerName.set(name);
            joinRoom(requestedCode);
          }}
        />
      );
    }

    if (!currentCode) {
      joinRoom(requestedCode);
    }

    return <RoomView />;
  }, "room.view");

  return (
    <div
      css={`
        ${flex({ align: "center", justify: "center" })}
        min-height: 100vh;
        padding: 24px;
      `}
    >
      {errorDisplay}
      {view}
    </div>
  );
};
