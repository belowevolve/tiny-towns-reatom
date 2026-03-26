import { css } from "@reatom/jsx";

import type { PlayerUIState } from "../model/player-ui";
import { palette, radius, shadow } from "../shared/ui/design-system";
import { Cell } from "./cell";

const gridCss = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 6px;
  padding: 10px;
  background: ${palette.surface};
  border-radius: ${radius.lg};
  border: 1px solid ${palette.border};
  box-shadow: ${shadow.elevated};
  width: 100%;
  aspect-ratio: 1;
`;

export const Grid = ({ ui }: { ui: PlayerUIState }) => (
  <div css={gridCss}>
    {ui.cellVMs.map((vm, index) => (
      <Cell vm={vm} index={index} />
    ))}
  </div>
);
