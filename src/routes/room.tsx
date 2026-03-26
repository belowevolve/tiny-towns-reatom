import { atom, computed } from "@reatom/core";

import {
  connectionStatus,
  currentRoomCode,
  isHost,
  joinRoom,
  kickPlayer,
  leaveRoom,
  lobbyError,
  lobbyPlayers,
  playerName,
  selfId,
} from "../model/lobby";
import { startMultiplayerGame } from "../model/multiplayer/host";
import { MAX_PLAYERS } from "../model/types";
import { homeRoute, roomRoute } from "../routes";
import { Button } from "../shared/ui/button";
import { palette, radius } from "../shared/ui/design-system";
import { TextInput } from "../shared/ui/input";

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
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: ${palette.surface};
      border: 1px solid ${palette.border};
      border-radius: ${radius.sm};
      margin-bottom: 6px;

      &[data-self="true"] {
        border-color: ${palette.accent};
        background: ${palette.accentSoft};
      }
    `}
    attr:data-self={isSelf}
  >
    <span
      css={`
        flex: 1;
        font-weight: 500;
        font-size: 0.9rem;
      `}
    >
      {name}
      {isSelf && (
        <span
          css={`
            font-weight: 400;
            color: ${palette.textMuted};
            font-size: 0.75rem;
          `}
        >
          {" "}
          (вы)
        </span>
      )}
    </span>
    <span
      css={`
        font-size: 0.75rem;
        color: ${palette.textMuted};
      `}
    >
      {ready ? "✓ Готов" : "Ожидание…"}
    </span>
    {computed(() =>
      isHost() && !isSelf ? (
        <button
          css={`
            padding: 2px 6px;
            border: 1px solid ${palette.danger};
            background: transparent;
            color: ${palette.danger};
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.7rem;
            line-height: 1;

            &:hover {
              background: ${palette.danger};
              color: oklch(1 0 0);
            }
          `}
          on:click={() => kickPlayer(peerId)}
        >
          ✕
        </button>
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        width: 100%;
        max-width: 400px;
      `}
    >
      <div
        css={`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        `}
      >
        <span
          css={`
            font-size: 0.75rem;
            font-weight: 600;
            color: ${palette.textMuted};
            text-transform: uppercase;
            letter-spacing: 0.08em;
          `}
        >
          Код комнаты
        </span>
        <span
          css={`
            font-size: 2.4rem;
            font-weight: 800;
            letter-spacing: 0.25em;
            color: ${palette.accent};
          `}
        >
          {currentRoomCode}
        </span>
      </div>

      <div
        css={`
          font-size: 0.8rem;
          color: ${palette.textMuted};
        `}
      >
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
      </div>

      <div css="width: 100%;">
        <h3
          css={`
            font-size: 0.85rem;
            font-weight: 600;
            color: ${palette.textMuted};
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0 0 10px;
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

      <div
        css={`
          display: flex;
          gap: 10px;
          align-items: center;
        `}
      >
        {computed(() =>
          isHost() ? (
            <Button
              disabled={!canStart()}
              on:click={() => startMultiplayerGame()}
            >
              Начать игру
            </Button>
          ) : (
            <span
              css={`
                font-size: 0.85rem;
                color: ${palette.textMuted};
              `}
            >
              Ожидание хоста…
            </span>
          )
        )}
        <Button
          variant="secondary"
          on:click={() => {
            leaveRoom();
            homeRoute.go();
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      `}
    >
      <h1
        css={`
          font-size: 2rem;
          font-weight: 800;
          color: ${palette.text};
          margin: 0;
          text-align: center;
        `}
      >
        Tiny Towns
      </h1>
      <p
        css={`
          font-size: 0.9rem;
          color: ${palette.textMuted};
          margin: 4px 0 24px;
          text-align: center;
        `}
      >
        Введите имя чтобы продолжить
      </p>
      <div
        css={`
          width: 100%;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        `}
      >
        <label
          css={`
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            color: ${palette.textMuted};
            text-transform: uppercase;
            letter-spacing: 0.06em;
          `}
        >
          Ваше имя
          <TextInput
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            model:value={nameValue}
          />
        </label>
      </div>
      <div
        css={`
          width: 100%;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 12px;
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

export const RoomPage = () => {
  const errorDisplay = computed(() => {
    const err = lobbyError();
    if (!err) {
      return "";
    }
    return (
      <div
        css={`
          padding: 10px 16px;
          background: ${palette.dangerSoft};
          border: 1px solid ${palette.danger};
          color: ${palette.danger};
          border-radius: ${radius.md};
          font-size: 0.85rem;
          margin-bottom: 16px;
          text-align: center;
        `}
      >
        {err}
      </div>
    );
  }, "room.errorDisplay");

  const view = computed(() => {
    const params = roomRoute();
    if (!params) {
      return null;
    }

    const { code } = params;
    const currentCode = currentRoomCode();

    if (currentCode === code) {
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

    if (!currentCode) {
      joinRoom(code);
    }

    return <RoomView />;
  }, "room.view");

  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
      `}
    >
      {errorDisplay}
      {view}
    </div>
  );
};
