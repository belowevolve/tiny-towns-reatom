import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

import { colors, radius, shadow } from "./design-system";

const buttonCss = cva({
  base: css`
    border-radius: ${radius.sm};
    color: ${colors.text.base};
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  variants: {
    size: {
      icon: css`
        font-size: 1rem;
        width: 2rem;
        height: 2rem;
      `,
      "icon-sm": css`
        font-size: 0.75rem;
        width: 1.5rem;
        height: 1.5rem;
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
}: ButtonProps) => {
  return (
    <button
      css={`
        ${buttonCss({ size, variant })}${cssProp}
      `}
      {...props}
    />
  );
};
