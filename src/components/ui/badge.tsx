import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-2 border-border",
        success: "border-transparent bg-secondary text-primary",
        warning: "border-transparent bg-[hsl(48_96%_89%)] text-[hsl(28_72%_35%)]",
        error: "border-transparent bg-[hsl(0_93%_94%)] text-[hsl(0_72%_45%)]",
        neutral: "border-transparent bg-muted text-muted-foreground",
        inProgress: "border-transparent bg-secondary text-secondary-foreground",
        pulse: "border-transparent bg-primary text-primary-foreground animate-pulse-slow",
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