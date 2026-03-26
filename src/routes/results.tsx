import { computed, peek } from "@reatom/core";

import { game, localPlayerId } from "../model/game";
import { sortedScores } from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { homeRoute } from "../routes";
import { Button } from "../shared/ui/button";
import { colors, radius } from "../shared/ui/design-system";
import { Stack } from "../shared/ui/stack";
import { Text } from "../shared/ui/text";

export const ResultsPage = () => {
  const list = computed(
    () =>
      sortedScores().map((s, i) => (
        <Stack
          direction="row"
          align="center"
          gap="10px"
          css={`
            padding: 12px 16px;
            background: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: ${radius.sm};

            &[data-winner="true"] {
              border-color: ${colors.highlight};
              background: ${colors.highlightSoft};
            }

            &[data-self="true"] {
              border-color: ${colors.accent};
            }
          `}
          attr:data-self={s.id === peek(localPlayerId)}
          attr:data-winner={i === 0}
        >
          <Text w="bold" c="muted" css="min-width: 24px;">
            {i + 1}.
          </Text>
          <Text w="medium" css="flex: 1;">
            {s.name}
          </Text>
          <Text size="lg" c="accent" w="bold">
            {s.score} VP
          </Text>
        </Stack>
      )),
    "results.list"
  );

  return (
    <Stack
      align="center"
      justify="center"
      css={`
        min-height: 100vh;
        padding: 24px;
      `}
    >
      <Stack align="center" justify="center" gap="24px">
        <Text as="h2" size="xl" w="extrabold">
          Игра окончена!
        </Text>
        <Stack
          gap="6px"
          css={`
            width: 100%;
            max-width: 360px;
          `}
        >
          {list}
        </Stack>
      </Stack>
      <Button
        on:click={() => {
          localPlayerUI()?.reset();
          game.resetGame();
          homeRoute.go();
        }}
      >
        Новая игра
      </Button>
    </Stack>
  );
};
