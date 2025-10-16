import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PushNotificationManagerProps {
  onPermissionChange?: (granted: boolean) => void;
}

export function PushNotificationManager({ onPermissionChange }: PushNotificationManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
    if (user) {
      checkExistingSubscription();
    }
  }, [user]);

  const checkNotificationSupport = () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);
    
    if (isSupported) {
      setPermission(Notification.permission);
    }
  };

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!supported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá notificações sobre mensagens e atualizações.",
        });
        onPermissionChange?.(true);
      } else {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar notificações nas configurações do navegador.",
          variant: "destructive",
        });
        onPermissionChange?.(false);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Erro ao solicitar permissão",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker not registered');
      }

      // VAPID key - In production, this should come from environment variables
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual VAPID key
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // In a production app, you would save the subscription to your backend
      // For now, we'll just store it locally
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      
      setSubscription(subscription);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  };


  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      await subscription.unsubscribe();
      
      // Remove from local storage
      localStorage.removeItem('pushSubscription');
      
      setSubscription(null);
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações push.",
      });
      onPermissionChange?.(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') return;

    try {
      // This would normally be done by your backend
      new Notification('Teste - Me Ajuda ai!', {
        body: 'As notificações estão funcionando perfeitamente! 🎉',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Utility functions
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (!supported) {
    return (
      <Card className="p-4 bg-muted">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <div className="text-sm">
            Notificações push não são suportadas neste navegador.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            permission === 'granted' ? 'bg-green-100 text-green-600' : 
            permission === 'denied' ? 'bg-red-100 text-red-600' : 
            'bg-gray-100 text-gray-600'
          }`}>
            {permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </div>
          
          <div>
            <div className="font-medium">Notificações Push</div>
            <div className="text-sm text-muted-foreground">
              {permission === 'granted' ? 'Ativadas - Você receberá notificações' :
               permission === 'denied' ? 'Bloqueadas - Ative nas configurações do navegador' :
               'Clique para ativar notificações'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {permission === 'granted' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                disabled={loading}
              >
                Testar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                disabled={loading || !subscription}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : permission === 'default' ? (
            <Button
              size="sm"
              onClick={requestPermission}
              disabled={loading}
            >
              {loading ? "Ativando..." : "Ativar"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Notificações bloqueadas",
                  description: "Para ativar, vá em Configurações > Notificações no seu navegador e permita notificações para este site.",
                });
              }}
            >
              Ativar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}