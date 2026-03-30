import { atom, computed, urlAtom } from "@reatom/core";
import type { Computed } from "@reatom/core";

import {
  createRoom,
  currentRoomCode,
  joinRoom,
  playerName,
} from "@/model/lobby";
import { ROOM_CODE_LENGTH } from "@/model/multiplayer/transport";
import { Button } from "@/shared/ui/button";
import { flex } from "@/shared/ui/flex";
import { Input } from "@/shared/ui/input";
import { text } from "@/shared/ui/text";

const Join = ({ disabled }: { disabled: Computed<boolean> }) => {
  const codeInput = atom("", "home.codeInput");

  return (
    <form
      css={`
        ${flex({ gap: 1 })}
      `}
      on:submit={(e) => {
        e.preventDefault();
        joinRoom(codeInput());
        const code = currentRoomCode();
        if (code) {
          urlAtom.go(`/room/${code}`);
        }
      }}
    >
      <Input
        variant="code"
        type="text"
        maxlength={4}
        placeholder="abcd"
        model:value={codeInput}
      />
      <Button
        disabled={() => disabled() || codeInput().length !== ROOM_CODE_LENGTH}
      >
        Войти
      </Button>
    </form>
  );
};

const MenuView = () => {
  const disabled = computed(() => !playerName(), "home.disabled");

  return (
    <div css={flex({ align: "stretch", gap: 5, justify: "stretch" })}>
      <span css={text({ fw: "bold", size: "xl", ta: "center" })}>
        Tiny Towns
      </span>
      <form
        css={`
          ${flex({ gap: 1 })}
        `}
        on:submit={(e) => {
          e.preventDefault();
          createRoom();
          const code = currentRoomCode();
          if (code) {
            urlAtom.go(`/room/${code}`);
          }
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
            model:value={playerName}
          />
        </label>
        <Button disabled={disabled}>Создать комнату</Button>
      </form>
      <Join disabled={disabled} />
    </div>
  );
};

export const HomePage = () => {
  return (
    <div
      css={`
        ${flex({ align: "center", direction: "column", justify: "center" })}
      `}
    >
      <MenuView />
    </div>
  );
};
