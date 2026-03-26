import type { PlayerUIState } from "../model/player-ui";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { Cell } from "./cell";

export const Grid = ({ ui }: { ui: PlayerUIState }) => (
  <div
    css={`
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 6px;
      padding: 10px;
      background: ${colors.surface};
      border-radius: ${radius.lg};
      border: 1px solid ${colors.border};
      box-shadow: ${shadow.elevated};
      width: 100%;
      aspect-ratio: 1;
    `}
  >
    {ui.cellVMs.map((vm, index) => (
      <Cell vm={vm} index={index} />
    ))}
  </div>
);
