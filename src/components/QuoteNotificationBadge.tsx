import { Badge } from "@/components/ui/badge";
import { useQuoteNotifications } from "@/hooks/useQuoteNotifications";

interface QuoteNotificationBadgeProps {
  className?: string;
}

export function QuoteNotificationBadge({ className = "" }: QuoteNotificationBadgeProps) {
  const unreadQuotes = useQuoteNotifications();

  if (unreadQuotes === 0) return null;

  return (
    <Badge 
      className={`bg-red-500 text-white text-xs px-2 py-1 rounded-full ${className}`}
    >
      {unreadQuotes}
    </Badge>
  );
}