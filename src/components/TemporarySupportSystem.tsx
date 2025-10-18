import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TemporarySupportProps {
  requestId?: string;
  requestTitle?: string;
  currentStatus?: string;
}

// Using chat_messages as temporary support system
export function TemporarySupportSystem({ requestId, requestTitle, currentStatus }: TemporarySupportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [open, setOpen] = useState(false);

  // Pre-fill context based on request
  const contextInfo = requestId ? {
    'Serviço ID': requestId,
    'Título do Serviço': requestTitle || 'N/A',
    'Status Atual': currentStatus || 'N/A',
    'Usuário': user?.email || 'N/A'
  } : {};

  const handleSubmitSupport = async () => {
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto e a descrição.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a support message using the chat system temporarily
      const supportMessage = {
        message: `[SUPORTE - ${priority.toUpperCase()}] ${subject}\n\n${description}\n\n--- CONTEXTO AUTOMÁTICO ---\n${Object.entries(contextInfo).map(([key, value]) => `${key}: ${value}`).join('\n')}`,
        request_id: requestId || 'general-support',
        sender_id: user?.id
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          ...supportMessage,
          receiver_id: '', // Will be filled by trigger
        });

      if (error) throw error;

      // Also create a notification for admins
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          title: `Solicitação de Suporte: ${subject}`,
          message: `Nova solicitação de suporte com prioridade ${priority}`,
          type: 'support_request',
          related_id: requestId
        });

      if (notificationError) {
        console.warn('Failed to create notification:', notificationError);
      }

      toast({
        title: "Suporte contactado!",
        description: "Sua solicitação foi enviada. Nossa equipe entrará em contato em breve.",
      });

      // Reset form
      setSubject("");
      setDescription("");
      setPriority('medium');
      setOpen(false);

    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Erro ao contactar suporte",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          size="sm"
        >
          <AlertTriangle className="w-4 h-4" />
          Contactar Suporte
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            Contactar Suporte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context Information */}
          {Object.keys(contextInfo).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Contexto Automático
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                {Object.entries(contextInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor('low')}>Baixa</Badge>
                    <span>Questão geral</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor('medium')}>Média</Badge>
                    <span>Preciso de ajuda</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor('high')}>Alta</Badge>
                    <span>Problema importante</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor('urgent')}>Urgente</Badge>
                    <span>Problema crítico</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva brevemente o problema"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição detalhada *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema em detalhes. Inclua o que aconteceu, quando aconteceu, e o que você estava tentando fazer."
              rows={4}
              required
            />
          </div>

          {/* Response Time Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Tempo de Resposta Esperado</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <div>• Baixa/Média: até 24h</div>
              <div>• Alta: até 4h</div>
              <div>• Urgente: até 1h</div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitSupport}
              disabled={loading || !subject.trim() || !description.trim()}
              className="flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}