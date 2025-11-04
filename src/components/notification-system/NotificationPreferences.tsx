import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, DollarSign, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  quote_notifications: boolean;
  status_notifications: boolean;
  message_notifications: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: true,
    quote_notifications: true,
    status_notifications: true,
    message_notifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = () => {
    // Load from localStorage for now
    const saved = localStorage.getItem(`notification_prefs_${userId}`);
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for now
      localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(preferences));
      
      // TODO: Save to database when table is created
      // await supabase.from('notification_preferences').upsert({
      //   user_id: userId,
      //   ...preferences
      // });

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setIsSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, push_enabled: true }));
        toast.success("Notificações push ativadas!");
      } else {
        toast.error("Permissão de notificação negada");
        setPreferences(prev => ({ ...prev, push_enabled: false }));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Preferências de Notificações
        </CardTitle>
        <CardDescription>
          Configure como deseja receber notificações sobre seus serviços
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Canais de Notificação */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Canais de Notificação</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push_enabled">Notificações Push</Label>
                <p className="text-xs text-muted-foreground">
                  Receba alertas mesmo quando o app estiver fechado
                </p>
              </div>
            </div>
            <Switch
              id="push_enabled"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestPushPermission();
                } else {
                  setPreferences(prev => ({ ...prev, push_enabled: checked }));
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email_enabled">Notificações por Email</Label>
                <p className="text-xs text-muted-foreground">
                  Receba resumos e atualizações importantes por email
                </p>
              </div>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, email_enabled: checked }))
              }
            />
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Tipos de Notificação</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="quote_notifications">Orçamentos</Label>
                <p className="text-xs text-muted-foreground">
                  Novos orçamentos e atualizações de preços
                </p>
              </div>
            </div>
            <Switch
              id="quote_notifications"
              checked={preferences.quote_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, quote_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="status_notifications">Mudanças de Status</Label>
                <p className="text-xs text-muted-foreground">
                  Atualizações sobre o andamento do serviço
                </p>
              </div>
            </div>
            <Switch
              id="status_notifications"
              checked={preferences.status_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, status_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="message_notifications">Mensagens</Label>
                <p className="text-xs text-muted-foreground">
                  Novas mensagens no chat
                </p>
              </div>
            </div>
            <Switch
              id="message_notifications"
              checked={preferences.message_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, message_notifications: checked }))
              }
            />
          </div>
        </div>

        <Button 
          onClick={savePreferences} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Salvar Preferências"}
        </Button>
      </CardContent>
    </Card>
  );
}
