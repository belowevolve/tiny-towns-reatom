import type { JSX } from "@reatom/jsx/jsx-runtime";

import { rem } from "./design-system";

interface FlexProps {
  gap?: number;
  direction?: JSX.CSSProperties["flex-direction"];
  align?:
    | "start"
    | "center"
    | "end"
    | "baseline"
    | "stretch"
    | "flex-start"
    | "flex-end";
  justify?:
    | "start"
    | "center"
    | "end"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "flex-start"
    | "stretch"
    | "flex-end";
  wrap?: JSX.CSSProperties["flex-wrap"];
}

export const flex = ({
  direction = "column",
  align,
  justify,
  wrap,
  gap,
}: FlexProps = {}) => `
  display: flex;
  flex-direction: ${direction};
  align-items: ${align};
  justify-content: ${justify};
  flex-wrap: ${wrap};
  ${gap && `gap: ${rem(gap)};`};
`;
