import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedbackItem {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
}

interface RecentFeedbackProps {
  feedbacks: FeedbackItem[];
}

export function RecentFeedback({ feedbacks }: RecentFeedbackProps) {
  const isUrgent = (comment: string) => {
    const urgentKeywords = ['bug', 'erro', 'não funciona', 'quebrado', 'problema grave', 'urgente'];
    return urgentKeywords.some(keyword => comment.toLowerCase().includes(keyword));
  };

  if (feedbacks.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Negativo Recente
          </CardTitle>
          <CardDescription>
            Últimos comentários negativos dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum feedback negativo no período selecionado</p>
            <p className="text-sm mt-1">Continue o bom trabalho! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Negativo Recente
        </CardTitle>
        <CardDescription>
          Últimos {feedbacks.length} comentários negativos - Priorize os marcados como urgentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    {isUrgent(feedback.comment) && (
                      <Badge variant="destructive" className="text-xs">
                        Urgente
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{feedback.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
