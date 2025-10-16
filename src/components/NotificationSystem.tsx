import { EnhancedNotificationSystem } from "@/components/ui/enhanced-notification-system";

export function NotificationSystem({ unreadQuotes = 0 }: { unreadQuotes?: number }) {
  // Use the enhanced notification system instead
  return <EnhancedNotificationSystem unreadQuotes={unreadQuotes} />;
}