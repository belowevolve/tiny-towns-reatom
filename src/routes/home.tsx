import { atom, computed } from "@reatom/core";
import type { Computed } from "@reatom/core";

import {
  createRoom,
  currentRoomCode,
  joinRoom,
  playerName,
} from "../model/lobby";
import { roomRoute } from "../routes";
import { Button } from "../shared/ui/button";
import { palette } from "../shared/ui/design-system";
import { TextInput } from "../shared/ui/input";

const Join = ({ disabled }: { disabled: Computed<boolean> }) => {
  const codeInput = atom("", "home.codeInput");

  return (
    <div
      css={`
        width: 100%;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <TextInput
        code
        type="text"
        maxlength={4}
        placeholder="ABCD"
        model:value={codeInput}
      />
      <Button
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
      </Button>
    </div>
  );
};

const MenuView = () => {
  const disabled = computed(() => !playerName(), "home.disabled");

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
            model:value={playerName}
          />
        </label>
        <Button
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
        </Button>
      </div>
      <Join disabled={disabled} />
    </div>
  );
};

export const HomePage = () => (
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
    <MenuView />
  </div>
);
