import { rootRoute } from "@/shared/lib/router";
import { globalStyleText } from "@/shared/ui/design-system";

import "./routes";

const GlobalStyles = () => {
  return <style>{globalStyleText}</style>;
};

export const App = () => {
  return (
    <>
      <GlobalStyles />
      {rootRoute.render}
    </>
  );
};
