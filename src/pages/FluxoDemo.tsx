import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusFlow, ExtendedServiceStatus } from "@/components/service-system/ServiceStatusFlow";

import { MutualConfirmation } from "@/components/service-system/MutualConfirmation";
import { ArrivalEstimator } from "@/components/service-system/ArrivalEstimator";
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DEMO_STEPS: ExtendedServiceStatus[] = [
  'pending',
  'quoted', 
  'accepted',
  'on_way',
  'arrived',
  'in_progress',
  'awaiting_client_confirmation',
  'payment_confirmed',
  'completed'
];

export default function FluxoDemo() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [userRole, setUserRole] = useState<'client' | 'professional'>('client');
  const [isPlaying, setIsPlaying] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);

  const currentStatus = DEMO_STEPS[currentStep];

  // Auto-play functionality
  const startAutoPlay = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentStep(current => {
        if (current >= DEMO_STEPS.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 2000);

    // Stop after completing cycle
    setTimeout(() => {
      setIsPlaying(false);
      clearInterval(interval);
    }, DEMO_STEPS.length * 2000);
  };

  const nextStep = () => {
    setCurrentStep(Math.min(currentStep + 1, DEMO_STEPS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setEstimatedArrival(null);
  };

  const handleProfessionalComplete = (notes?: string) => {
    toast.success("Demo: Profissional marcou como concluído!");
    console.log('Demo completion notes:', notes);
  };

  const handleClientConfirm = () => {
    toast.success("Demo: Cliente confirmou conclusão!");
    nextStep();
  };

  const handlePaymentConfirm = () => {
    toast.success("Demo: Pagamento confirmado!");
    nextStep();
  };

  const handleEstimateSet = (minutes: number) => {
    setEstimatedArrival(minutes);
    toast.success(`Demo: Estimativa definida - ${minutes} minutos`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Demo do Fluxo Avançado
              </h1>
              <p className="text-sm text-muted-foreground">
                Demonstração interativa do novo sistema de atendimento
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Controles da Demonstração</span>
              <Badge variant="outline" className="animate-pulse">
                {currentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button 
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                >
                  ← Anterior
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={currentStep === DEMO_STEPS.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Próximo →
                </Button>
              </div>

              <Button 
                onClick={isPlaying ? () => setIsPlaying(false) : startAutoPlay}
                disabled={currentStep === DEMO_STEPS.length - 1}
                className="gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pausar' : 'Auto-Play'}
              </Button>

              <Button onClick={resetDemo} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reiniciar
              </Button>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setUserRole('client')}
                  variant={userRole === 'client' ? 'default' : 'outline'}
                  size="sm"
                >
                  Visão Cliente
                </Button>
                <Button 
                  onClick={() => setUserRole('professional')}
                  variant={userRole === 'professional' ? 'default' : 'outline'}
                  size="sm"
                >
                  Visão Profissional
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progresso</span>
                <span>{currentStep + 1} / {DEMO_STEPS.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status Flow */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceStatusFlow 
                  currentStatus={currentStatus}
                  showDescription={true}
                  showProgress={true}
                />
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Interactive Components */}
          <div className="space-y-6">
            {/* Arrival Estimator Demo */}
            {(currentStatus === 'accepted' || currentStatus === 'on_way') && (
              <Card>
                <CardHeader>
                  <CardTitle>Estimativa de Chegada</CardTitle>
                </CardHeader>
                <CardContent>
                  <ArrivalEstimator
                    onEstimateSet={handleEstimateSet}
                    currentEstimate={estimatedArrival || undefined}
                    showEstimate={currentStatus === 'on_way' || !!estimatedArrival}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mutual Confirmation Demo */}
            {(['in_progress', 'awaiting_client_confirmation', 'payment_confirmed'].includes(currentStatus)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Sistema de Confirmação</CardTitle>
                </CardHeader>
                <CardContent>
                  <MutualConfirmation
                    userRole={userRole}
                    currentStatus={currentStatus}
                    onProfessionalComplete={handleProfessionalComplete}
                    onClientConfirm={handleClientConfirm}
                    onPaymentConfirm={handlePaymentConfirm}
                    professionalName="João Silva (Demo)"
                    clientName="Maria Santos (Demo)"
                    serviceAmount={150}
                    loading={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Feature Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Status Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStatus === 'pending' && (
                    <div className="text-sm">
                      • Solicitação publicada<br/>
                      • Profissionais podem enviar orçamentos<br/>
                      • Cliente recebe notificações
                    </div>
                  )}
                  {currentStatus === 'quoted' && (
                    <div className="text-sm">
                      • Orçamentos recebidos<br/>
                      • Cliente pode comparar propostas<br/>
                      • Sistema de aceite automático
                    </div>
                  )}
                  {currentStatus === 'accepted' && (
                    <div className="text-sm">
                      • Profissional pode definir estimativa<br/>
                      • Sistema de notificações ativo<br/>
                      • Chat direto disponível
                    </div>
                  )}
                  {currentStatus === 'on_way' && (
                    <div className="text-sm">
                      • Estimativa de chegada em tempo real<br/>
                      • Cliente acompanha localização<br/>
                      • Atualizações automáticas
                    </div>
                  )}
                  {currentStatus === 'arrived' && (
                    <div className="text-sm">
                      • Confirmação de chegada<br/>
                      • Início iminente do serviço<br/>
                      • Timeline atualizada
                    </div>
                  )}
                  {currentStatus === 'in_progress' && (
                    <div className="text-sm">
                      • Serviço em execução<br/>
                      • Monitoramento de progresso<br/>
                      • Comunicação direta
                    </div>
                  )}
                  {currentStatus === 'awaiting_client_confirmation' && (
                    <div className="text-sm">
                      • Confirmação mútua<br/>
                      • Proteção contra disputas<br/>
                      • Processo transparente
                    </div>
                  )}
                  {currentStatus === 'payment_confirmed' && (
                    <div className="text-sm">
                      • Pagamento registrado<br/>
                      • Finalização automática<br/>
                      • Sistema de avaliações
                    </div>
                  )}
                  {currentStatus === 'completed' && (
                    <div className="text-sm">
                      • Serviço concluído com sucesso<br/>
                      • Sistema de avaliações ativo<br/>
                      • Histórico completo disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Box */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">
                💡 Esta é uma demonstração interativa
              </h3>
              <p className="text-sm text-blue-700">
                Todos os componentes estão funcionando em modo demo. Use os controles para navegar 
                pelos diferentes estados do fluxo e alternar entre as visões de cliente e profissional.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}