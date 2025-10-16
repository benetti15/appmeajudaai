import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Função para buscar mensagens não lidas - sistema limpo sem service_requests
    const fetchUnreadCount = async () => {
      try {
        // Sistema completamente limpo - sem service_requests
        console.log("Sistema limpo: sem mensagens não lidas");
        setUnreadCount(0);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
        setUnreadCount(0);
      }
    };

    // Buscar contagem inicial
    fetchUnreadCount();

    // Configurar subscription para mensagens em tempo real
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=neq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=neq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}