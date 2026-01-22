import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationServiceOptions {
  onQuoteReceived?: (data: any) => void;
  onMessageReceived?: (data: any) => void;
  onStatusChanged?: (data: any) => void;
  onNewRequest?: (data: any) => void;
}

export function useNotificationService(options: NotificationServiceOptions = {}) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create notification function
    const createNotification = async (
      userId: string,
      title: string,
      message: string,
      type: string,
      relatedId?: string
    ) => {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            type,
            related_id: relatedId,
            is_read: false
          });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    };

    // Listen for new quotes
    const quotesChannel = supabase
      .channel('quotes-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quotes',
        },
        async (payload) => {
          const quote = payload.new;
          
          // Get request details
          const { data: request } = await supabase
            .from('service_requests')
            .select('client_id, title')
            .eq('id', quote.request_id)
            .single();

          if (request && request.client_id === user.id) {
            await createNotification(
              request.client_id,
              'Novo Orçamento Recebido! 💰',
              `Você recebeu um novo orçamento de R$ ${quote.amount.toLocaleString('pt-BR')} para "${request.title}".`,
              'quote_received',
              quote.id
            );
            
            options.onQuoteReceived?.(quote);
          }
        }
      )
      .subscribe();

    // Listen for quote acceptances (for professionals)
    const quoteUpdatesChannel = supabase
      .channel('quote-updates-listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
        },
        async (payload) => {
          const quote = payload.new;
          
          if (quote.professional_id === user.id && quote.is_accepted) {
            const { data: request } = await supabase
              .from('service_requests')
              .select('title')
              .eq('id', quote.request_id)
              .single();

            if (request) {
              await createNotification(
                user.id,
                'Orçamento Aceito! 🎉',
                `Seu orçamento de R$ ${quote.amount.toLocaleString('pt-BR')} foi aceito para "${request.title}".`,
                'quote_accepted',
                quote.id
              );
            }
          }
        }
      )
      .subscribe();

    // Listen for service status changes
    const statusChannel = supabase
      .channel('status-listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
        },
        async (payload) => {
          const request = payload.new;
          const oldRequest = payload.old;
          
          if (request.client_id === user.id && request.status !== oldRequest.status) {
            let title = '';
            let message = '';
            
            switch (request.status) {
              case 'accepted':
                title = 'Serviço Aceito! ✅';
                message = `Seu pedido "${request.title}" foi aceito por um profissional.`;
                break;
              case 'in_progress':
                title = 'Profissional a Caminho! 🚗';
                message = `O profissional está se dirigindo ao seu endereço para "${request.title}".`;
                break;
              case 'completed':
                title = 'Serviço Finalizado! 🎯';
                message = `O serviço "${request.title}" foi finalizado com sucesso.`;
                break;
              default:
                return;
            }
            
            await createNotification(
              request.client_id,
              title,
              message,
              'request_updated',
              request.id
            );
            
            options.onStatusChanged?.(request);
          }
        }
      )
      .subscribe();

    // Listen for new service requests (for professionals)
    const newRequestsChannel = supabase
      .channel('new-requests-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
        },
        async (payload) => {
          const request = payload.new;
          
          // Only notify professionals, and not the client who created it
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();

          if (profile?.user_type === 'professional' && request.client_id !== user.id) {
            await createNotification(
              user.id,
              'Novo Pedido Disponível! 🔔',
              `Nova solicitação: "${request.title}" na sua região.`,
              'new_request',
              request.id
            );
            
            options.onNewRequest?.(request);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(quoteUpdatesChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(newRequestsChannel);
    };
  }, [user, options]);

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else {
        toast.error('Permissão de notificação negada.');
        return false;
      }
    }
    
    return Notification.permission === 'granted';
  };

  return {
    requestNotificationPermission
  };
}