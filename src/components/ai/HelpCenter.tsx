import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  FileText, 
  Video,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HelpCenterProps {
  currentPage?: string;
}

export function HelpCenter({ currentPage }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);

  const faqs = [
    {
      category: 'Geral',
      questions: [
        {
          q: 'Como criar um pedido de serviço?',
          a: 'Clique em "Novo Pedido", descreva o problema e adicione fotos. O Toninho pode te ajudar com isso!'
        },
        {
          q: 'Como funcionam os orçamentos?',
          a: 'Profissionais enviam orçamentos para seu pedido. Você pode comparar e escolher o melhor.'
        }
      ]
    },
    {
      category: 'Para Profissionais',
      questions: [
        {
          q: 'Como enviar um orçamento?',
          a: 'Veja os pedidos disponíveis, analise e clique em "Enviar Orçamento". O Toninho pode te ajudar a criar um orçamento competitivo!'
        },
        {
          q: 'Como aumentar minhas chances de aceitação?',
          a: 'Responda rápido, seja detalhado na descrição e use o Toninho para analisar o pedido antes de enviar seu orçamento.'
        }
      ]
    },
    {
      category: 'Para Clientes',
      questions: [
        {
          q: 'Como escolher o melhor profissional?',
          a: 'Compare orçamentos, avaliações e tempo estimado. O Toninho pode fazer uma análise comparativa para você!'
        },
        {
          q: 'Posso negociar o preço?',
          a: 'Sim! Você pode enviar uma contra-proposta ou pedir para o Toninho negociar por você.'
        }
      ]
    }
  ];

  const contextualHelp = {
    'new-request': {
      title: 'Ajuda: Criação de Pedidos',
      tips: [
        'Seja específico na descrição do problema',
        'Adicione fotos para profissionais entenderem melhor',
        'Indique a urgência corretamente',
        'Use o Toninho para criação assistida'
      ]
    },
    'available-requests': {
      title: 'Ajuda: Pedidos Disponíveis',
      tips: [
        'Peça ao Toninho para analisar o pedido',
        'Responda rápido para ter vantagem',
        'Use o assistente de orçamentos do Toninho',
        'Seja detalhado nas suas propostas'
      ]
    }
  };

  const currentContextHelp = currentPage && contextualHelp[currentPage as keyof typeof contextualHelp];

  if (showChat) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Pergunte ao Toninho</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          O chat com o Toninho está disponível no canto inferior direito da tela!
        </p>
        <Button onClick={() => setShowChat(false)}>
          Entendi
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Central de Ajuda</h2>
            <p className="text-sm text-muted-foreground">
              Como podemos ajudar você hoje?
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ajuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col items-center p-4 gap-2"
            onClick={() => setShowChat(true)}
          >
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-sm">Falar com Toninho</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-center p-4 gap-2"
          >
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm">Tutoriais</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-center p-4 gap-2"
          >
            <Video className="w-5 h-5 text-primary" />
            <span className="text-sm">Vídeos</span>
          </Button>
        </div>

        {/* Contextual Help */}
        {currentContextHelp && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-3">{currentContextHelp.title}</h3>
            <ul className="space-y-2">
              {currentContextHelp.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* FAQs */}
        <div>
          <h3 className="font-semibold mb-3">Perguntas Frequentes</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((category, catIndex) => (
              <div key={catIndex} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{category.category}</h4>
                {category.questions.map((faq, qIndex) => (
                  <AccordionItem key={qIndex} value={`${catIndex}-${qIndex}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        </div>
      </div>
    </Card>
  );
}