import { resetGame, score } from "./model/game";
import { BuildPanel } from "./ui/build-panel";
import { Grid } from "./ui/grid";
import { ResourcePanel } from "./ui/resource-panel";

export const App = () => (
  <div
    css={`
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 24px;
      min-height: 100vh;
    `}
  >
    <header
      css={`
        display: flex;
        align-items: center;
        gap: 16px;

        h1 {
          margin: 0;
          font-size: 1.8rem;
          letter-spacing: 0.02em;
        }

        .score {
          font-size: 1rem;
          color: #aaa;
          background: #2a2a2a;
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid #3a3a3a;
        }
      `}
    >
      <h1>🏘️ Tiny Towns</h1>
      <span class="score">Построек: {score}</span>
      <button
        on:click={() => resetGame()}
        css={`
          padding: 6px 14px;
          border-radius: 6px;
          background: #3a2020;
          border: 1px solid #6a3030;
          color: #ddd;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.15s ease;

          &:hover {
            background: #4a2a2a;
            border-color: #8a4040;
          }
        `}
      >
        Сбросить
      </button>
    </header>

    <main
      css={`
        display: flex;
        gap: 32px;
        align-items: flex-start;
      `}
    >
      <ResourcePanel />
      <Grid />
      <BuildPanel />
    </main>
  </div>
);
