import { reatomRoute } from "@reatom/core";

export const rootRoute = reatomRoute(
  {
    render({ outlet }) {
      return outlet();
    },
  },
  "rootRoute"
);
