import { atom, computed } from "@reatom/core";
import type { Computed } from "@reatom/core";

import {
  createRoom,
  currentRoomCode,
  joinRoom,
  playerName,
} from "../model/lobby";
import { roomRoute } from "../routes";

const Join = ({ disabled }: { disabled: Computed<boolean> }) => {
  const codeInput = atom("", "home.codeInput");

  return (
    <div class="lobby-form">
      <input
        class="lobby-input lobby-code-input"
        type="text"
        maxlength={4}
        placeholder="ABCD"
        model:value={codeInput}
      />
      <button
        class="btn-action"
        disabled={disabled}
        on:click={() => {
          joinRoom(codeInput());
          const code = currentRoomCode();
          if (code) {
            roomRoute.go({ code });
          }
        }}
      >
        Войти
      </button>
    </div>
  );
};

const MenuView = () => {
  const disabled = computed(() => !playerName(), "home.disabled");

  return (
    <div class="lobby-menu">
      <h1 class="lobby-title">Tiny Towns</h1>
      <div class="lobby-form">
        <label class="lobby-label">
          Ваше имя
          <input
            class="lobby-input"
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            model:value={playerName}
          />
        </label>
        <button
          class="btn-action"
          disabled={disabled}
          on:click={() => {
            createRoom();
            const code = currentRoomCode();
            if (code) {
              roomRoute.go({ code });
            }
          }}
        >
          Создать комнату
        </button>
      </div>
      <Join disabled={disabled} />
    </div>
  );
};

export const HomePage = () => (
  <div class="lobby">
    <MenuView />
  </div>
);
