import { cells } from "../model/game";
import { GRID_SIZE } from "../model/types";
import { Cell } from "./cell";

export const Grid = () => (
  <div
    css={`
        display: grid;
        grid-template-columns: repeat(${String(GRID_SIZE)}, 80px);
        grid-template-rows: repeat(${String(GRID_SIZE)}, 80px);
        gap: 6px;
        padding: 12px;
        background: #1a1a1a;
        border-radius: 12px;
        border: 2px solid #333;
      `}
  >
    {cells.map((cellAtom, index) => (
      <Cell cellAtom={cellAtom} index={index} />
    ))}
  </div>
);
