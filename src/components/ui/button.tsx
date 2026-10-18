import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva(
  "ui-button inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-ink hover:bg-accent",
        outline: "border border-border text-accent hover:bg-card",
        ghost: "text-accent hover:bg-card",
      },
      size: {
        default: "min-h-10 px-5 py-2",
        sm: "min-h-9 px-3",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
