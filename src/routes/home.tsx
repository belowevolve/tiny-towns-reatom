import { atom, computed } from "@reatom/core";

import {
  createRoom,
  currentRoomCode,
  lobbyError,
  playerName,
} from "../model/lobby";
import { homeRoute, roomRoute } from "../routes";

const JoinView = () => {
  const codeInput = atom("", "home.codeInput");

  const handleCodeInput = (e: Event) => {
    codeInput.set((e.target as HTMLInputElement).value.toUpperCase());
  };

  const handleJoin = () => {
    const code = codeInput();
    if (code.length >= 4) {
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

const MenuView = () => {
  const nameValue = atom("", "home.nameInput");
  const showJoin = atom(false, "home.showJoin");

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
  }, "home.menuView");

  return view();
};

export const HomePage = () => {
  const errorDisplay = computed(() => {
    const err = lobbyError();
    if (!err) {
      return "";
    }
    return <div class="lobby-error">{err}</div>;
  }, "home.errorDisplay");

  return (
    <div class="lobby">
      {errorDisplay}
      <MenuView />
    </div>
  );
};
