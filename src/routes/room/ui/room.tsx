import { atom, computed } from "@reatom/core";

import {
  connectionStatus,
  currentRoomCode,
  joinRoom,
  kickPlayer,
  leaveRoom,
  lobbyPlayers,
  playerName,
  selfId,
} from "@/model/lobby";
import {
  canStartMultiplayerGame,
  startMultiplayerGame,
} from "@/model/multiplayer/host";
import { isHost } from "@/model/multiplayer/state";
import { MAX_PLAYERS } from "@/model/types";
import { rootRoute } from "@/shared/lib/router";
import { Button } from "@/shared/ui/button";
import { colors, radius } from "@/shared/ui/design-system";
import { flex } from "@/shared/ui/flex";
import { Input } from "@/shared/ui/input";
import { text } from "@/shared/ui/text";
import { copyAtom } from "@/shared/utils/clipboard";

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
  const roomCodeCopy = copyAtom("roomCode");
  return (
    <div
      css={`
        ${flex({ align: "center", gap: 5 })}
      `}
    >
      <div css={flex({ align: "center", gap: 1 })}>
        <span css={text({ c: "muted", fw: "semibold", size: "sm" })}>
          Код комнаты
        </span>
        <span
          css={`
            ${flex({ align: "center", direction: "row", gap: 2 })}
            ${text({ c: "accent", fw: "bold", size: "xl" })}
          `}
        >
          {currentRoomCode}
          <Button
            size="icon-sm"
            variant="secondary"
            on:click={() => {
              roomCodeCopy.copy(window.location.href);
            }}
          >
            {() => (roomCodeCopy() ? "✅" : "📋")}
          </Button>
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
        {isHost() ? (
          <Button
            disabled={!canStartMultiplayerGame()}
            on:click={() => startMultiplayerGame()}
          >
            Начать игру
          </Button>
        ) : (
          <span css={text({ c: "muted", size: "md" })}>Ожидание хоста…</span>
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
  const nameInput = atom("", "namePrompt.nameInput");

  return (
    <form
      css={`
        ${flex({ gap: 1 })}
      `}
      on:submit={(e) => {
        e.preventDefault();
        onSubmit(nameInput());
      }}
    >
      <label
        css={`
          ${flex()}
          ${text({ c: "muted", size: "sm" })}
        `}
      >
        Ваше имя
        <Input
          type="text"
          maxlength={20}
          placeholder="Введите имя…"
          model:value={nameInput}
        />
      </label>
      <Button disabled={() => !nameInput()}>Присоединиться</Button>
    </form>
  );
};

const View = ({ code }: { code: string }) => {
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
};

export const RoomPage = ({ code }: { code: string }) => (
  <div
    css={`
      ${flex({ align: "center", direction: "column", justify: "center" })}
    `}
  >
    <View code={code} />
  </div>
);
