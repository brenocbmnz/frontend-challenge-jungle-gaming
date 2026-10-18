import { useRef } from "react";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { DialogProps } from "./dialog";

/** Application adapter: retain the lazy API and return focus to its opener. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => {
          trigger.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description || "Confira as informações antes de continuar."}
        </DialogDescription>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
