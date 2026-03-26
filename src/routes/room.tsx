import { atom, computed } from "@reatom/core";

import { Stack } from "@/shared/ui/stack";

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
import { colors, radius } from "../shared/ui/design-system";
import { Input } from "../shared/ui/input";
import { Text } from "../shared/ui/text";

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
  <Stack
    direction="row"
    align="center"
    gap="10px"
    css={`
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
    <Text size="md" w="medium" css="flex: 1;">
      {name}
      {isSelf && (
        <Text size="sm" c="muted" w="normal">
          {" "}
          (вы)
        </Text>
      )}
    </Text>
    <Text size="sm" c="muted">
      {ready ? "✓ Готов" : "Ожидание…"}
    </Text>
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
  </Stack>
);

const RoomView = () => {
  const canStart = computed(() => {
    const players = lobbyPlayers();
    return isHost() && players.length >= 2 && players.length <= MAX_PLAYERS;
  }, "room.canStart");

  return (
    <Stack
      align="center"
      gap="20px"
      css={`
        width: 100%;
        max-width: 400px;
      `}
    >
      <Stack align="center" gap="4px">
        <Text size="sm" c="muted" w="semibold">
          Код комнаты
        </Text>
        <Text size="xl" c="accent" w="extrabold">
          {currentRoomCode}
        </Text>
      </Stack>

      <Text size="sm" c="muted">
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
      </Text>

      <div css="width: 100%;">
        <Text as="h3" size="md" c="muted" w="semibold" css="margin: 0 0 10px;">
          Игроки ({computed(() => lobbyPlayers().length)}/{MAX_PLAYERS})
        </Text>
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

      <Stack direction="row" align="center" gap="10px">
        {computed(() =>
          isHost() ? (
            <Button
              disabled={!canStart()}
              on:click={() => startMultiplayerGame()}
            >
              Начать игру
            </Button>
          ) : (
            <Text size="md" c="muted">
              Ожидание хоста…
            </Text>
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
      </Stack>
    </Stack>
  );
};

const NamePrompt = ({ onSubmit }: { onSubmit: (name: string) => void }) => {
  const nameValue = atom("", "room.namePrompt");

  return (
    <Stack
      align="center"
      gap="24px"
      css={`
        width: 100%;
      `}
    >
      <Text as="h1" size="xl" w="extrabold">
        Tiny Towns
      </Text>
      <Text
        as="p"
        size="md"
        c="muted"
        css={`
          margin: 4px 0 24px;
          text-align: center;
        `}
      >
        Введите имя чтобы продолжить
      </Text>
      <Stack
        gap="12px"
        css={`
          width: 100%;
          max-width: 300px;
        `}
      >
        <Text
          as="label"
          size="sm"
          c="muted"
          w="semibold"
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
            model:value={nameValue}
          />
        </Text>
      </Stack>
      <Stack
        gap="12px"
        css={`
          width: 100%;
          max-width: 300px;
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
      </Stack>
    </Stack>
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
          background: ${colors.dangerSoft};
          border: 1px solid ${colors.danger};
          border-radius: ${radius.md};
          margin-bottom: 16px;
          text-align: center;
        `}
      >
        <Text size="sm" c="danger">
          {err}
        </Text>
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
    <Stack
      align="center"
      justify="center"
      css={`
        min-height: 100vh;
        padding: 24px;
      `}
    >
      {errorDisplay}
      {view}
    </Stack>
  );
};
