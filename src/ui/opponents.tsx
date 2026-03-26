import { computed } from "@reatom/core";

import { BUILDINGS } from "../model/buildings";
import { opponents, reatomOpponentVM } from "../model/game-ui";
import type { PlayerState } from "../model/player";
import { palette, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";

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
      return <ResourceSwatch resource={c.resource} small />;
    }
    return BUILDINGS[c.building].icon;
  }, `opp.${player.id}.cell#${index}`);

  const bg = computed(() => {
    const c = player.cells[index]();
    if (c?.type === "resource") {
      return palette.cellResource;
    }
    if (c) {
      return palette.building;
    }
    return palette.cellBg;
  }, `opp.${player.id}.cell#${index}.bg`);

  const border = computed(() => {
    const c = player.cells[index]();
    if (c?.type === "resource") {
      return palette.borderHover;
    }
    if (c) {
      return palette.buildingBorder;
    }
    return palette.border;
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
        border: 1px solid ${palette.border};

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
    <div
      css={`
        flex-shrink: 0;
        padding: 5px 6px;
        background: ${palette.surface};
        border: 1px solid ${palette.border};
        border-radius: ${radius.sm};
        display: flex;
        flex-direction: column;
        gap: 3px;
        box-shadow: ${shadow.cell};

        &[data-eliminated="true"] {
          opacity: 0.45;
        }

        &[data-master-builder="true"] {
          border-color: ${palette.highlight};
          box-shadow: 0 0 6px ${palette.highlightGlow};
        }
      `}
      attr:data-eliminated={vm.isEliminated}
      attr:data-master-builder={vm.isMasterBuilder}
    >
      <div
        css={`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        `}
      >
        <span
          css={`
            font-size: 0.6rem;
            font-weight: 600;
            color: ${palette.text};
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
        </span>
        <span
          css={`
            font-size: 0.65rem;
            font-weight: 700;
            color: ${palette.accent};
          `}
        >
          {player.score}
        </span>
      </div>
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
      <div
        css={`
          font-size: 0.5rem;
          color: ${palette.textMuted};
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
      </div>
    </div>
  );
};

export const Opponents = () => (
  <div
    css={`
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        height: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: ${palette.borderHover};
        border-radius: 2px;
      }
    `}
  >
    {computed(() => opponents().map((p) => <OpponentBadge player={p} />))}
  </div>
);
