import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Search, Calendar, MessageCircle, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  context: {
    page?: string;
    user_type?: string;
  };
  metadata?: {
    message_count?: number;
    topic?: string;
  };
}

export default function ToninhoHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => {
        const messagesText = conv.messages.map(m => m.content).join(' ').toLowerCase();
        return messagesText.includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedConversations: Conversation[] = (data || []).map(conv => ({
        id: conv.id,
        created_at: conv.created_at || '',
        updated_at: conv.updated_at || '',
        messages: (conv.messages as any[]) || [],
        context: (conv.context as any) || {},
        metadata: (conv.metadata as any) || {}
      }));

      setConversations(formattedConversations);
      setFilteredConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      setSelectedConversation(null);
      
      toast({
        title: 'Conversa excluída',
        description: 'A conversa foi removida com sucesso'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conversa',
        variant: 'destructive'
      });
    }
  };

  const exportConversation = (conv: Conversation) => {
    const content = conv.messages.map(msg => 
      `[${msg.role === 'user' ? 'Você' : 'Toninho'}] ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-toninho-${format(new Date(conv.created_at), 'dd-MM-yyyy')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummary = (messages: Conversation['messages']) => {
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
    return firstUserMessage.slice(0, 100) + (firstUserMessage.length > 100 ? '...' : '');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Faça login para ver seu histórico</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Histórico com Toninho</h1>
            <p className="text-muted-foreground">
              {filteredConversations.length} conversas encontradas
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar em conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4">Carregando conversas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1">
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredConversations.length === 0 ? (
                  <Card className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                    </p>
                  </Card>
                ) : (
                  filteredConversations.map(conv => (
                    <Card
                      key={conv.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedConversation?.id === conv.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(conv.updated_at), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {conv.messages.length} msgs
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2">
                        {getSummary(conv.messages)}
                      </p>
                      {conv.context.page && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {conv.context.page}
                        </Badge>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detalhes da Conversa */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Conversa Completa</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedConversation.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation(selectedConversation)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteConversation(selectedConversation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {format(new Date(msg.timestamp), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa na lista para ver os detalhes
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
