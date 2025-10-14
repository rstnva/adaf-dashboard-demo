import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium tracking-tight ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:transform",
  {
    variants: {
      variant: {
        default: "border border-amber-300/30 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-300/80 text-zinc-900 shadow-[0_18px_50px_-25px_rgba(250,204,21,0.65)] hover:from-amber-400/90 hover:to-yellow-200/90 active:scale-95",
        destructive:
          "border border-rose-500/50 bg-rose-500/25 text-rose-100 hover:bg-rose-500/35",
        outline:
          "border border-amber-200/30 bg-transparent text-amber-100/80 hover:border-amber-200/60 hover:bg-amber-500/10 hover:text-amber-100",
        secondary:
          "border border-zinc-700/40 bg-zinc-800/60 text-amber-100 hover:bg-zinc-700/60",
        ghost: "text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/10",
        link: "text-amber-200 hover:text-amber-100 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }