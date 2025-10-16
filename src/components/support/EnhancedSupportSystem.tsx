import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  User,
  FileText,
  Send
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  service_request_id?: string;
  user_id: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  message: string;
  sender_type: 'user' | 'support';
  sender_name: string;
  created_at: string;
}

interface EnhancedSupportSystemProps {
  requestId?: string;
  requestTitle?: string;
  currentStatus?: string;
  professionalName?: string;
  clientName?: string;
  triggerButtonText?: string;
  triggerButtonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

export function EnhancedSupportSystem({
  requestId,
  requestTitle,
  currentStatus,
  professionalName,
  clientName,
  triggerButtonText = "Contatar Suporte",
  triggerButtonVariant = "outline"
}: EnhancedSupportSystemProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'service_issue'
  });
  
  // New message
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (isDialogOpen && user) {
      fetchUserTickets();
    }
  }, [isDialogOpen, user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchUserTickets = async () => {
    if (!user) return;

    try {
      // Simulate support tickets table (in real app, these would be real Supabase tables)
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          subject: 'Problema com o serviço',
          description: 'O profissional não chegou no horário marcado',
          priority: 'high',
          status: 'open',
          category: 'service_issue',
          created_at: new Date().toISOString(),
          service_request_id: requestId,
          user_id: user.id
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      // Simulate support messages (in real app, these would be real Supabase tables)
      const mockMessages: SupportMessage[] = [
        {
          id: '1',
          ticket_id: ticketId,
          message: 'Olá! Recebi sua solicitação e vou te ajudar com esse problema.',
          sender_type: 'support',
          sender_name: 'Suporte Técnico',
          created_at: new Date().toISOString()
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const createTicket = async () => {
    if (!user || !newTicket.subject || !newTicket.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Auto-fill context if we have service information
      let contextualDescription = newTicket.description;
      if (requestId) {
        contextualDescription = `
CONTEXTO DO SERVIÇO:
- ID da Solicitação: ${requestId}
- Título: ${requestTitle || 'N/A'}
- Status Atual: ${currentStatus || 'N/A'}
- Profissional: ${professionalName || 'N/A'}
- Cliente: ${clientName || 'N/A'}

DESCRIÇÃO DO PROBLEMA:
${newTicket.description}
        `.trim();
      }

      // In real implementation, this would create in Supabase
      const ticket: SupportTicket = {
        id: Date.now().toString(),
        subject: newTicket.subject,
        description: contextualDescription,
        priority: newTicket.priority,
        status: 'open',
        category: newTicket.category,
        created_at: new Date().toISOString(),
        service_request_id: requestId,
        user_id: user.id
      };

      // Simulate ticket creation
      setTickets(prev => [ticket, ...prev]);
      setSelectedTicket(ticket);
      
      // Reset form
      setNewTicket({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'service_issue'
      });

      toast.success('Chamado criado com sucesso! Nossa equipe entrará em contato em breve.');
      
      // Simulate auto-response
      setTimeout(() => {
        const autoResponse: SupportMessage = {
          id: Date.now().toString(),
          ticket_id: ticket.id,
          message: `Olá ${user.user_metadata?.full_name || 'usuário'}! 

Recebemos seu chamado "${ticket.subject}" e nossa equipe está analisando. 

Informações do chamado:
- Número: #${ticket.id}
- Prioridade: ${ticket.priority}
- Status: Aberto

Nossa equipe de suporte responderá em até 2 horas para casos de alta prioridade, ou até 24 horas para casos normais.

Atenciosamente,
Equipe de Suporte`,
          sender_type: 'support',
          sender_name: 'Sistema de Suporte',
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, autoResponse]);
      }, 1000);

    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      toast.error('Erro ao criar chamado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    const message: SupportMessage = {
      id: Date.now().toString(),
      ticket_id: selectedTicket.id,
      message: newMessage.trim(),
      sender_type: 'user',
      sender_name: user?.user_metadata?.full_name || 'Usuário',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    toast.success('Mensagem enviada!');

    // Simulate support response
    setTimeout(() => {
      const response: SupportMessage = {
        id: (Date.now() + 1).toString(),
        ticket_id: selectedTicket.id,
        message: 'Obrigado pela informação adicional. Estamos verificando e retornaremos em breve.',
        sender_type: 'support',
        sender_name: 'Equipe de Suporte',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerButtonVariant} className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Central de Suporte</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {!selectedTicket ? (
            // Ticket list and creation
            <div className="space-y-6">
              
              {/* Create New Ticket */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Abrir Novo Chamado
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({...prev, category: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service_issue">Problema com Serviço</SelectItem>
                          <SelectItem value="payment_issue">Problema de Pagamento</SelectItem>
                          <SelectItem value="professional_issue">Problema com Profissional</SelectItem>
                          <SelectItem value="app_issue">Problema no App</SelectItem>
                          <SelectItem value="general">Dúvida Geral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket(prev => ({...prev, priority: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket(prev => ({...prev, subject: e.target.value}))}
                      placeholder="Descreva resumidamente o problema"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição detalhada</Label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({...prev, description: e.target.value}))}
                      placeholder="Descreva o problema em detalhes..."
                      rows={4}
                    />
                  </div>
                  
                  {requestId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        ℹ️ <strong>Contexto automático:</strong> Suas informações do serviço atual serão incluídas automaticamente no chamado para agilizar o atendimento.
                      </p>
                    </div>
                  )}
                  
                  <Button onClick={createTicket} disabled={loading} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Criando chamado...' : 'Abrir Chamado'}
                  </Button>
                </div>
              </Card>

              {/* Existing Tickets */}
              {tickets.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Seus Chamados
                  </h3>
                  
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div 
                        key={ticket.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">#{ticket.id} - {ticket.subject}</h4>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {ticket.description.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criado em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Contact Options */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Outras formas de contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    (11) 9999-9999
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    suporte@empresa.com
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Horário de atendimento: Segunda a Sexta, 8h às 18h
                </p>
              </Card>
            </div>
          ) : (
            // Ticket conversation
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                  ← Voltar
                </Button>
                <div className="flex-1">
                  <h3 className="font-semibold">#{selectedTicket.id} - {selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-medium">{message.sender_name}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Send Message */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
