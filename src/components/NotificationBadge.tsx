import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

export function NotificationBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Erro ao buscar notificações:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    markAsRead(notification.id);
    
    // Redirecionar baseado no tipo de notificação
    let redirectPath = '';
    
    if (notification.related_id) {
      switch (notification.type) {
        case 'quote_received':
        case 'new_quote':
          // Para orçamentos recebidos, buscar o request_id do orçamento
          try {
            const { data: quote } = await supabase
              .from('quotes')
              .select('request_id')
              .eq('id', notification.related_id)
              .single();
            
            if (quote?.request_id) {
              redirectPath = `/simple-request-details/${quote.request_id}`;
            } else {
              redirectPath = '/my-requests';
            }
          } catch (error) {
            console.error('Error fetching quote:', error);
            redirectPath = '/my-requests';
          }
          break;
          
        case 'quote_accepted':
          // Para profissionais que tiveram orçamento aceito
          redirectPath = `/simple-request-details/${notification.related_id}`;
          break;

        case 'service_status':
        case 'professional_on_way':
        case 'professional_arrived':
        case 'service_started':
        case 'awaiting_confirmation':
        case 'payment_required':
        case 'payment_confirmed':
        case 'service_completed':
        case 'status_change':
        case 'accepted':
        case 'in_progress':
        case 'completed':
        case 'on_way':
        case 'arrived':
        case 'status_update':
          // Para atualizações de status, o related_id é o request_id
          redirectPath = `/simple-request-details/${notification.related_id}`;
          break;
          
        case 'tracking_started':
          // Para tracking iniciado
          redirectPath = `/track-requests/${notification.related_id}`;
          break;
          
        case 'chat_message':
        case 'message':
        case 'new_message':
          // Para mensagens, ir para o chat
          redirectPath = `/chat/${notification.related_id}`;
          break;
          
        case 'new_request':
        case 'request_updated':
          // Para novas solicitações (profissionais)
          redirectPath = `/simple-request-details/${notification.related_id}`;
          break;
          
        case 'service_cancelled':
        case 'dispute':
        case 'reschedule_requested':
        case 'rescheduled':
          redirectPath = `/simple-request-details/${notification.related_id}`;
          break;
          
        default:
          // Para outros tipos, tentar navegar para a página do serviço
          if (notification.type.includes('quote')) {
            redirectPath = '/my-requests';
          } else if (notification.type.includes('service') || notification.type.includes('request')) {
            redirectPath = `/simple-request-details/${notification.related_id}`;
          } else {
            redirectPath = '/my-requests';
          }
      }
    }
    
    setOpen(false);
    
    if (redirectPath) {
      navigate(redirectPath);
    }
  };

  const getNotificationIcon = (type: string) => {
    // Return appropriate emoji based on notification type
    if (type.includes("quote_received") || type.includes("new_quote")) return "💰";
    if (type.includes("quote_accepted")) return "🎉";
    if (type.includes("accepted")) return "✅";
    if (type.includes("completed") || type.includes("service_completed")) return "🎉";
    if (type.includes("on_way") || type.includes("professional_on_way")) return "🚗";
    if (type.includes("arrived") || type.includes("professional_arrived")) return "📍";
    if (type.includes("payment_confirmed")) return "💳";
    if (type.includes("payment") || type.includes("awaiting_confirmation")) return "💳";
    if (type.includes("in_progress") || type.includes("service_started")) return "🔧";
    if (type.includes("cancelled")) return "❌";
    if (type.includes("dispute")) return "⚠️";
    if (type.includes("reschedule")) return "📅";
    if (type.includes("tracking")) return "📍";
    if (type.includes("new_request")) return "🔔";
    if (type.includes("message") || type.includes("chat")) return "💬";
    return "🔔";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`mb-2 p-3 cursor-pointer transition-colors hover:bg-accent ${
                    !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
