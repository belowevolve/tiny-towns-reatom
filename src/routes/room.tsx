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
  <div class={["lobby-player", { "lobby-player--self": isSelf }]}>
    <span class="lobby-player__name">
      {name}
      {isSelf && <span class="lobby-player__you"> (вы)</span>}
    </span>
    <span class="lobby-player__status">{ready ? "✓ Готов" : "Ожидание…"}</span>
    {computed(() =>
      isHost() && !isSelf ? (
        <button class="lobby-player__kick" on:click={() => kickPlayer(peerId)}>
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
    <div class="lobby-room">
      <div class="lobby-room-code">
        <span class="lobby-room-code__label">Код комнаты</span>
        <span class="lobby-room-code__value">{currentRoomCode}</span>
      </div>

      <div class="lobby-status">
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

      <div class="lobby-players">
        <h3 class="lobby-players__title">
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

      <div class="lobby-actions">
        {computed(() =>
          isHost() ? (
            <button
              class="btn-action"
              disabled={!canStart()}
              on:click={() => startMultiplayerGame()}
            >
              Начать игру
            </button>
          ) : (
            <span class="lobby-waiting">Ожидание хоста…</span>
          )
        )}
        <button
          class="btn-secondary"
          on:click={() => {
            leaveRoom();
            homeRoute.go();
          }}
        >
          Покинуть
        </button>
      </div>
    </div>
  );
};

const NamePrompt = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const nameValue = atom("", "room.namePrompt");

  const handleInput = (e: Event) => {
    nameValue.set((e.target as HTMLInputElement).value);
  };

  return (
    <div class="lobby-menu">
      <h1 class="lobby-title">Tiny Towns</h1>
      <p class="lobby-subtitle">Введите имя чтобы продолжить</p>
      <div class="lobby-form">
        <label class="lobby-label">
          Ваше имя
          <input
            class="lobby-input"
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            on:input={handleInput}
          />
        </label>
      </div>
      <div class="lobby-menu-buttons">
        <button
          class="btn-action lobby-btn-large"
          on:click={() => {
            const name = nameValue();
            if (name.trim()) {
              onSubmit(name);
            }
          }}
        >
          Продолжить
        </button>
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
    return <div class="lobby-error">{err}</div>;
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
    <div class="lobby">
      {errorDisplay}
      {view}
    </div>
  );
};
