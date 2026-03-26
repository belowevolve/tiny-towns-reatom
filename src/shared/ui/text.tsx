import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

import { colors } from "./design-system";

const textCss = cva({
  variants: {
    c: {
      accent: css`
        color: ${colors.text.accent};
      `,
      base: css`
        color: ${colors.text.base};
      `,
      danger: css`
        color: ${colors.danger};
      `,
      muted: css`
        color: ${colors.text.muted};
      `,
    },
    lh: {
      none: css`
        line-height: 1;
      `,
      normal: css`
        line-height: 1.4;
      `,
      snug: css`
        line-height: 1.3;
      `,
      tight: css`
        line-height: 1.2;
      `,
    },
    size: {
      lg: css`
        font-size: 1.1rem;
        line-height: 1.35;
      `,
      md: css`
        font-size: 1rem;
        line-height: 1.4;
      `,
      sm: css`
        font-size: 0.8rem;
        line-height: 1.3;
      `,
      xl: css`
        font-size: 2rem;
        line-height: 1.2;
      `,
      xs: css`
        font-size: 0.65rem;
        line-height: 1.2;
      `,
    },
    w: {
      bold: css`
        font-weight: 700;
      `,
      extrabold: css`
        font-weight: 800;
      `,
      medium: css`
        font-weight: 500;
      `,
      normal: css`
        font-weight: 400;
      `,
      semibold: css`
        font-weight: 600;
      `,
    },
  },
});

type TextTag =
  | "span"
  | "div"
  | "p"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "strong"
  | "em";

type TextProps = JSX.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textCss> & {
    as?: TextTag;
  };

export const Text = ({
  as,
  size = "md",
  c = "base",
  w = "normal",
  lh,
  css: cssProp,
  ...props
}: TextProps) => {
  const Component = as ?? "span";
  return (
    <Component
      css={`
        ${textCss({ c, lh, size, w })} ${cssProp}
      `}
      {...props}
    />
  );
};
