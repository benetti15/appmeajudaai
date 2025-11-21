import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VoiceInput } from './VoiceInput';
import { Badge } from '@/components/ui/badge';
import { ImageUploadArea } from './ImageUploadArea';
import { UploadedImage } from '@/hooks/useImageUpload';
import { FeedbackButtons } from './FeedbackButtons';
import { Button } from '@/components/ui/button';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image_url?: string;
  suggested_actions?: Array<{ label: string; action: string }>;
  metadata?: {
    photo_analysis?: any;
    step?: number;
    total_steps?: number;
    answers?: any[];
    request_created?: boolean;
    request_id?: string;
  };
}

export function AIAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mode, setMode] = useState<'chat' | 'assisted'>('chat');
  const [attachedImages, setAttachedImages] = useState<UploadedImage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoFlowStep, setPhotoFlowStep] = useState(0);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Usar React Query para carregar conversação com cache
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['ai-conversation', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && isOpen,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  useEffect(() => {
    if (conversation) {
      setConversationId(conversation.id);
      const msgs = conversation.messages as any[];
      if (Array.isArray(msgs)) {
        setMessages(msgs.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          image_url: msg.image_url,
          suggested_actions: msg.suggested_actions
        })));
      }
    } else if (isOpen && user && !isLoadingConversation) {
      // Primeira vez - mensagem de boas-vindas
      const welcomeMessage: AIMessage = {
        role: 'assistant',
        content: `Olá! 👋 Sou o Toninho, seu assistente inteligente do Me Ajuda ai! 💚

✨ **NOVO:** Agora você pode criar pedidos por foto! 📸
Basta clicar no ícone 📷 e enviar uma foto do problema.

Posso te ajudar a:
${profile?.user_type === 'client' 
  ? `• 📸 Criar solicitações por foto em 30 segundos
• 📝 Criar solicitações de serviço rapidamente
• 💰 Comparar e entender orçamentos
• 📊 Acompanhar o status dos seus pedidos
• ❓ Tirar dúvidas sobre o processo`
  : `• 💼 Criar orçamentos profissionais
• 💵 Sugerir preços justos para serviços
• 📈 Gerenciar seus atendimentos
• 🎯 Otimizar sua rotina de trabalho`}

Como posso te ajudar hoje?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      setUnreadCount(0);
    }
  }, [conversation, isOpen, user, isLoadingConversation, profile?.user_type]);
  
  const getContext = () => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    
    return {
      page: path,
      user_type: profile?.user_type || 'client',
      current_request_id: path.includes('/service-request/') 
        ? path.split('/').pop() 
        : null,
      category_filter: params.get('category'),
      timestamp: new Date().toISOString()
    };
  };
  
  const saveConversation = async (messagesToSave: AIMessage[]) => {
    if (!user) return;
    
    try {
      const context = getContext();
      
      // Verificar se já existe uma conversa para este usuário
      const { data: existing } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const conversationData = {
        user_id: user.id,
        messages: messagesToSave as any[],
        context: context as any,
        metadata: {
          message_count: messagesToSave.length,
          last_topic: messagesToSave[messagesToSave.length - 1]?.content.slice(0, 50)
        } as any,
        updated_at: new Date().toISOString()
      };
      
      if (existing) {
        // Atualizar conversa existente
        await supabase
          .from('ai_conversations')
          .update(conversationData)
          .eq('id', existing.id);
      } else {
        // Criar nova conversa
        await supabase
          .from('ai_conversations')
          .insert([{
            ...conversationData,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };
  
  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    // Auto-send after voice input
    setTimeout(() => {
      if (transcript) {
        handleSend();
      }
    }, 500);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return;
    
    // Preparar URLs de imagens anexadas
    const image_urls = attachedImages.map(img => img.url);
    
    const userMessage: AIMessage = {
      role: 'user',
      content: input.trim() || (image_urls.length > 0 ? '📸 [Foto enviada]' : ''),
      timestamp: new Date().toISOString(),
      image_url: image_urls[0] // Mostrar primeira imagem no chat
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    const imageUrls = attachedImages.map(img => img.url);
    setInput('');
    setAttachedImages([]);
    setShowImageUpload(false);
    setIsLoading(true);
    setIsTyping(true);
    
    // Se enviou foto, marcar como analisando
    if (image_urls.length > 0) {
      setIsAnalyzingPhoto(true);
    }
    
    try {
      // Incluir metadata do último assistant message se existir
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
      const context = {
        ...getContext(),
        ...(lastAssistantMsg?.metadata || {})
      };
      
      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: {
          message: userMessage.content || 'Analisar imagem',
          context,
          image_urls: imageUrls
        }
      });
      
      if (error) throw error;
      
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        suggested_actions: data.suggested_actions,
        metadata: data.metadata
      };
      
      // Atualizar step do fluxo de foto se existir
      if (data.metadata?.step) {
        setPhotoFlowStep(data.metadata.step);
      }
      
      // Se request foi criado, resetar fluxo e mostrar toast
      if (data.metadata?.request_created) {
        setPhotoFlowStep(0);
        toast({
          title: '✅ Solicitação Criada!',
          description: `Pedido #${data.metadata.request_id.substring(0, 8)} criado com sucesso!`,
          duration: 5000
        });
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Salvar conversa no banco
      await saveConversation([...messages, userMessage, assistantMessage]);
      
      if (data.tool_calls_executed) {
        toast({
          title: 'Ação executada',
          description: 'O Toninho realizou uma ação para você!',
        });
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 😅',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a mensagem',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsAnalyzingPhoto(false);
    }
  };
  
  const handleQuickAction = async (action: string) => {
    // Verificar se é navegação
    if (action.startsWith('navigate:')) {
      const path = action.replace('navigate:', '');
      navigate(path);
      setIsOpen(false);
      return;
    }
    
    // Ações existentes
    const actionMessages: Record<string, string> = {
      'create_request': 'Quero criar uma nova solicitação',
      'list_budgets': 'Mostre meus orçamentos',
      'my_requests': 'Quero ver minhas solicitações',
      'help': 'Preciso de ajuda'
    };
    
    const message = actionMessages[action] || action;
    setInput(message);
    setTimeout(() => handleSend(), 100);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!user) return null;
  
  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full 
                   bg-gradient-to-r from-primary to-accent shadow-2xl
                   hover:scale-110 transition-transform duration-300
                   flex items-center justify-center group animate-pulse-slow"
        aria-label="Abrir assistente IA"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
        <Bot className="w-8 h-8 text-white" />
        <Sparkles className="w-4 h-4 text-white/80 absolute top-0 right-0 animate-pulse" />
      </button>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] 
                       bg-background rounded-2xl shadow-2xl border border-border
                       flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 
                         flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 
                             flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Toninho IA 💚</h3>
                <p className="text-white/80 text-xs">Seu assistente Me Ajuda ai</p>
              </div>
              <button
                onClick={() => navigate('/toninho-history')}
                className="text-white/80 hover:text-white text-xs underline transition-colors"
              >
                Ver Histórico
              </button>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1 rounded transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg} 
                onAction={handleQuickAction}
                messageIndex={idx}
                conversationId={conversationId}
              />
            ))}
            
            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          {/* Input Area */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Progress indicator durante fluxo de foto */}
            {photoFlowStep > 0 && photoFlowStep < 5 && (
              <div className="px-4 py-2 rounded-lg bg-primary/10">
                <div className="flex items-center justify-between text-xs text-primary font-medium mb-1">
                  <span>Pergunta {photoFlowStep} de 4</span>
                  <span>{Math.round((photoFlowStep / 4) * 100)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(photoFlowStep / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Indicador de análise de foto */}
            {isAnalyzingPhoto && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg animate-pulse">
                <Camera className="w-4 h-4 text-primary animate-bounce" />
                <span className="text-sm text-primary font-medium">
                  Analisando sua foto...
                </span>
              </div>
            )}

            {/* Preview de imagens anexadas */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Anexo ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Image upload area (toggle) */}
            {showImageUpload && (
              <ImageUploadArea
                onImagesChange={setAttachedImages}
                className="border-t border-border pt-3"
              />
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={attachedImages.length > 0 ? "Adicione uma mensagem (opcional)..." : "Digite sua mensagem..."}
                className="flex-1 min-h-[40px] max-h-[120px] p-2 
                         border border-border rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary/20
                         bg-background text-foreground"
                rows={1}
                disabled={isLoading}
              />
              
              {/* Botão de câmera/foto */}
              <Button
                type="button"
                variant={attachedImages.length > 0 ? "default" : "outline"}
                size="icon"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isLoading}
                className="shrink-0"
              >
                {attachedImages.length > 0 ? (
                  <ImageIcon className="w-5 h-5" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </Button>

              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                className="p-2 bg-primary hover:bg-primary/90 
                         rounded-lg disabled:opacity-50 transition-colors
                         flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Pressione Enter para enviar • 📷 Enviar foto
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ 
  message, 
  onAction,
  messageIndex,
  conversationId
}: { 
  message: AIMessage; 
  onAction: (action: string) => void;
  messageIndex: number;
  conversationId: string | null;
}) {
  const isUser = message.role === 'user';
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
        isUser 
          ? 'bg-primary text-primary-foreground rounded-br-none' 
          : 'bg-muted text-foreground rounded-bl-none'
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {message.image_url && (
          <img 
            src={message.image_url} 
            className="mt-2 rounded-lg max-w-full"
            alt="Anexo" 
          />
        )}
        
        {message.suggested_actions && message.suggested_actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.suggested_actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onAction(action.action)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isUser 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-primary/10 hover:bg-primary/20'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs opacity-70">
            {formatTime(message.timestamp)}
          </span>
          
          {/* Feedback buttons apenas para mensagens do assistente */}
          {!isUser && conversationId && (
            <FeedbackButtons 
              conversationId={conversationId}
              messageIndex={messageIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
               style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
               style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" 
               style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
