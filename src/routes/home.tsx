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
import { Input } from "../shared/ui/input";
import { Stack } from "../shared/ui/stack";
import { Text } from "../shared/ui/text";

const Join = ({ disabled }: { disabled: Computed<boolean> }) => {
  const codeInput = atom("", "home.codeInput");

  return (
    <Stack
      gap="12px"
      css={`
        width: 100%;
        max-width: 300px;
      `}
    >
      <Input
        variant="code"
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
    </Stack>
  );
};

const MenuView = () => {
  const disabled = computed(() => !playerName(), "home.disabled");

  return (
    <Stack align="center" gap="24px">
      <Text size="xl" w="extrabold">
        Tiny Towns
      </Text>
      <Stack
        css={`
          width: 100%;
          max-width: 300px;
        `}
        gap="12px"
      >
        <Text
          as="label"
          size="sm"
          c="muted"
          css={`
            display: flex;
            flex-direction: column;
            gap: 6px;
          `}
        >
          Ваше имя
          <Input
            type="text"
            maxlength={20}
            placeholder="Введите имя…"
            model:value={playerName}
          />
        </Text>
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
      </Stack>
      <Join disabled={disabled} />
    </Stack>
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
