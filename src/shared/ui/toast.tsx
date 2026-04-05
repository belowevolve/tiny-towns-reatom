import { atom, withActions } from "@reatom/core";
import type { JSX } from "@reatom/jsx";

import { colors, radius, rem, shadow } from "@/shared/ui/design-system";
import { flex } from "@/shared/ui/flex";

export interface Toast {
  id: string;
  content: string | JSX.Element;
  type: "success" | "error" | "info" | "custom";
}

const toasts = atom<JSX.Element[]>([], "toasts").extend(
  withActions((target) => ({
    remove: (id: string) => {
      target.set((state) => state.filter((el) => el.id !== id));
    },
    unshift: (el: JSX.Element) => {
      target.set((state) => [el, ...state]);
    },
  }))
);

const ToastItem = (item: Toast) => {
  return (
    <div
      id={item.id}
      role="status"
      aria-live="polite"
      on:click={() => toasts.remove(item.id)}
      css={`
        ${flex({ direction: "row", gap: 1 })}
        background: ${colors.surface};
        padding: ${rem(2)};
        border-radius: ${radius.sm};
        outline: 1px solid ${colors.border};
        box-shadow: ${shadow.card};
        margin-bottom: ${rem(1)};
        cursor: pointer;
        pointer-events: auto;
        user-select: none;

        animation: toastEnter 1s cubic-bezier(0.1, 1, 0.1, 1) forwards;
        transition:
          transform 0.2s ease,
          opacity 0.2s ease;
      `}
    >
      <div
        css={`
          width: ${rem(2)};
          height: ${rem(2)};
          margin-top: ${rem(1)};
          border-radius: 50%;
          background: ${colors[item.type]};
          flex-shrink: 0;
        `}
      />
      {item.content}
    </div>
  );
};

export const toast = (
  content: Toast["content"],
  type: Toast["type"] = "info",
  duration = 3000
) => {
  const id = crypto.randomUUID();
  const element = ToastItem({ content, id, type });

  toasts.unshift(element);

  if (duration > 0) {
    setTimeout(() => {
      toasts.remove(id);
    }, duration);
  }
};

export const Toaster = () => {
  return (
    <div
      id="toaster"
      role="log"
      aria-relevant="additions"
      css={`
        ${flex({ direction: "column" })}
        position: fixed;
        top: ${rem(2)};
        right: ${rem(2)};
        z-index: 10000;
        width: 300px;
      `}
    >
      {toasts}
    </div>
  );
};
