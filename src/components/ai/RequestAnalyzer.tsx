import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, MapPin, DollarSign, Clock, Star } from 'lucide-react';

interface RequestAnalysis {
  suitabilityScore: number;
  reasoning: string;
  estimatedTime: string;
  suggestedPrice: string;
  difficulty: 'easy' | 'medium' | 'hard';
  competitiveness: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
}

interface RequestAnalyzerProps {
  requestId: string;
  requestTitle: string;
  requestDescription: string;
  distance?: number;
  onCreateQuote?: () => void;
}

export function RequestAnalyzer({
  requestTitle,
  requestDescription,
  distance,
  onCreateQuote
}: RequestAnalyzerProps) {
  // Mock analysis - in real implementation, this would call the AI
  const analysis: RequestAnalysis = {
    suitabilityScore: 85,
    reasoning: 'Este pedido é ideal para você baseado em sua especialidade e localização',
    estimatedTime: '2-3 horas',
    suggestedPrice: 'R$ 180 - R$ 250',
    difficulty: 'medium',
    competitiveness: 'medium',
    pros: [
      'Está dentro da sua área de especialidade',
      'Localização próxima (economia em deslocamento)',
      'Cliente tem histórico de avaliações positivas'
    ],
    cons: [
      'Pode precisar de material específico',
      'Horário solicitado é em horário de pico'
    ]
  };

  const scoreColor = analysis.suitabilityScore >= 80 ? 'text-green-600' :
                     analysis.suitabilityScore >= 60 ? 'text-yellow-600' :
                     'text-red-600';

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Análise do Toninho</h3>
          <p className="text-sm text-muted-foreground">{requestTitle}</p>
        </div>
      </div>

      {/* Suitability Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Compatibilidade</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {analysis.suitabilityScore}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${analysis.suitabilityScore}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Tempo estimado</span>
          </div>
          <p className="font-semibold">{analysis.estimatedTime}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span>Preço sugerido</span>
          </div>
          <p className="font-semibold">{analysis.suggestedPrice}</p>
        </div>

        {distance && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Distância</span>
            </div>
            <p className="font-semibold">{distance.toFixed(1)} km</p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Dificuldade</span>
          </div>
          <Badge variant={
            analysis.difficulty === 'easy' ? 'default' :
            analysis.difficulty === 'medium' ? 'secondary' : 'destructive'
          }>
            {analysis.difficulty === 'easy' ? 'Fácil' :
             analysis.difficulty === 'medium' ? 'Médio' : 'Difícil'}
          </Badge>
        </div>
      </div>

      {/* Pros and Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">
            Pontos Positivos
          </h4>
          <ul className="space-y-1">
            {analysis.pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Star className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            Pontos de Atenção
          </h4>
          <ul className="space-y-1">
            {analysis.cons.map((con, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400 flex-shrink-0">⚠️</span>
                <span className="text-muted-foreground">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      {onCreateQuote && (
        <Button 
          onClick={onCreateQuote}
          className="w-full bg-gradient-to-r from-primary to-accent"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Criar Orçamento com Toninho
        </Button>
      )}
    </Card>
  );
}