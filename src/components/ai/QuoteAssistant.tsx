import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, DollarSign, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface QuoteAssistantProps {
  requestDescription: string;
  onSubmit: (quoteData: any) => void;
  onCancel: () => void;
}

export function QuoteAssistant({ requestDescription, onSubmit, onCancel }: QuoteAssistantProps) {
  const [step, setStep] = useState(1);
  const [quoteData, setQuoteData] = useState({
    hasMaterials: false,
    laborCost: '',
    materialCost: '',
    estimatedTime: '',
    description: '',
    totalAmount: 0
  });

  const calculateTotal = () => {
    const labor = parseFloat(quoteData.laborCost) || 0;
    const materials = quoteData.hasMaterials ? (parseFloat(quoteData.materialCost) || 0) : 0;
    return labor + materials;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const total = calculateTotal();
    onSubmit({
      ...quoteData,
      totalAmount: total
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Criar Orçamento com Toninho</h3>
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Step 1: Labor and Time */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Vamos começar com sua mão de obra e tempo estimado. 
              Baseado no problema descrito, recomendo cobrar entre R$ 150-200 e estimar 2-3 horas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labor-cost">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor da Mão de Obra
              </div>
            </Label>
            <Input
              id="labor-cost"
              type="number"
              placeholder="Ex: 180.00"
              value={quoteData.laborCost}
              onChange={(e) => setQuoteData({ ...quoteData, laborCost: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated-time">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo Estimado
              </div>
            </Label>
            <Input
              id="estimated-time"
              placeholder="Ex: 2-3 horas"
              value={quoteData.estimatedTime}
              onChange={(e) => setQuoteData({ ...quoteData, estimatedTime: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Step 2: Materials */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Você vai precisar fornecer materiais para este serviço?
              Isso ajuda o cliente a entender o valor total.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="has-materials" className="cursor-pointer">
              Materiais incluídos no orçamento
            </Label>
            <Switch
              id="has-materials"
              checked={quoteData.hasMaterials}
              onCheckedChange={(checked) => setQuoteData({ ...quoteData, hasMaterials: checked })}
            />
          </div>

          {quoteData.hasMaterials && (
            <div className="space-y-2">
              <Label htmlFor="material-cost">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Custo dos Materiais
                </div>
              </Label>
              <Input
                id="material-cost"
                type="number"
                placeholder="Ex: 50.00"
                value={quoteData.materialCost}
                onChange={(e) => setQuoteData({ ...quoteData, materialCost: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Liste os materiais na descrição do próximo passo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Description and Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Adicione uma descrição profissional do que você vai fazer. 
              Seja claro e detalhado para gerar confiança no cliente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descrição do Serviço
              </div>
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Vou realizar a troca completa do registro, verificar conexões e testar o sistema..."
              value={quoteData.description}
              onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>

          {/* Summary */}
          <Card className="p-4 bg-secondary/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Resumo do Orçamento
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mão de obra:</span>
                <span className="font-semibold">R$ {quoteData.laborCost || '0.00'}</span>
              </div>
              {quoteData.hasMaterials && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materiais:</span>
                  <span className="font-semibold">R$ {quoteData.materialCost || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo:</span>
                <span className="font-semibold">{quoteData.estimatedTime || 'Não informado'}</span>
              </div>
              <div className="h-px bg-border my-2"></div>
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-primary">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={step === 1 ? onCancel : handleBack}
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>

        <Button
          onClick={step === 3 ? handleSubmit : handleNext}
          className="bg-gradient-to-r from-primary to-accent"
          disabled={
            (step === 1 && (!quoteData.laborCost || !quoteData.estimatedTime)) ||
            (step === 2 && quoteData.hasMaterials && !quoteData.materialCost) ||
            (step === 3 && !quoteData.description)
          }
        >
          {step === 3 ? 'Enviar Orçamento' : 'Próximo'}
        </Button>
      </div>
    </Card>
  );
}