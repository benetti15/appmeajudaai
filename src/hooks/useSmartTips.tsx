import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartTip {
  id: string;
  message: string;
  action?: string;
  actionPath?: string;
  variant: 'info' | 'tip' | 'warning' | 'success' | 'premium';
  priority: number;
  category: 'onboarding' | 'engagement' | 'growth' | 'reminder' | 'celebration' | 'warning';
}

interface UserBehaviorStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalQuotes: number;
  unreadMessages: number;
  profileComplete: boolean;
  hasAvatar: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  daysSinceRegistration: number;
  lastActivityDays: number;
}

export function useSmartTips() {
  const { user, profile } = useAuth();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const userType = profile?.user_type || 'client';

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-behavior-stats', user?.id],
    queryFn: async (): Promise<UserBehaviorStats> => {
      if (!user) {
        return {
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          totalQuotes: 0,
          unreadMessages: 0,
          profileComplete: false,
          hasAvatar: false,
          hasPhone: false,
          hasAddress: false,
          daysSinceRegistration: 0,
          lastActivityDays: 0
        };
      }

      // Fetch requests stats for clients
      let requestsData = { total: 0, pending: 0, completed: 0 };
      if (userType === 'client') {
        const { data: requests } = await supabase
          .from('service_requests')
          .select('status')
          .eq('client_id', user.id);
        
        if (requests) {
          requestsData = {
            total: requests.length,
            pending: requests.filter(r => r.status === 'pending').length,
            completed: requests.filter(r => r.status === 'completed').length
          };
        }
      }

      // Fetch quotes for professionals
      let quotesCount = 0;
      if (userType === 'professional') {
        const { count } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', user.id);
        quotesCount = count || 0;
      }

      // Fetch unread messages
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Calculate profile completeness
      const hasAvatar = !!profile?.avatar_url;
      const hasPhone = !!profile?.phone;
      const hasAddress = !!profile?.address || !!profile?.formatted_address;
      const profileComplete = hasAvatar && hasPhone && hasAddress;

      // Calculate days since registration
      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      const daysSinceRegistration = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate last activity
      const updatedAt = profile?.updated_at ? new Date(profile.updated_at) : new Date();
      const lastActivityDays = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        totalRequests: requestsData.total,
        pendingRequests: requestsData.pending,
        completedRequests: requestsData.completed,
        totalQuotes: quotesCount,
        unreadMessages: unreadCount || 0,
        profileComplete,
        hasAvatar,
        hasPhone,
        hasAddress,
        daysSinceRegistration,
        lastActivityDays
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Generate contextual tips based on user behavior
  const tips = useMemo((): SmartTip[] => {
    if (!stats) return [];

    const allTips: SmartTip[] = [];
    const hour = new Date().getHours();

    // ====== CLIENT TIPS ======
    if (userType === 'client') {
      // Onboarding tips
      if (!stats.profileComplete) {
        if (!stats.hasAvatar) {
          allTips.push({
            id: 'complete-avatar',
            message: '📸 Adicione uma foto ao seu perfil! Profissionais confiam mais em clientes com foto.',
            action: 'Adicionar Foto',
            actionPath: '/client-profile',
            variant: 'info',
            priority: 10,
            category: 'onboarding'
          });
        }
        if (!stats.hasPhone) {
          allTips.push({
            id: 'complete-phone',
            message: '📱 Adicione seu telefone para receber atualizações importantes sobre seus pedidos.',
            action: 'Completar Perfil',
            actionPath: '/client-profile',
            variant: 'warning',
            priority: 9,
            category: 'onboarding'
          });
        }
      }

      // New user tips
      if (stats.totalRequests === 0) {
        allTips.push({
          id: 'first-request',
          message: '🎉 Bem-vindo! Crie sua primeira solicitação e receba orçamentos de profissionais verificados.',
          action: 'Criar Solicitação',
          actionPath: '/categories',
          variant: 'tip',
          priority: 8,
          category: 'onboarding'
        });
      }

      // Engagement tips
      if (stats.pendingRequests > 0) {
        allTips.push({
          id: 'pending-requests',
          message: `⏳ Você tem ${stats.pendingRequests} ${stats.pendingRequests === 1 ? 'pedido aguardando' : 'pedidos aguardando'} orçamentos. Fique de olho!`,
          action: 'Ver Pedidos',
          actionPath: '/my-requests',
          variant: 'info',
          priority: 7,
          category: 'reminder'
        });
      }

      if (stats.unreadMessages > 0) {
        allTips.push({
          id: 'unread-messages',
          message: `💬 Você tem ${stats.unreadMessages} ${stats.unreadMessages === 1 ? 'mensagem não lida' : 'mensagens não lidas'}. Não deixe os profissionais esperando!`,
          action: 'Ver Mensagens',
          actionPath: '/conversations',
          variant: 'warning',
          priority: 10,
          category: 'reminder'
        });
      }

      // Celebration tips
      if (stats.completedRequests >= 5) {
        allTips.push({
          id: 'loyal-customer',
          message: '🌟 Parabéns! Você é um cliente frequente. Continue contando com a gente!',
          variant: 'premium',
          priority: 5,
          category: 'celebration'
        });
      }

      // Time-based tips
      if (hour >= 8 && hour < 12) {
        allTips.push({
          id: 'morning-tip',
          message: '☀️ Bom dia! Manhã é o melhor horário para receber orçamentos rápidos.',
          action: 'Nova Solicitação',
          actionPath: '/categories',
          variant: 'tip',
          priority: 3,
          category: 'engagement'
        });
      }

      // Growth tips
      if (stats.totalRequests > 0 && stats.daysSinceRegistration > 7) {
        allTips.push({
          id: 'photo-tip',
          message: '📷 Dica: Solicitações com fotos recebem 3x mais orçamentos!',
          action: 'Criar com Foto',
          actionPath: '/categories',
          variant: 'tip',
          priority: 4,
          category: 'growth'
        });
      }

      // Default tip
      if (allTips.length === 0) {
        allTips.push({
          id: 'default-client',
          message: 'Clique em "Nova Solicitação" e eu vou te ajudar a criar seu pedido!',
          action: 'Começar',
          actionPath: '/categories',
          variant: 'tip',
          priority: 1,
          category: 'engagement'
        });
      }
    }

    // ====== PROFESSIONAL TIPS ======
    if (userType === 'professional') {
      // Onboarding tips
      if (!stats.profileComplete) {
        allTips.push({
          id: 'complete-profile-pro',
          message: '⭐ Complete seu perfil para aparecer nas buscas e conquistar mais clientes!',
          action: 'Completar Perfil',
          actionPath: '/professional-profile',
          variant: 'warning',
          priority: 10,
          category: 'onboarding'
        });
      }

      if (!stats.hasAvatar) {
        allTips.push({
          id: 'add-avatar-pro',
          message: '📸 Profissionais com foto recebem 2x mais solicitações de orçamento.',
          action: 'Adicionar Foto',
          actionPath: '/professional-profile',
          variant: 'info',
          priority: 9,
          category: 'onboarding'
        });
      }

      // New professional tips
      if (stats.totalQuotes === 0) {
        allTips.push({
          id: 'first-quote',
          message: '🚀 Comece enviando seu primeiro orçamento! Há clientes esperando por você.',
          action: 'Ver Oportunidades',
          actionPath: '/available-requests',
          variant: 'tip',
          priority: 8,
          category: 'onboarding'
        });
      }

      // Engagement tips
      if (stats.unreadMessages > 0) {
        allTips.push({
          id: 'unread-messages-pro',
          message: `💬 ${stats.unreadMessages} ${stats.unreadMessages === 1 ? 'cliente aguarda' : 'clientes aguardam'} sua resposta. Responda rápido para fechar mais negócios!`,
          action: 'Responder',
          actionPath: '/conversations',
          variant: 'warning',
          priority: 10,
          category: 'reminder'
        });
      }

      // Time-based tips
      if (hour >= 7 && hour < 10) {
        allTips.push({
          id: 'morning-rush-pro',
          message: '🌅 Bom dia! Confira as novas solicitações da manhã antes da concorrência.',
          action: 'Ver Solicitações',
          actionPath: '/available-requests',
          variant: 'tip',
          priority: 6,
          category: 'engagement'
        });
      } else if (hour >= 18 && hour < 21) {
        allTips.push({
          id: 'evening-pro',
          message: '🌙 Muitos clientes solicitam serviços à noite. Aproveite para enviar orçamentos!',
          action: 'Ver Oportunidades',
          actionPath: '/available-requests',
          variant: 'tip',
          priority: 6,
          category: 'engagement'
        });
      }

      // Celebration tips
      if (stats.totalQuotes >= 10) {
        allTips.push({
          id: 'active-pro',
          message: '🏆 Você é um profissional ativo! Continue assim para se destacar.',
          variant: 'premium',
          priority: 4,
          category: 'celebration'
        });
      }

      // Growth tips
      allTips.push({
        id: 'response-time-tip',
        message: '⚡ Dica: Respostas rápidas aumentam em 40% suas chances de fechar negócio.',
        action: 'Ver Solicitações',
        actionPath: '/available-requests',
        variant: 'tip',
        priority: 3,
        category: 'growth'
      });

      // Default tip
      if (allTips.length === 0) {
        allTips.push({
          id: 'default-pro',
          message: 'Explore as solicitações disponíveis e envie seus orçamentos para conquistar novos clientes!',
          action: 'Ver Oportunidades',
          actionPath: '/available-requests',
          variant: 'tip',
          priority: 1,
          category: 'engagement'
        });
      }
    }

    // Sort by priority (higher first)
    return allTips.sort((a, b) => b.priority - a.priority);
  }, [stats, userType]);

  // Rotate tips every 10 seconds
  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [tips.length]);

  // Reset index when tips change
  useEffect(() => {
    setCurrentTipIndex(0);
  }, [tips.length]);

  const currentTip = tips[currentTipIndex] || null;
  const totalTips = tips.length;

  const nextTip = () => {
    setCurrentTipIndex(prev => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex(prev => (prev - 1 + tips.length) % tips.length);
  };

  return {
    currentTip,
    totalTips,
    currentIndex: currentTipIndex,
    nextTip,
    prevTip,
    allTips: tips
  };
}
