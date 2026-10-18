import { useEffect, type RefObject } from "react";

/** Non-modal disclosure: preserve outside focus, restore trigger focus on Escape. */
export function useDismissible(
  open: boolean,
  region: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !region.current?.contains(event.target)
      )
        onDismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onDismiss();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, region, trigger, onDismiss]);
}
