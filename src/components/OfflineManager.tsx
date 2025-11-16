import React, { useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { toast } from 'sonner';

export const OfflineManager: React.FC = () => {
  const { isOnline, pendingMessages } = useOfflineQueue();

  useEffect(() => {
    if (!isOnline) {
      toast.error('Você está offline. As mensagens serão sincronizadas quando a conexão for restabelecida.', {
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      });
    } else if (pendingMessages.length > 0) {
      toast.success(`Conexão restabelecida! Sincronizando ${pendingMessages.length} mensagem(ns)...`, {
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000,
      });
    }
  }, [isOnline, pendingMessages.length]);

  if (isOnline && pendingMessages.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-3"
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-5 w-5 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium text-sm">Sem conexão</p>
            <p className="text-xs text-muted-foreground">
              Modo offline ativo
            </p>
          </div>
        </>
      ) : pendingMessages.length > 0 ? (
        <>
          <div className="animate-pulse">
            <Wifi className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-sm">Sincronizando...</p>
            <p className="text-xs text-muted-foreground">
              {pendingMessages.length} mensagem(ns) pendente(s)
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};
