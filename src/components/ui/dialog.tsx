import { lazy, Suspense, type ReactNode } from "react";
const Content = lazy(() =>
  import("./dialog-content").then((module) => ({ default: module.Dialog })),
);
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}
/** Load the Radix interaction and focus machinery when a dialog is opened. */
export function Dialog(props: DialogProps) {
  if (!props.open) return null;
  return (
    <Suspense
      fallback={
        <>
          <div className="dialog-overlay" />
          <div className="dialog-content" role="status">
            Carregando…
          </div>
        </>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
