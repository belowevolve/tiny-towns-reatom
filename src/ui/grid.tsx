import type { PlayerUIState } from "../model/player-ui";
import { Cell } from "./cell";

export const Grid = ({ ui }: { ui: PlayerUIState }) => (
  <div class="grid-wrapper">
    {ui.cellVMs.map((vm, index) => (
      <Cell vm={vm} index={index} />
    ))}
  </div>
);
