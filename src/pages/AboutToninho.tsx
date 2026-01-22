import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  MessageSquare, 
  Image, 
  TrendingUp, 
  Shield, 
  Zap,
  Brain,
  Heart,
  Users,
  CheckCircle2,
  Camera
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AboutToninho() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Assistente Conversacional",
      description: "Converse naturalmente e receba ajuda em qualquer etapa do processo"
    },
    {
      icon: Image,
      title: "Análise de Imagens",
      description: "Envie fotos e receba diagnóstico automático de problemas e estimativas"
    },
    {
      icon: Brain,
      title: "Inteligência Preditiva",
      description: "Previsões de demanda, sugestões de preços e otimização de rotas"
    },
    {
      icon: TrendingUp,
      title: "Insights de Negócio",
      description: "Análises de performance e recomendações personalizadas"
    },
    {
      icon: Shield,
      title: "Segurança e Confiança",
      description: "Moderação de conteúdo e detecção de fraudes em tempo real"
    },
    {
      icon: Zap,
      title: "Respostas Rápidas",
      description: "Assistência instantânea 24/7 em todas as suas dúvidas"
    }
  ];

  const capabilities = [
    {
      title: "Para Clientes",
      items: [
        "📸 Criação de pedidos por foto em 30 segundos",
        "Criação assistida de pedidos de serviço",
        "Comparação inteligente de orçamentos",
        "Negociação automática com profissionais",
        "Sugestões de mensagens no chat",
        "Alertas proativos sobre o serviço"
      ]
    },
    {
      title: "Para Profissionais",
      items: [
        "Recomendação de pedidos ideais para você",
        "Assistente de criação de orçamentos",
        "Análise de competitividade de preços",
        "Previsão de demanda e oportunidades",
        "Insights sobre seu desempenho",
        "Otimização de rotas e agenda"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <AppHeader showLogo={true} />
      
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Conheça o Toninho
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seu assistente inteligente que resolve em segundos o que levaria minutos. 
            Direto, eficiente e sempre disponível. É como ter um amigo expert em serviços no bolso! 💚
          </p>
        </div>

        {/* What is Toninho */}
        <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Quem é o Toninho?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Toninho é um assistente virtual inteligente que utiliza tecnologia de IA avançada 
                para tornar sua experiência no ServiçoJá mais simples, rápida e eficiente. 
                Ele está disponível 24 horas por dia, 7 dias por semana, pronto para ajudar em 
                qualquer situação - desde criar um pedido de serviço até escolher o melhor 
                profissional ou negociar orçamentos.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Com aprendizado contínuo, o Toninho fica cada vez mais inteligente e personalizado 
                para suas necessidades específicas, lembrando suas preferências e otimizando 
                sugestões ao longo do tempo.
              </p>
            </div>
          </div>
        </Card>

        {/* Jeito Toninho de Ser */}
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/20">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Jeito Toninho de Ser</h3>
          </div>
          
          <div className="space-y-3 text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span><strong>Direto ao ponto:</strong> Respostas curtas e objetivas, sem enrolação</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span><strong>Brasileiro raiz:</strong> Linguagem informal mas profissional</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span><strong>Proativo:</strong> Antecipa suas necessidades e sugere próximos passos</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span><strong>Eficiente:</strong> Resolve problemas rápido, sem precisar de 10 confirmações</span>
            </p>
          </div>
        </Card>

        {/* DESTAQUE: Criação por Foto */}
        <Card className="p-8 border-4 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl" />
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <div>
                <Badge className="mb-2 bg-gradient-to-r from-primary to-accent text-white">
                  🔥 Novidade!
                </Badge>
                <h2 className="text-3xl font-bold">Crie Pedidos por Foto</h2>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              A maneira mais rápida e fácil de pedir um serviço! Tire uma foto do problema e o Toninho 
              faz todo o trabalho para você.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold">📸 Tire a Foto</h3>
                <p className="text-sm text-muted-foreground">
                  Abra o chat do Toninho e envie uma foto do problema
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold">🤖 IA Analisa</h3>
                <p className="text-sm text-muted-foreground">
                  Detecta problema, categoria e urgência automaticamente
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold">💬 Responda</h3>
                <p className="text-sm text-muted-foreground">
                  Toninho faz 3-4 perguntas rápidas para entender melhor
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="font-semibold">✅ Pronto!</h3>
                <p className="text-sm text-muted-foreground">
                  Pedido criado e profissionais já podem enviar orçamentos
                </p>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                O que o Toninho detecta automaticamente:
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Tipo de problema
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Categoria do serviço
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Nível de urgência
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Estimativa de custo
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Materiais necessários
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Perguntas contextuais
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const toninhoButton = document.querySelector('[aria-label="Abrir assistente IA"]') as HTMLElement;
                    toninhoButton?.click();
                  }, 500);
                }}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8"
              >
                <Camera className="w-5 h-5 mr-2" />
                Experimentar Agora
              </Button>
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">
            O que o Toninho pode fazer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold mt-1">{capability.title}</h3>
              </div>
              <ul className="space-y-3">
                {capability.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="p-8 bg-gradient-to-br from-secondary/30 to-background">
          <h2 className="text-2xl font-bold mb-6 text-center">Como funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Converse Naturalmente</h3>
              <p className="text-sm text-muted-foreground">
                Fale com o Toninho como falaria com um amigo. Sem formulários complicados.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">Receba Recomendações</h3>
              <p className="text-sm text-muted-foreground">
                O Toninho analisa sua situação e oferece sugestões personalizadas.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">Execute Ações</h3>
              <p className="text-sm text-muted-foreground">
                O Toninho pode executar tarefas automaticamente ou guiá-lo passo a passo.
              </p>
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Privacidade e Segurança</h3>
              <p className="text-sm text-muted-foreground">
                Suas conversas com o Toninho são privadas e seguras. Todos os dados são 
                criptografados e utilizados apenas para melhorar sua experiência. Você tem 
                controle total sobre suas informações e pode deletar seu histórico a qualquer momento.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4 pb-8">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="text-muted-foreground">
            O Toninho está esperando para ajudar você agora mesmo!
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Falar com o Toninho
          </Button>
        </div>
      </div>
    </div>
  );
}