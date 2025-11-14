import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Sparkles } from 'lucide-react';

interface ProactiveNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  action?: {
    label: string;
    path: string;
  };
}

export function ProactiveNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    checkForProactiveNotifications();
    
    // Check every 5 minutes
    const interval = setInterval(checkForProactiveNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const checkForProactiveNotifications = async () => {
    if (!user || !profile) return;

    try {
      if (profile.user_type === 'client') {
        await checkClientNotifications();
      } else {
        await checkProfessionalNotifications();
      }
    } catch (error) {
      console.error('Error checking proactive notifications:', error);
    }
  };

  const checkClientNotifications = async () => {
    // Check for pending requests without quotes
    const { data: pendingRequests } = await supabase
      .from('service_requests')
      .select(`
        *,
        quotes(count)
      `)
      .eq('client_id', user!.id)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()); // Last 2 hours

    if (pendingRequests && pendingRequests.length > 0) {
      const requestsWithoutQuotes = pendingRequests.filter((req: any) => 
        !req.quotes || req.quotes.length === 0
      );

      if (requestsWithoutQuotes.length > 0) {
        toast({
          title: "💡 Dica do Toninho",
          description: `Seu pedido está sem resposta há 2h. Quer aumentar a urgência ou adicionar mais detalhes?`,
          duration: 10000,
        });
      }
    }

    // Check for new quotes
    const { data: newQuotes } = await supabase
      .from('quotes')
      .select(`
        *,
        service_requests!inner(client_id)
      `)
      .eq('service_requests.client_id', user!.id)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

    if (newQuotes && newQuotes.length > 0) {
      toast({
        title: "🎉 Novos orçamentos!",
        description: `Você recebeu ${newQuotes.length} novo(s) orçamento(s). Quer que eu compare eles para você?`,
        duration: 10000,
      });
    }
  };

  const checkProfessionalNotifications = async () => {
    // Check for new requests in professional's area
    const { data: newRequests } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

    if (newRequests && newRequests.length > 0) {
      toast({
        title: "🔔 Novas oportunidades!",
        description: `${newRequests.length} novo(s) pedido(s) na sua área. Veja agora!`,
        duration: 10000,
      });
    }

    // Check for accepted quotes with pending status update
    const { data: acceptedQuotes } = await supabase
      .from('quotes')
      .select(`
        *,
        service_requests!inner(
          id,
          status,
          updated_at
        )
      `)
      .eq('professional_id', user!.id)
      .eq('is_accepted', true)
      .eq('service_requests.status', 'accepted')
      .lte('service_requests.updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 min old

    if (acceptedQuotes && acceptedQuotes.length > 0) {
      toast({
        title: "⏰ Lembrete",
        description: `Você tem serviços aceitos aguardando atualização de status. Lembre-se de atualizar para "A caminho"!`,
        duration: 10000,
      });
    }
  };

  return null; // This component only manages notifications, doesn't render anything
}
