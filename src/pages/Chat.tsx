import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Camera, Image } from "lucide-react";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { VoiceMessage } from "@/components/VoiceMessage";

interface ChatMessage {
  id: string;
  message: string;
  image_url?: string;
  created_at: string;
  sender_id: string;
  sender_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ServiceRequest {
  id: string;
  title: string;
  client_id: string;
  status: string;
}

export default function Chat() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !requestId) {
      navigate("/auth");
      return;
    }

    checkChatAccess();
  }, [user, requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkChatAccess = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select("id, title, client_id, status")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;

      // Verificar se o usuário tem acesso ao chat
      const isClient = requestData.client_id === user?.id;
      
      if (isClient) {
        // Cliente tem acesso, mas verificar se há orçamento aceito
        const { data: acceptedQuote, error: quoteError } = await supabase
          .from("quotes")
          .select("professional_id")
          .eq("request_id", requestId)
          .eq("is_accepted", true)
          .single();

        if (quoteError || !acceptedQuote) {
          toast({
            title: "Chat não disponível",
            description: "O chat estará disponível após aceitar um orçamento.",
            variant: "destructive",
          });
          navigate("/my-requests");
          return;
        }
        
        setRequest(requestData);
        fetchMessages();
        return;
      }

      // Verificar se é o profissional com orçamento aceito
      const { data: acceptedQuote, error: quoteError } = await supabase
        .from("quotes")
        .select("professional_id")
        .eq("request_id", requestId)
        .eq("professional_id", user?.id)
        .eq("is_accepted", true)
        .single();

      if (quoteError || !acceptedQuote) {
        toast({
          title: "Acesso negado",
          description: "Você só pode acessar conversas de orçamentos aceitos.",
          variant: "destructive",
        });
        navigate("/available-requests");
        return;
      }

      setRequest(requestData);
      fetchMessages();
    } catch (error) {
      console.error("Error checking chat access:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o acesso ao chat.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender_profile:sender_id(full_name, avatar_url)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-messages-${requestId}`, {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `request_id=eq.${requestId}`
        },
        async (payload) => {
          // Só processa mensagens de outros usuários
          if (payload.new.sender_id === user?.id) return;
          
          // Fetch the complete message with profile data
          const { data } = await supabase
            .from("chat_messages")
            .select(`
              *,
              sender_profile:sender_id(full_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages(prev => {
              // Verifica se a mensagem já existe para evitar duplicatas
              const messageExists = prev.some(msg => msg.id === data.id);
              if (messageExists) return prev;
              
              return [...prev, data];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup function properly
    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Setup cleanup for realtime subscription
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (request) {
      cleanup = setupRealtimeSubscription();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [request, requestId, user]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && imageUrls.length === 0) || !user || sending) return;

    const messageText = newMessage.trim();
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

    // Optimistic update - adiciona a mensagem imediatamente na interface
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      message: messageText || "",
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender_profile: {
        full_name: user.user_metadata?.full_name || user.email || "Você",
        avatar_url: user.user_metadata?.avatar_url
      }
    };

    // Adiciona a mensagem imediatamente
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setImageUrls([]);
    setSending(true);

    try {
      const messageData = {
        message: messageText || "",
        sender_id: user.id,
        request_id: requestId,
        image_url: imageUrl,
      };

      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select(`
          *,
          sender_profile:sender_id(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Remove a mensagem temporária e adiciona a real
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove a mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restaura o texto da mensagem
      setNewMessage(messageText);
      setImageUrls(imageUrl ? [imageUrl] : []);
      
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Chat - {request?.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Conversa sobre a solicitação de serviço
            </p>
          </div>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col border-0 shadow-glow bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Chat Ativo
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 border border-border/50">
                        <AvatarImage src={message.sender_profile?.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {message.sender_profile?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            {message.sender_profile?.full_name || "Usuário"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        
                        <div
                          className={`rounded-2xl px-4 py-2 shadow-sm ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border border-border/50"
                          }`}
                        >
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Imagem da mensagem"
                              className="max-w-full h-auto rounded-lg mb-2"
                            />
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/50 p-4 space-y-3">
              {imageUrls.length > 0 && (
                <div className="flex gap-2">
                  <Image className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex gap-2">
                    {imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <PhotoUpload
                  onImageUploaded={(url) => setImageUrls([url])}
                  maxImages={1}
                  existingImages={imageUrls}
                />
                
                <VoiceMessage
                  onVoiceRecorded={(audioBlob, duration) => {
                    // Por enquanto, simula o envio do áudio
                    toast({
                      title: "Mensagem de voz enviada",
                      description: `Áudio de ${duration}s enviado com sucesso!`,
                    });
                  }}
                  disabled={sending}
                />
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 border-border/50 focus:border-primary"
                  disabled={sending}
                />
                
                <Button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && imageUrls.length === 0) || sending}
                  className="shrink-0 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}