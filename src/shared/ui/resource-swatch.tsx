import { css } from "@reatom/jsx";

import type { Resource } from "../../model/types";
import { RESOURCE_COLORS } from "../../model/types";
import { createCssVariants } from "./style-variants";

const getSwatchCss = createCssVariants({
  base: css`
    display: block;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    flex-shrink: 0;
  `,
  variants: {
    small: {
      false: "",
      true: css`
        width: 16px;
        height: 16px;
        border-radius: 3px;
        display: inline-block;
        vertical-align: middle;
      `,
    },
  },
});

export const ResourceSwatch = ({
  resource,
  small,
}: {
  resource: Resource;
  small?: boolean;
}) => (
  <span
    css={getSwatchCss({ small: small ? "true" : "false" })}
    style:background={RESOURCE_COLORS[resource]}
  />
);
