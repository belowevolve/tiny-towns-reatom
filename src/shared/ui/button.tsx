import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

import { colors, radius, shadow } from "./design-system";

const buttonCss = cva({
  base: css`
    border-radius: ${radius.sm};
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    color: ${colors.text.base};
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.15s ease;
    font-family: inherit;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  variants: {
    size: {
      icon: css`
        width: 36px;
        height: 36px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      `,
      "icon-sm": css`
        width: 24px;
        height: 24px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      `,
      md: css`
        padding: 8px 18px;
      `,
    },
    variant: {
      action: css`
        background: ${colors.accent};
        border: none;
        color: oklch(1 0 0);
        box-shadow: ${shadow.cell};

        &:hover {
          background: ${colors.accentHover};
          box-shadow: ${shadow.card};
        }
      `,
      danger: css`
        background: ${colors.danger};
        border: none;
        color: oklch(1 0 0);
        box-shadow: ${shadow.cell};

        &:hover {
          background: ${colors.dangerHover};
        }
      `,
      secondary: css`
        background: ${colors.surface};
        border: 1px solid ${colors.border};
        color: ${colors.text.base};

        &:hover {
          background: ${colors.surfaceHover};
          border-color: ${colors.borderHover};
        }
      `,
    },
  },
});

type ButtonProps = JSX.IntrinsicElements["button"] &
  VariantProps<typeof buttonCss>;

export const Button = ({
  css: cssProp,
  size = "md",
  variant = "action",
  ...props
}: ButtonProps) => (
  <button
    css={`
      ${buttonCss({ size, variant })}${cssProp}
    `}
    {...props}
  />
);
