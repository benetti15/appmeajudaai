import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationData {
  title: string;
  message: string;
  type: 'quote_received' | 'service_started' | 'professional_on_way' | 'service_completed' | 'payment_required' | 'status_change';
  icon?: string;
  actionUrl?: string;
}

// Templates de notificação por tipo de mudança de status
const NOTIFICATION_TEMPLATES: Record<string, NotificationData> = {
  quoted: {
    title: "💰 Novo Orçamento Recebido!",
    message: "Você recebeu um novo orçamento. Clique para visualizar e aceitar.",
    type: "quote_received",
    icon: "💰",
    actionUrl: "/my-requests"
  },
  accepted: {
    title: "✅ Orçamento Aceito!",
    message: "Parabéns! Seu orçamento foi aceito. Prepare-se para o atendimento.",
    type: "status_change",
    icon: "✅"
  },
  on_way: {
    title: "🚗 Profissional a Caminho!",
    message: "Seu profissional está indo até o local. Prepare-se para recebê-lo.",
    type: "professional_on_way",
    icon: "🚗",
    actionUrl: "/track-requests"
  },
  arrived: {
    title: "📍 Profissional Chegou!",
    message: "O profissional chegou no local e iniciará o serviço em breve.",
    type: "professional_on_way",
    icon: "📍"
  },
  service_started: {
    title: "🚀 Serviço Iniciado!",
    message: "O atendimento foi iniciado. Acompanhe o progresso em tempo real.",
    type: "service_started",
    icon: "🚀",
    actionUrl: "/track-requests"
  },
  in_progress: {
    title: "⚙️ Serviço em Execução",
    message: "O profissional está executando o serviço conforme combinado.",
    type: "service_started",
    icon: "⚙️"
  },
  awaiting_confirmation: {
    title: "✋ Aguardando Sua Confirmação",
    message: "Serviço finalizado! Confirme a conclusão e efetue o pagamento.",
    type: "payment_required",
    icon: "✋",
    actionUrl: "/my-requests"
  },
  awaiting_payment: {
    title: "💳 Pagamento Pendente",
    message: "Finalize o pagamento para concluir o atendimento.",
    type: "payment_required",
    icon: "💳",
    actionUrl: "/my-requests"
  },
  completed: {
    title: "🎉 Serviço Concluído!",
    message: "Parabéns! Seu serviço foi finalizado. Não esqueça de avaliar.",
    type: "service_completed",
    icon: "🎉",
    actionUrl: "/my-requests"
  }
};

interface AutomaticNotificationsProps {
  userId: string;
  userRole: 'client' | 'professional';
}

export function AutomaticNotifications({ userId, userRole }: AutomaticNotificationsProps) {
  
  useEffect(() => {
    if (!userId) return;

    // Configurar subscription para mudanças de status
    const serviceUpdatesChannel = supabase
      .channel('service-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: userRole === 'client' ? `client_id=eq.${userId}` : undefined
        },
        async (payload) => {
          console.log('🔔 Status change detected:', payload);
          
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (newStatus !== oldStatus) {
            await handleStatusChangeNotification(newStatus, payload.new, userRole);
          }
        }
      )
      .subscribe();

    // Subscription para novos orçamentos (só para clientes)
    let quotesChannel: any = null;
    if (userRole === 'client') {
      quotesChannel = supabase
        .channel('quote-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'quotes'
          },
          async (payload) => {
            console.log('💰 New quote detected:', payload);
            
            // Verificar se o orçamento é para um pedido do usuário
            const { data: request } = await supabase
              .from('service_requests')
              .select('client_id')
              .eq('id', payload.new.request_id)
              .single();
              
            if (request?.client_id === userId) {
              await handleQuoteNotification(payload.new);
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(serviceUpdatesChannel);
      if (quotesChannel) {
        supabase.removeChannel(quotesChannel);
      }
    };
  }, [userId, userRole]);

  return null; // Este é um componente de lógica apenas
}

// Função para lidar com notificações de mudança de status
async function handleStatusChangeNotification(
  newStatus: string, 
  serviceRequest: any, 
  userRole: 'client' | 'professional'
) {
  console.log('📧 Sending status change notification:', { newStatus, userRole });
  
  const template = NOTIFICATION_TEMPLATES[newStatus];
  if (!template) return;

  // Determinar quem deve receber a notificação
  const recipientId = userRole === 'client' ? serviceRequest.client_id : serviceRequest.professional_id;
  
  try {
    // Enviar notificação in-app
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: template.title,
        message: template.message,
        type: template.type,
        related_id: serviceRequest.id,
        metadata: {
          action_url: template.actionUrl,
          icon: template.icon,
          service_category: serviceRequest.category
        }
      });

    if (error) {
      console.error('❌ Error sending notification:', error);
      return;
    }

    console.log('✅ Notification sent successfully');

    // TODO: Implementar envio de push notification
    await sendPushNotification({
      userId: recipientId,
      title: template.title,
      body: template.message,
      icon: template.icon,
      data: {
        url: template.actionUrl || '/dashboard',
        requestId: serviceRequest.id
      }
    });

    // TODO: Implementar envio de email
    await sendEmailNotification({
      userId: recipientId,
      subject: template.title,
      content: template.message,
      serviceRequest
    });

  } catch (error) {
    console.error('❌ Error in notification system:', error);
  }
}

// Função para lidar com notificações de novos orçamentos
async function handleQuoteNotification(quote: any) {
  console.log('💰 Sending quote notification:', quote);
  
  const template = NOTIFICATION_TEMPLATES.quoted;
  
  try {
    // Buscar informações do pedido
    const { data: request } = await supabase
      .from('service_requests')
      .select('client_id, title')
      .eq('id', quote.request_id)
      .single();

    if (!request) return;

    // Enviar notificação
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: request.client_id,
        title: template.title,
        message: `Novo orçamento para "${request.title}". Valor: R$ ${quote.price}`,
        type: template.type,
        related_id: quote.request_id,
        metadata: {
          action_url: template.actionUrl,
          quote_id: quote.id,
          quote_price: quote.price
        }
      });

    if (error) {
      console.error('❌ Error sending quote notification:', error);
      return;
    }

    // Mostrar toast para feedback imediato
    toast.success(template.title, {
      description: template.message,
      duration: 5000
    });

    console.log('✅ Quote notification sent successfully');

  } catch (error) {
    console.error('❌ Error in quote notification:', error);
  }
}

// Função placeholder para push notifications
async function sendPushNotification(data: {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  data?: any;
}) {
  console.log('📱 Push notification would be sent:', data);
  
  // TODO: Implementar integração com serviço de push (Firebase, OneSignal, etc.)
  // Por enquanto, apenas simula o envio
  
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(data.title, {
          body: data.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `service-${data.data?.requestId}`,
          data: data.data
        });
      }
    } catch (error) {
      console.log('Push notification not supported:', error);
    }
  }
}

// Função placeholder para notificações por email
async function sendEmailNotification(data: {
  userId: string;
  subject: string;
  content: string;
  serviceRequest: any;
}) {
  console.log('📧 Email notification would be sent:', data);
  
  // TODO: Implementar integração com serviço de email (SendGrid, Mailgun, etc.)
  // Esta função seria implementada como uma Edge Function no Supabase
  
  try {
    // Simula chamada para edge function de email
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: data.userId,
        subject: data.subject,
        content: data.content,
        metadata: {
          requestId: data.serviceRequest.id,
          category: data.serviceRequest.category
        }
      })
    });

    if (!response.ok) {
      throw new Error('Email service unavailable');
    }

    console.log('✅ Email notification queued successfully');
    
  } catch (error) {
    console.log('📧 Email service not available:', error);
  }
}

// Hook para uso em componentes
export function useAutomaticNotifications(userId: string, userRole: 'client' | 'professional') {
  useEffect(() => {
    if (!userId) return;

    // Registrar service worker para notificações push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, [userId]);

  return {
    // Funções utilitárias que podem ser expostas
    requestNotificationPermission: async () => {
      if ('Notification' in window) {
        return await Notification.requestPermission();
      }
      return 'denied';
    }
  };
}