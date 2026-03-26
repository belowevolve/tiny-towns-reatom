import { computed } from "@reatom/core";

import { actionBarMode } from "../model/game-ui";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { Stack } from "../shared/ui/stack";
import { Text } from "../shared/ui/text";

const barCss = `
  padding: 10px 16px;
  background: ${colors.surface};
  border-top: 1px solid ${colors.border};
  box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
  max-width: 520px;
  margin: 0 auto;
`;

const mutedHintCss = `
  text-align: center;
`;

export const ActionBar = () => {
  const content = computed(() => {
    const mode = actionBarMode();

    if (mode.type === "eliminated") {
      return (
        <Stack align="center" justify="center" gap="12px" css={barCss}>
          <Text size="sm" c="muted" css={mutedHintCss}>
            Вы выбыли из игры
          </Text>
        </Stack>
      );
    }

    if (mode.type === "picker") {
      return (
        <Stack
          direction="col"
          align="center"
          justify="center"
          gap="6px"
          css={`
            padding: 8px 16px 12px;
            background: ${colors.surface};
            border-top: 1px solid ${colors.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          <Text size="xs" c="muted" w="semibold">
            Объявите ресурс
          </Text>
          <div
            css={`
              display: flex;
              gap: 8px;
              justify-content: center;
            `}
          >
            {RESOURCES.map((r) => (
              <Button
                size="icon"
                variant="secondary"
                css={`
                  border: 2px solid ${colors.border};
                  border-radius: ${radius.sm};
                  transition: all 0.15s ease;

                  &:hover {
                    border-color: ${colors.accent};
                    box-shadow: ${shadow.card};
                    transform: translateY(-2px);
                  }

                  &:disabled {
                    opacity: 0.35;
                    pointer-events: none;
                  }
                `}
                disabled={mode.restricted.has(r)}
                on:click={() => announceResource(r)}
                title={RESOURCE_NAMES[r]}
              >
                <ResourceSwatch resource={r} size="sm" />
              </Button>
            ))}
          </div>
        </Stack>
      );
    }

    if (mode.type === "waiting") {
      return (
        <Stack align="center" justify="center" gap="12px" css={barCss}>
          <Text size="sm" c="muted" css={mutedHintCss}>
            🔨 {mode.name} выбирает ресурс…
          </Text>
        </Stack>
      );
    }

    const badge = (
      <Stack
        direction="row"
        align="center"
        gap="6px"
        css={`
          font-size: 0.85rem;
        `}
      >
        <ResourceSwatch resource={mode.resource} size="sm" />
        <Text size="sm">{RESOURCE_NAMES[mode.resource]}</Text>
      </Stack>
    );

    if (mode.type === "place") {
      return (
        <Stack align="center" justify="center" gap="12px" css={barCss}>
          {badge}
          <Text size="sm" c="muted" css={mutedHintCss}>
            Поставьте ресурс на поле
          </Text>
        </Stack>
      );
    }

    if (mode.type === "ready") {
      return (
        <Stack align="center" justify="center" gap="12px" css={barCss}>
          {badge}
          <Text size="sm" c="muted" css={mutedHintCss}>
            Ожидание других игроков…
          </Text>
        </Stack>
      );
    }

    return (
      <Stack align="center" justify="center" gap="12px" css={barCss}>
        {badge}
        <Button
          css="padding: 10px 32px; font-size: 0.95rem; font-weight: 600;"
          on:click={markDone}
        >
          Готово
        </Button>
      </Stack>
    );
  }, "actionBar.content");

  return (
    <div
      css={`
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
      `}
    >
      {content}
    </div>
  );
};
