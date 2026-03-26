import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import { opponents, reatomOpponentVM } from "../model/game-ui";
import type { PlayerState } from "../model/player";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { Stack } from "../shared/ui/stack";
import { Text } from "../shared/ui/text";

const MiniCell = ({
  player,
  index,
}: {
  player: PlayerState;
  index: number;
}) => {
  const content = computed(() => {
    const c = player.cells[index]();
    if (!c) {
      return "";
    }
    if (c.type === "resource") {
      return <ResourceSwatch resource={c.resource} size="sm" />;
    }
    return BUILDINGS[c.building].icon;
  }, `opp.${player.id}.cell#${index}`);

  const bg = computed(() => {
    const c = player.cells[index]();
    if (c?.type === "resource") {
      return colors.cellResource;
    }
    if (c) {
      return colors.building;
    }
    return colors.cellBg;
  }, `opp.${player.id}.cell#${index}.bg`);

  const border = computed(() => {
    const c = player.cells[index]();
    if (c?.type === "resource") {
      return colors.borderHover;
    }
    if (c) {
      return colors.buildingBorder;
    }
    return colors.border;
  }, `opp.${player.id}.cell#${index}.border`);

  return (
    <div
      css={`
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.45rem;
        border-radius: 2px;
        border: 1px solid ${colors.border};

        @media (max-width: 400px) {
          width: 14px;
          height: 14px;
          font-size: 0.4rem;
        }
      `}
      style:background={bg}
      style:border-color={border}
    >
      {content}
    </div>
  );
};

const OpponentBadge = ({ player }: { player: PlayerState }) => {
  const vm = reatomOpponentVM(player);

  return (
    <Stack
      gap="3px"
      css={`
        flex-shrink: 0;
        padding: 5px 6px;
        background: ${colors.surface};
        border: 1px solid ${colors.border};
        border-radius: ${radius.sm};
        box-shadow: ${shadow.cell};

        &[data-eliminated="true"] {
          opacity: 0.45;
        }

        &[data-master-builder="true"] {
          border-color: ${colors.highlight};
          box-shadow: 0 0 6px ${colors.highlightGlow};
        }
      `}
      attr:data-eliminated={vm.isEliminated}
      attr:data-master-builder={vm.isMasterBuilder}
    >
      <Stack direction="row" align="center" justify="between" gap="4px">
        <Text
          size="xs"
          w="semibold"
          css={`
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 60px;

            @media (max-width: 400px) {
              max-width: 48px;
            }
          `}
        >
          {computed(() => (vm.isMasterBuilder() ? "🔨 " : ""))}
          {player.name}
        </Text>
        <Text size="xs" w="bold" c="accent">
          {player.score}
        </Text>
      </Stack>
      <div
        css={`
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
        `}
      >
        {player.cells.map((_, i) => (
          <MiniCell player={player} index={i} />
        ))}
      </div>
      <Text
        size="xs"
        c="muted"
        css={`
          text-align: center;
          min-height: 0.6em;
        `}
      >
        {computed(() => {
          if (vm.isEliminated()) {
            return "Выбыл";
          }
          if (vm.readiness()) {
            return "✓";
          }
          return "";
        })}
      </Text>
    </Stack>
  );
};

export const Opponents = () => (
  <Stack
    direction="row"
    justify="end"
    gap="6px"
    css={`
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        height: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: ${colors.borderHover};
        border-radius: 2px;
      }
    `}
  >
    {computed(() => opponents().map((p) => <OpponentBadge player={p} />))}
  </Stack>
);
