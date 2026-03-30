import { css } from "@reatom/jsx";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

import type { Resource } from "../../model/types";
import { RESOURCES, RESOURCE_COLORS } from "../../model/types";

const resourceVariants = Object.fromEntries(
  RESOURCES.map((resource) => [
    resource,
    css`
      background: ${RESOURCE_COLORS[resource]};
    `,
  ])
) as Record<Resource, string>;

const resourceSwatchCss = cva({
  base: css`
    display: block;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    flex-shrink: 0;
  `,
  variants: {
    resource: resourceVariants,
    size: {
      sm: css`
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
  size,
}: VariantProps<typeof resourceSwatchCss>) => {
  return <span css={resourceSwatchCss({ resource, size })} />;
};
