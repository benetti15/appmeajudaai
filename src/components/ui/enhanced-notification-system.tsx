import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Check, Clock, MessageSquare, DollarSign, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  action_url?: string;
}

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  quote_notifications: boolean;
  message_notifications: boolean;
  status_notifications: boolean;
}

export function EnhancedNotificationSystem({ unreadQuotes = 0 }: { unreadQuotes?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    email_enabled: true,
    quote_notifications: true,
    message_notifications: true,
    status_notifications: true,
  });
  
  const totalNotifications = unreadCount + unreadQuotes;

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    loadNotificationSettings();
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show desktop notification if enabled
          if (settings.push_enabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
            });
          }
          
          // Show toast notification
          toast.info(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url ? {
              label: "Ver",
              onClick: () => window.location.href = newNotification.action_url!,
            } : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, settings.push_enabled]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      // Use localStorage for notification settings for now
      const savedSettings = localStorage.getItem(`notification_settings_${user.id}`);
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    if (!user) return;

    try {
      // Save to localStorage for now
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(newSettings));
      setSettings(newSettings);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast.success("Todas as notificações foram marcadas como lidas");
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return;
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success("Notificação removida");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_received':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'quote_accepted':
        return <Check className="w-5 h-5 text-blue-600" />;
      case 'request_updated':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'chat_message':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'new_request':
        return <User className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'quote_received':
        return 'bg-green-50 border-green-200';
      case 'quote_accepted':
        return 'bg-blue-50 border-blue-200';
      case 'request_updated':
        return 'bg-orange-50 border-orange-200';
      case 'chat_message':
        return 'bg-purple-50 border-purple-200';
      case 'new_request':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    
    setShowNotifications(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative hover:bg-white/50 transition-all duration-200"
      >
        <Bell className={`h-5 w-5 ${totalNotifications > 0 ? 'animate-pulse' : ''}`} />
        {totalNotifications > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-scale-in"
          >
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowNotifications(false);
              setShowSettings(false);
            }}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 animate-slide-up">
            {!showSettings ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <h3 className="font-display font-semibold text-gray-800">Notificações</h3>
                    {totalNotifications > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {totalNotifications} nova{totalNotifications !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Configurações"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-8 px-3 hover:bg-blue-50 text-blue-600"
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(false)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="max-h-96">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma notificação</p>
                      <p className="text-sm">Você está em dia com tudo!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`group p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                            !notification.is_read ? 'bg-blue-50/50 border-l-4 border-blue-400' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm text-gray-800 leading-tight">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
                    <p className="text-xs text-gray-500 text-center">
                      Mantenha-se atualizado com as últimas novidades dos seus pedidos
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Settings Header */}
                <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h3 className="font-display font-semibold text-gray-800">Configurações</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Settings Content */}
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Métodos de Notificação</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-enabled" className="text-sm">
                        Notificações push no navegador
                      </Label>
                      <Switch
                        id="push-enabled"
                        checked={settings.push_enabled}
                        onCheckedChange={(checked) => {
                          const newSettings = { ...settings, push_enabled: checked };
                          saveNotificationSettings(newSettings);
                          
                          if (checked && 'Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-enabled" className="text-sm">
                        Notificações por e-mail
                      </Label>
                      <Switch
                        id="email-enabled"
                        checked={settings.email_enabled}
                        onCheckedChange={(checked) => {
                          const newSettings = { ...settings, email_enabled: checked };
                          saveNotificationSettings(newSettings);
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Tipos de Notificação</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quote-notifications" className="text-sm">
                        Novos orçamentos recebidos
                      </Label>
                      <Switch
                        id="quote-notifications"
                        checked={settings.quote_notifications}
                        onCheckedChange={(checked) => {
                          const newSettings = { ...settings, quote_notifications: checked };
                          saveNotificationSettings(newSettings);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="message-notifications" className="text-sm">
                        Novas mensagens no chat
                      </Label>
                      <Switch
                        id="message-notifications"
                        checked={settings.message_notifications}
                        onCheckedChange={(checked) => {
                          const newSettings = { ...settings, message_notifications: checked };
                          saveNotificationSettings(newSettings);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="status-notifications" className="text-sm">
                        Atualizações de status
                      </Label>
                      <Switch
                        id="status-notifications"
                        checked={settings.status_notifications}
                        onCheckedChange={(checked) => {
                          const newSettings = { ...settings, status_notifications: checked };
                          saveNotificationSettings(newSettings);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}