import { atom, computed } from "@reatom/core";

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
import { homeRoute, roomRoute } from "../routes";

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

const JoinView = () => {
  const codeInput = atom("", "lobby.codeInput");

  const handleCodeInput = (e: Event) => {
    codeInput.set((e.target as HTMLInputElement).value.toUpperCase());
  };

  const handleJoin = () => {
    const code = codeInput();
    if (code.length >= 4) {
      joinRoom(code);
      roomRoute.go({ code: code.toUpperCase() });
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
        <button class="btn-secondary" on:click={() => homeRoute.go()}>
          Назад
        </button>
      </div>
    </div>
  );
};

const NamePrompt = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const nameValue = atom("", "lobby.namePrompt");

  const handleInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    nameValue.set(val);
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

const MenuView = () => {
  const nameValue = atom("", "lobby.nameInput");
  const showJoin = atom(false, "lobby.showJoin");

  const handleNameInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    nameValue.set(val);
    playerName.set(val);
  };

  const view = computed(() => {
    if (showJoin()) {
      return <JoinView />;
    }

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
              createRoom();
              const code = currentRoomCode();
              if (code) {
                roomRoute.go({ code });
              }
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
              showJoin.set(true);
            }}
          >
            Присоединиться
          </button>
        </div>
      </div>
    );
  }, "lobby.menuView");

  return <>{view}</>;
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
    const routeParams = roomRoute();

    if (routeParams) {
      const { code } = routeParams;
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
