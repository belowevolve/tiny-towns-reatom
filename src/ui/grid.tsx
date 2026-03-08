import type { PlayerState } from "../model/player";
import { Cell } from "./cell";

export const Grid = ({ player }: { player: PlayerState }) => (
  <div class="grid-wrapper">
    {player.cells.map((cellAtom, index) => (
      <Cell cellAtom={cellAtom} index={index} player={player} />
    ))}
  </div>
);
