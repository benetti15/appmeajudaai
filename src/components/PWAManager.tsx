import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Bell, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAManager() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if app is installed as PWA
    const isInStandaloneMode = () => 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsPWA(isInStandaloneMode());

    // Check notification support
    setNotificationSupported('Notification' in window);
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after 30 seconds if not installed
      setTimeout(() => {
        if (!isInStandaloneMode()) {
          setShowInstallPrompt(true);
        }
      }, 30000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      toast.success('App instalado com sucesso!', {
        description: 'Agora você pode receber notificações mesmo com o app fechado.'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('Instalação iniciada', {
        description: 'O app será instalado em instantes.'
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const requestNotificationPermission = async () => {
    if (!notificationSupported) {
      toast.error('Notificações não suportadas', {
        description: 'Seu navegador não suporta notificações.'
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Notificações ativadas!', {
          description: 'Você receberá atualizações dos seus pedidos.'
        });
        
        // Test notification
        new Notification('Me Ajuda ai!', {
          body: 'Notificações ativadas com sucesso! 🎉',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else {
        toast.error('Permissão negada', {
          description: 'Você não receberá notificações push.'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão', {
        description: 'Tente novamente mais tarde.'
      });
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && deferredPrompt && !isPWA && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <Card className="w-80 bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-violet-600" />
                  <CardTitle className="text-lg">Instalar App</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Instale o Me Ajuda ai! e receba notificações mesmo com o app fechado
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInstallPrompt(false)}
                  className="flex-1"
                >
                  Mais tarde
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Permission */}
      {notificationSupported && notificationPermission === 'default' && isPWA && (
        <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
          <Card className="w-80 bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Ativar Notificações</CardTitle>
              </div>
              <CardDescription>
                Receba atualizações instantâneas dos seus pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={requestNotificationPermission}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Ativar Notificações
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}