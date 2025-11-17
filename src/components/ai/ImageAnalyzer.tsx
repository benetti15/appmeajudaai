import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Upload, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  problem: string;
  severity: 'urgent' | 'moderate' | 'low';
  estimatedCost: string;
  suggestedMaterials: string[];
  recommendations: string;
}

interface ImageAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export function ImageAnalyzer({ onAnalysisComplete }: ImageAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setAnalyzing(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('request-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('request-images')
        .getPublicUrl(fileName);

      // Call AI agent to analyze image
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Analise esta imagem e identifique o problema',
          context: { imageUrl: publicUrl, action: 'analyzeImage' }
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze image');

      const data = await response.json();
      
      // Parse AI response (this is a simplified version)
      const analysisResult: AnalysisResult = {
        problem: data.response || 'Problema detectado na imagem',
        severity: 'moderate',
        estimatedCost: 'R$ 150 - R$ 300',
        suggestedMaterials: ['Material 1', 'Material 2'],
        recommendations: data.response || 'Recomendações baseadas na análise'
      };

      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
      toast.success('Imagem analisada com sucesso!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Erro ao analisar imagem');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Análise Inteligente de Imagem</h3>
        </div>

        {!imagePreview ? (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Envie uma foto do problema para análise automática
            </p>
            <label htmlFor="image-upload">
              <Button asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Imagem
                </span>
              </Button>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={analyzing}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />

            {analyzing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analisando imagem com IA...
                </span>
              </div>
            )}

            {result && !analyzing && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                    result.severity === 'urgent' ? 'text-destructive' :
                    result.severity === 'moderate' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div className="space-y-2">
                    <p className="font-semibold">{result.problem}</p>
                    <p className="text-sm text-muted-foreground">
                      Custo estimado: {result.estimatedCost}
                    </p>
                    <p className="text-sm">{result.recommendations}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImagePreview(null);
                setResult(null);
              }}
            >
              Analisar outra imagem
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}