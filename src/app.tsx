import { rootRoute } from "@/shared/lib/router";
import { globalStyleText } from "@/shared/ui/design-system";

import "./routes";

const GlobalStyles = () => <style>{globalStyleText}</style>;

export const App = () => (
  <>
    <GlobalStyles />
    {rootRoute.render}
  </>
);
