import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  withDot?: boolean;
  className?: string;
}

export function StatusIndicator({ status, label, withDot = true, className }: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      color: 'bg-success',
      textColor: 'text-success',
      dotColor: 'bg-success'
    },
    warning: {
      color: 'bg-warning',
      textColor: 'text-warning',
      dotColor: 'bg-warning'
    },
    error: {
      color: 'bg-destructive',
      textColor: 'text-destructive',
      dotColor: 'bg-destructive'
    },
    info: {
      color: 'bg-primary',
      textColor: 'text-primary',
      dotColor: 'bg-primary'
    },
    pending: {
      color: 'bg-muted',
      textColor: 'text-muted-foreground',
      dotColor: 'bg-muted-foreground'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {withDot && (
        <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
      )}
      <span className={cn("text-sm font-medium", config.textColor)}>{label}</span>
    </div>
  );
}
