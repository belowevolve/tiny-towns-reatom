import { rootRoute } from "@/shared/lib/router";
import { globalStyleText } from "@/shared/ui/design-system";
import { Toaster } from "@/shared/ui/toast";

import "./routes";

const GlobalStyles = () => {
  return <style>{globalStyleText}</style>;
};

export const App = () => {
  return (
    <>
      <GlobalStyles />
      {rootRoute.render}
      <Toaster />
    </>
  );
};
