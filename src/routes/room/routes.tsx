import { rootRoute } from "@/shared/lib/router";

import { RoomPage } from "./ui/room";

export const roomRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    path: "room/:code",
    render() {
      return <RoomPage />;
    },
  },
  "roomRoute"
);
