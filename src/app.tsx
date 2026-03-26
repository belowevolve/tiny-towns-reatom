import { computed } from "@reatom/core";

import { rootRoute } from "./routes";
import { globalStyleText } from "./shared/ui/design-system";

const GlobalStyles = () => <style>{globalStyleText}</style>;

export const App = computed(
  () => (
    <>
      <GlobalStyles />
      {rootRoute.render()}
    </>
  ),
  "app.root"
);
