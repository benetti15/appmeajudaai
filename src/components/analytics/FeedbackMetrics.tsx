import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeedbackMetricsProps {
  satisfactionRate: number;
  totalFeedbacks: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  trend?: 'up' | 'down' | 'stable';
}

export function FeedbackMetrics({
  satisfactionRate,
  totalFeedbacks,
  positiveFeedbacks,
  negativeFeedbacks,
  trend = 'stable'
}: FeedbackMetricsProps) {
  const getEmoji = () => {
    if (satisfactionRate >= 80) return '😊';
    if (satisfactionRate >= 60) return '😐';
    return '😞';
  };

  const getSatisfactionColor = () => {
    if (satisfactionRate >= 80) return 'text-green-600';
    if (satisfactionRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const showAlert = satisfactionRate < 80;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Satisfação</CardTitle>
          <span className="text-2xl">{getEmoji()}</span>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getSatisfactionColor()}`}>
            {satisfactionRate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 mt-2">
            {trend === 'up' && (
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Melhorando
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                Em queda
              </div>
            )}
            {showAlert && (
              <Badge variant="destructive" className="text-xs">
                Atenção necessária
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFeedbacks}</div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <ThumbsUp className="h-3 w-3" />
              {positiveFeedbacks}
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <ThumbsDown className="h-3 w-3" />
              {negativeFeedbacks}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
