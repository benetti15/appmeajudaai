import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Clock } from "lucide-react";

interface Conversation {
  request_id: string;
  request_title: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  other_user: {
    full_name: string;
    avatar_url?: string;
    user_type: string;
  };
  status: string;
}

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all requests that have messages and involve the current user
      const { data: messagesData, error } = await supabase
        .from("chat_messages")
        .select(`
          request_id,
          message,
          created_at,
          is_read,
          sender_id,
          service_requests!inner(
            id,
            title,
            client_id,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by request_id and process conversations
      const conversationMap = new Map<string, any>();
      
      for (const message of messagesData || []) {
        const request = message.service_requests;
        const requestId = message.request_id;
        
        // Check if user is involved in this conversation
        const isClient = request.client_id === user.id;
        const isProfessional = message.sender_id === user.id || 
          await checkIfUserIsQuotingProfessional(requestId, user.id);

        if (!isClient && !isProfessional) continue;

        if (!conversationMap.has(requestId)) {
          // Get the other user's profile
          const otherUserId = isClient ? message.sender_id : request.client_id;
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, user_type")
            .eq("id", otherUserId)
            .single();

          conversationMap.set(requestId, {
            request_id: requestId,
            request_title: request.title,
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: 0,
            other_user: profileData || { full_name: "Usuário", user_type: "client" },
            status: request.status,
            messages: []
          });
        }

        const conversation = conversationMap.get(requestId);
        conversation.messages.push(message);
        
        // Update last message if this is more recent
        if (new Date(message.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = message.message;
          conversation.last_message_time = message.created_at;
        }

        // Count unread messages
        if (!message.is_read && message.sender_id !== user.id) {
          conversation.unread_count++;
        }
      }

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      setConversations(conversationsList);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserIsQuotingProfessional = async (requestId: string, userId: string) => {
    const { data, error } = await supabase
      .from("quotes")
      .select("id")
      .eq("request_id", requestId)
      .eq("professional_id", userId)
      .limit(1);

    return !error && data && data.length > 0;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Concluído", variant: "outline" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };

    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Conversas
            </h1>
            <p className="text-sm text-muted-foreground">
              Suas conversas ativas sobre solicitações de serviço
            </p>
          </div>
        </div>

        {conversations.length === 0 ? (
          <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Quando você solicitar um serviço ou enviar um orçamento, as conversas aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const statusBadge = getStatusBadge(conversation.status);
              
              return (
                <Card
                  key={conversation.request_id}
                  className="border-0 shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm hover:bg-card/80"
                  onClick={() => navigate(`/chat/${conversation.request_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border/50">
                        <AvatarImage src={conversation.other_user.avatar_url} />
                        <AvatarFallback className="bg-primary/10">
                          {conversation.other_user.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {conversation.other_user.full_name}
                          </h3>
                          <Badge
                            variant={statusBadge.variant}
                            className="text-xs shrink-0"
                          >
                            {statusBadge.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          {conversation.request_title}
                        </p>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatLastMessageTime(conversation.last_message_time)}
                        </div>
                        
                        {conversation.unread_count > 0 && (
                          <Badge
                            variant="default"
                            className="bg-primary h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                          >
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}