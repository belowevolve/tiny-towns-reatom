import { retryComputed } from "@reatom/core";

import { rootRoute } from "@/shared/lib/router";

import { RoomPage } from "./ui/room";

export const roomRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    path: "room/:code",
    render(self) {
      return <RoomPage code={self().code} />;
    },
  },
  "roomRoute"
);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    delete rootRoute.routes[roomRoute.name];
    retryComputed(rootRoute.outlet);
  });
}
