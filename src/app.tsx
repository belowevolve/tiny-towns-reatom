import { computed } from "@reatom/core";

import { gameRoute, homeRoute, resultsRoute, roomRoute } from "./routes";
import { GamePage } from "./routes/game";
import { HomePage } from "./routes/home";
import { ResultsPage } from "./routes/results";
import { RoomPage } from "./routes/room";

export const App = computed(
  () => (
    <>
      {homeRoute.exact() && <HomePage />}
      {roomRoute.exact() && <RoomPage />}
      {gameRoute.exact() && <GamePage />}
      {resultsRoute.exact() && <ResultsPage />}
    </>
  ),
  "app.root"
);
