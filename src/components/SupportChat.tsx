import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  X,
  Phone,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupportChatProps {
  requestId?: string;
  issue?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'support';
  created_at: string;
  sender_name: string;
}

export function SupportChat({ requestId, issue }: SupportChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createTicketForm, setCreateTicketForm] = useState({
    subject: "",
    description: issue || "",
    priority: 'medium' as const
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkExistingTicket();
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkExistingTicket = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // For now, simulate support ticket system
      // In a real implementation, this would use actual support_tickets table
      const simulatedTicket: SupportTicket = {
        id: `ticket-${user.id}-${requestId}`,
        subject: "Suporte para solicitação",
        description: issue || "Solicitação de suporte",
        status: 'open',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setActiveTicket(simulatedTicket);
      setMessages([{
        id: "welcome-msg",
        message: "Olá! Como podemos ajudá-lo hoje?",
        sender_type: 'support',
        sender_name: "Equipe de Suporte",
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("Error checking existing ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    // For now, simulate message fetching
    // In a real implementation, this would fetch from support_messages table
    console.log("Fetching messages for ticket:", ticketId);
  };

  const createSupportTicket = async () => {
    if (!user || !createTicketForm.subject.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto do ticket.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Simulate ticket creation
      const newTicket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        subject: createTicketForm.subject.trim(),
        description: createTicketForm.description.trim(),
        priority: createTicketForm.priority,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setActiveTicket(newTicket);
      setMessages([{
        id: "initial-msg",
        message: "Olá! Preciso de ajuda com: " + createTicketForm.description,
        sender_type: 'user',
        sender_name: user.user_metadata?.full_name || user.email || "Usuário",
        created_at: new Date().toISOString()
      }]);

      toast({
        title: "Ticket criado!",
        description: "Nossa equipe de suporte responderá em breve.",
      });

      setCreateTicketForm({ subject: "", description: "", priority: 'medium' });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      toast({
        title: "Erro ao criar ticket",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || newMessage.trim();
    if (!text || !activeTicket || !user) return;

    try {
      // Simulate message sending
      // In a real implementation, this would save to support_messages table

      // Add message optimistically
      const newMsg: SupportMessage = {
        id: `temp-${Date.now()}`,
        message: text,
        sender_type: 'user',
        sender_name: user.user_metadata?.full_name || user.email || "Usuário",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage("");

      // Simulate support response (in real app, this would come from support team)
      setTimeout(() => {
        const supportResponse: SupportMessage = {
          id: `support-${Date.now()}`,
          message: "Obrigado por entrar em contato! Nossa equipe analisará seu caso e responderá em breve. Tempo estimado: 2-4 horas.",
          sender_type: 'support',
          sender_name: "Equipe de Suporte",
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, supportResponse]);
      }, 2000);

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Suporte
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Central de Suporte
          </DialogTitle>
        </DialogHeader>

        {!activeTicket ? (
          // Create new ticket form
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Criar Novo Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    value={createTicketForm.subject}
                    onChange={(e) => setCreateTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Descreva brevemente o problema"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={createTicketForm.description}
                    onChange={(e) => setCreateTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o problema em detalhes"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <select
                    value={createTicketForm.priority}
                    onChange={(e) => setCreateTicketForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <Button onClick={createSupportTicket} disabled={loading} className="w-full">
                  {loading ? "Criando..." : "Criar Ticket"}
                </Button>
              </CardContent>
            </Card>

            {/* Contact alternatives */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Outras formas de contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>WhatsApp: (11) 99999-9999</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email: suporte@meajudaai.com</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active ticket chat
          <div className="flex-1 flex flex-col min-h-0">
            {/* Ticket info */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{activeTicket.subject}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTicket(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(activeTicket.status)}>
                    {activeTicket.status === 'open' && 'Aberto'}
                    {activeTicket.status === 'in_progress' && 'Em Andamento'}
                    {activeTicket.status === 'resolved' && 'Resolvido'}
                    {activeTicket.status === 'closed' && 'Fechado'}
                  </Badge>
                  <Badge className={getPriorityColor(activeTicket.priority)}>
                    {activeTicket.priority === 'low' && 'Baixa'}
                    {activeTicket.priority === 'medium' && 'Média'}
                    {activeTicket.priority === 'high' && 'Alta'}
                    {activeTicket.priority === 'urgent' && 'Urgente'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4 p-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender_type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender_name}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}