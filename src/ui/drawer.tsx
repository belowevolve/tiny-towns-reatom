import type { Atom } from "@reatom/core";
import type { JSX } from "@reatom/jsx";

export const Drawer = ({
  open,
  onClose,
  children,
}: {
  open: Atom<boolean>;
  onClose: () => void;
  children?: JSX.Element;
}) => {
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  const handleTouchStart = (e: TouchEvent) => {
    startY = e.touches[0].clientY;
    currentY = startY;
    dragging = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging) {
      return;
    }
    currentY = e.touches[0].clientY;
    const dy = Math.max(0, currentY - startY);
    (e.currentTarget as HTMLDivElement).style.transform = `translateY(${dy}px)`;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    const el = e.currentTarget as HTMLDivElement;
    el.style.transition = "";
    const dy = currentY - startY;
    if (dy > 100) {
      onClose();
    }
    el.style.transform = "";
  };

  return (
    <>
      <div
        class={[
          "drawer-backdrop",
          {
            "drawer-backdrop--visible": open,
          },
        ]}
        on:click={onClose}
      />
      <div
        class={[
          "drawer",
          {
            "drawer--open": open,
          },
        ]}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
      >
        <div class="drawer-handle" />
        <div class="drawer-body">{children}</div>
      </div>
    </>
  );
};
