import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_12px_30px_-18px_rgba(250,204,21,0.65)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-amber-300/40 bg-amber-500/20 text-zinc-900 hover:bg-amber-400/30",
        secondary:
          "border-zinc-700/40 bg-zinc-900/60 text-amber-100/80 hover:bg-zinc-800/60",
        destructive:
          "border-rose-500/50 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30",
        outline: "border-amber-200/40 bg-transparent text-amber-100/80 hover:border-amber-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
