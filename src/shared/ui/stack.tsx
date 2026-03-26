import type { JSX } from "@reatom/jsx/jsx-runtime";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

const stackCss = cva({
  variants: {
    align: {
      baseline: "align-items: baseline;",
      center: "align-items: center;",
      end: "align-items: flex-end;",
      start: "align-items: flex-start;",
      stretch: "align-items: stretch;",
    },
    direction: {
      col: "display: flex; flex-direction: column;",
      row: "display: flex; flex-direction: row;",
    },
    justify: {
      between: "justify-content: space-between;",
      center: "justify-content: center;",
      end: "justify-content: flex-end;",
      start: "justify-content: flex-start;",
    },
    wrap: {
      true: "flex-wrap: wrap;",
    },
  },
});

type StackProps = JSX.IntrinsicElements["div"] &
  VariantProps<typeof stackCss> & {
    gap?: number | string;
  };

export const Stack = ({
  direction = "col",
  align,
  justify,
  wrap,
  gap,
  css: cssProp,
  ...props
}: StackProps) => (
  <div
    {...props}
    css={`
      ${stackCss({ align, direction, justify, wrap })}
      ${cssProp}
    `}
    style:gap={typeof gap === "number" ? `${gap}px` : gap}
  />
);
