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
}) => {
  return (
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
};

const RoomView = () => {
  const roomCodeCopy = copyAtom("roomCode");
  return (
    <div
      css={`
        ${flex({ align: "center", gap: 5 })}
        animation: lobby-fade-in 0.35s ease-out;
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
            size="icon"
            variant="secondary"
            on:click={() => {
              roomCodeCopy.copy(window.location.href);
            }}
          >
            {() => (roomCodeCopy() ? "✅" : "📋")}
          </Button>
        </span>
      </div>
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
        animation: lobby-fade-in 0.35s ease-out;
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

const LoadingDot = ({ delay }: { delay: string }) => {
  return (
    <div
      css={`
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${colors.accent};
        animation: lobby-bounce 1.4s ease-in-out infinite;
      `}
      style:animation-delay={delay}
    />
  );
};

const ConnectingView = ({ code }: { code: string }) => {
  const showRetry = atom(false, "connecting.showRetry");
  let timer = setTimeout(() => showRetry.set(true), 12_000);

  const retry = () => {
    leaveRoom();
    joinRoom(code);
    showRetry.set(false);
    clearTimeout(timer);
    timer = setTimeout(() => showRetry.set(true), 12_000);
  };

  return (
    <div
      css={`
        ${flex({ align: "center", gap: 5 })}
        animation: lobby-fade-in 0.4s ease-out;
      `}
    >
      <div
        css={`
          position: relative;
          width: 64px;
          height: 64px;
          ${flex({ align: "center", justify: "center" })}
        `}
      >
        <div
          css={`
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid ${colors.border};
            animation: lobby-pulse-ring 2.4s ease-in-out infinite;
          `}
        />
        <div
          css={`
            position: absolute;
            inset: 6px;
            border-radius: 50%;
            border: 2px solid ${colors.accentSoft};
            animation: lobby-pulse-ring 2.4s ease-in-out 0.4s infinite;
          `}
        />
        <div css={flex({ align: "center", direction: "row", gap: 1.5 })}>
          <LoadingDot delay="0s" />
          <LoadingDot delay="0.16s" />
          <LoadingDot delay="0.32s" />
        </div>
      </div>

      <div css={flex({ align: "center", gap: 1 })}>
        <span css={text({ fw: "semibold", size: "md" })}>
          Подключение к комнате
        </span>
        <span css={text({ c: "accent", fw: "bold", size: "xl" })}>{code}</span>
      </div>

      <span css={text({ c: "muted", size: "sm", ta: "center" })}>
        Ожидание других игроков…
      </span>

      {() =>
        showRetry() ? (
          <div
            css={`
              ${flex({ align: "center", gap: 2 })}
              animation: lobby-fade-in 0.3s ease-out;
            `}
          >
            <span css={text({ c: "muted", size: "sm", ta: "center" })}>
              Не удалось найти комнату. Возможно, она ещё не создана.
            </span>
            <div css={flex({ direction: "row", gap: 2 })}>
              <Button variant="secondary" on:click={retry}>
                Попробовать снова
              </Button>
              <Button
                variant="secondary"
                on:click={() => {
                  leaveRoom();
                  rootRoute.go();
                }}
              >
                На главную
              </Button>
            </div>
          </div>
        ) : (
          ""
        )
      }
    </div>
  );
};

export const RoomPage = ({ code }: { code: string }) => {
  if (playerName() && currentRoomCode() !== code) {
    joinRoom(code);
  }

  return (
    <div
      css={`
        ${flex({ align: "center", direction: "column", justify: "center" })}
        min-width: 300px;
      `}
    >
      {() => {
        const status = connectionStatus();
        const currentCode = currentRoomCode();

        if (status === "connected" && currentCode === code) {
          return <RoomView />;
        }

        if (!playerName()) {
          return (
            <NamePrompt
              onSubmit={(name) => {
                playerName.set(name);
                joinRoom(code);
              }}
            />
          );
        }

        return <ConnectingView code={code} />;
      }}
    </div>
  );
};
