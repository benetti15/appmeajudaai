import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackButtonsProps {
  conversationId: string;
  messageIndex: number;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ 
  conversationId, 
  messageIndex 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (newRating: 'positive' | 'negative') => {
    if (!user) return;

    // Se já votou igual, não faz nada
    if (rating === newRating) return;

    setRating(newRating);

    // Se for negativo, abre modal para comentário
    if (newRating === 'negative') {
      setShowFeedbackModal(true);
      return;
    }

    // Se for positivo, salva direto
    try {
      const { error } = await supabase
        .from('ai_feedback')
        .upsert({
          user_id: user.id,
          conversation_id: conversationId,
          message_index: messageIndex,
          rating: newRating,
        }, {
          onConflict: 'user_id,conversation_id,message_index'
        });

      if (error) throw error;
      toast.success('Obrigado pelo feedback!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Erro ao salvar feedback');
      setRating(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ai_feedback')
        .upsert({
          user_id: user.id,
          conversation_id: conversationId,
          message_index: messageIndex,
          rating: 'negative',
          comment: comment.trim() || null,
        }, {
          onConflict: 'user_id,conversation_id,message_index'
        });

      if (error) throw error;
      
      toast.success('Obrigado pelo feedback detalhado!');
      setShowFeedbackModal(false);
      setComment('');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Erro ao salvar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex gap-1 mt-2" role="group" aria-label="Avaliar resposta">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('positive')}
          className={rating === 'positive' ? 'text-primary' : 'text-muted-foreground'}
          aria-label="Resposta útil"
          aria-pressed={rating === 'positive'}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('negative')}
          className={rating === 'negative' ? 'text-destructive' : 'text-muted-foreground'}
          aria-label="Resposta não útil"
          aria-pressed={rating === 'negative'}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nos ajude a melhorar</DialogTitle>
            <DialogDescription>
              O que poderia ter sido melhor nesta resposta?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Opcional: Compartilhe mais detalhes sobre o problema..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
            aria-label="Comentário sobre o feedback"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackModal(false);
                setComment('');
              }}
              disabled={isSubmitting}
            >
              Pular
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
