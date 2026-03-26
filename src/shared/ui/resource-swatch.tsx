import { css } from "@reatom/jsx";

import type { Resource } from "../../model/types";
import { RESOURCE_COLORS } from "../../model/types";

const baseSwatch = css`
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
`;

const smallSwatch = css`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  display: inline-block;
  vertical-align: middle;
`;

export const ResourceSwatch = ({
  resource,
  small,
}: {
  resource: Resource;
  small?: boolean;
}) => (
  <span
    css={css`
      ${baseSwatch}${small ? smallSwatch : ""}
    `}
    style:background={RESOURCE_COLORS[resource]}
  />
);
