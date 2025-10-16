import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useQuoteNotifications() {
  const { user } = useAuth();
  const [unreadQuotes, setUnreadQuotes] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Função para buscar orçamentos não lidos - sistema limpo sem service_requests
    const fetchUnreadQuotes = async () => {
      try {
        // Sistema completamente limpo - sem service_requests ou quotes
        console.log("Sistema limpo: sem orçamentos não lidos");
        setUnreadQuotes(0);
      } catch (error) {
        console.error("Error fetching unread quotes:", error);
        setUnreadQuotes(0);
      }
    };

    // Buscar contagem inicial apenas se for cliente
    if (user?.user_metadata?.user_type === 'client') {
      fetchUnreadQuotes();

      // Configurar subscription para orçamentos em tempo real
      const channel = supabase
        .channel('unread-quotes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'quotes'
          },
          () => {
            fetchUnreadQuotes();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'quotes'
          },
          () => {
            fetchUnreadQuotes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return unreadQuotes;
}