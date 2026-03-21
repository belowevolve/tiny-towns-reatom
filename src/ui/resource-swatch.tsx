import type { Resource } from "../model/types";
import { RESOURCE_COLORS } from "../model/types";

export const ResourceSwatch = ({
  resource,
  small,
}: {
  resource: Resource;
  small?: boolean;
}) => (
  <span
    class={["resource-swatch", { "resource-swatch--sm": small }]}
    attr:style={`background: ${RESOURCE_COLORS[resource]}`}
  />
);
