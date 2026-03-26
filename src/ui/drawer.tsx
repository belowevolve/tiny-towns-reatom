import type { Atom } from "@reatom/core";
import type { JSX } from "@reatom/jsx";

import { palette, radius } from "../shared/ui/design-system";

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
        css={`
          position: fixed;
          inset: 0;
          background: oklch(0 0 0 / 0.3);
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease-out;

          &[data-visible="true"] {
            opacity: 1;
            pointer-events: auto;
          }
        `}
        attr:data-visible={open}
        on:click={onClose}
      />
      <div
        css={`
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 101;
          background: ${palette.surface};
          border-radius: ${radius.xl} ${radius.xl} 0 0;
          box-shadow: 0 -4px 24px oklch(0.36 0.02 70 / 0.15);
          padding: 12px 20px 24px;
          transform: translateY(100%);
          transition: transform 0.3s ease-out;
          max-height: 70vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;

          &[data-open="true"] {
            transform: translateY(0);
          }
        `}
        attr:data-open={open}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
      >
        <div
          css={`
            width: 40px;
            height: 4px;
            background: ${palette.borderHover};
            border-radius: 2px;
            margin: 0 auto 16px;
            flex-shrink: 0;
          `}
        />
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 12px;
          `}
        >
          {children}
        </div>
      </div>
    </>
  );
};
