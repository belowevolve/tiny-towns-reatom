import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { palette, radius, shadow } from "./design-system";
import { createCssVariants } from "./style-variants";

type ButtonVariant = "action" | "secondary";
type ButtonSize = "md" | "icon";

type ButtonProps = JSX.IntrinsicElements["button"] & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const getButtonCss = createCssVariants({
  base: css`
    border-radius: ${radius.sm};
    background: ${palette.surface};
    border: 1px solid ${palette.border};
    color: ${palette.text};
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
      md: css`
        padding: 8px 18px;
      `,
    },
    variant: {
      action: css`
        background: ${palette.accent};
        border: none;
        color: oklch(1 0 0);
        box-shadow: ${shadow.cell};

        &:hover {
          background: ${palette.accentHover};
          box-shadow: ${shadow.card};
        }
      `,
      secondary: css`
        background: ${palette.surface};
        border: 1px solid ${palette.border};
        color: ${palette.text};

        &:hover {
          background: ${palette.surfaceHover};
          border-color: ${palette.borderHover};
        }
      `,
    },
  },
});

export const Button = ({
  css: cssProp,
  size = "md",
  variant = "action",
  ...props
}: ButtonProps) => (
  <button
    css={`
      ${getButtonCss({ size, variant })}${cssProp}
    `}
    {...props}
  />
);

type IconButtonProps = Omit<ButtonProps, "size">;

export const IconButton = ({ css: cssProp, ...props }: IconButtonProps) => (
  <Button size="icon" css={cssProp} {...props} />
);
