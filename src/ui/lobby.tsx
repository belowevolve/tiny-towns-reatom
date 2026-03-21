import { atom, computed } from "@reatom/core";

import { game } from "../model/game";
import {
  connectionStatus,
  createRoom,
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

const lobbyView = atom<"menu" | "create" | "join">("menu", "lobby.view");

const PlayerListItem = ({
  name,
  peerId,
  ready,
  isSelf,
}: {
  name: string;
  peerId: string;
  ready: boolean;
  isSelf: boolean;
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
  }, "lobby.canStart");

  const handleStart = () => {
    startMultiplayerGame();
  };

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
              name={p.name}
              peerId={p.peerId}
              ready={p.ready}
              isSelf={p.peerId === selfId}
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
              on:click={handleStart}
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
            game.phase.set("lobby");
          }}
        >
          Покинуть
        </button>
      </div>
    </div>
  );
};

const MenuView = () => {
  const nameValue = atom("", "lobby.nameInput");

  const handleNameInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    nameValue.set(val);
    playerName.set(val);
  };

  return (
    <div class="lobby-menu">
      <h1 class="lobby-title">Tiny Towns</h1>
      <p class="lobby-subtitle">Мультиплеер</p>

      <div class="lobby-form">
        <label class="lobby-label">
          Ваше имя
          <input
            class="lobby-input"
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            on:input={handleNameInput}
          />
        </label>
      </div>

      <div class="lobby-menu-buttons">
        <button
          class="btn-action lobby-btn-large"
          on:click={() => {
            if (!nameValue()) {
              return;
            }
            lobbyView.set("create");
            createRoom();
          }}
        >
          Создать комнату
        </button>
        <button
          class="btn-secondary lobby-btn-large"
          on:click={() => {
            if (!nameValue()) {
              return;
            }
            lobbyView.set("join");
          }}
        >
          Присоединиться
        </button>
        <button
          class="btn-secondary lobby-btn-large"
          on:click={() => lobbyView.set("menu")}
        >
          Назад
        </button>
      </div>
    </div>
  );
};

const JoinView = () => {
  const codeInput = atom("", "lobby.codeInput");

  const handleCodeInput = (e: Event) => {
    codeInput.set((e.target as HTMLInputElement).value.toUpperCase());
  };

  const handleJoin = () => {
    const code = codeInput();
    if (code.length >= 4) {
      joinRoom(code);
    }
  };

  return (
    <div class="lobby-join">
      <h2 class="lobby-join__title">Введите код комнаты</h2>
      <input
        class="lobby-input lobby-code-input"
        type="text"
        maxlength={4}
        placeholder="ABCD"
        on:input={handleCodeInput}
      />
      <div class="lobby-actions">
        <button class="btn-action" on:click={handleJoin}>
          Войти
        </button>
        <button class="btn-secondary" on:click={() => lobbyView.set("menu")}>
          Назад
        </button>
      </div>
    </div>
  );
};

export const Lobby = () => {
  const errorDisplay = computed(() => {
    const err = lobbyError();
    if (!err) {
      return "";
    }
    return <div class="lobby-error">{err}</div>;
  }, "lobby.errorDisplay");

  const view = computed(() => {
    const roomCode = currentRoomCode();
    if (roomCode) {
      return <RoomView />;
    }

    const v = lobbyView();
    if (v === "join") {
      return <JoinView />;
    }

    return <MenuView />;
  }, "lobby.view");

  return (
    <div class="lobby">
      {errorDisplay}
      {view}
    </div>
  );
};
