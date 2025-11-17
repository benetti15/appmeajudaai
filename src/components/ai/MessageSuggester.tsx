import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Send } from 'lucide-react';

interface MessageSuggesterProps {
  context: 'greeting' | 'followup' | 'confirm' | 'thank';
  onSelectMessage: (message: string) => void;
}

export function MessageSuggester({ context, onSelectMessage }: MessageSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = {
    greeting: [
      "Olá! Vi seu orçamento e gostaria de conversar sobre os detalhes.",
      "Oi, tudo bem? Tenho algumas dúvidas sobre o serviço.",
      "Bom dia! Pode me dar mais informações sobre o trabalho?"
    ],
    followup: [
      "Você poderia me atualizar sobre o andamento do serviço?",
      "Como está progredindo o trabalho? Há previsão de conclusão?",
      "Gostaria de saber se está tudo correndo conforme o planejado."
    ],
    confirm: [
      "Perfeito! Pode começar o serviço conforme combinado.",
      "Confirmado! Estarei disponível no horário agendado.",
      "Tudo certo! Aguardo você no endereço combinado."
    ],
    thank: [
      "Muito obrigado pelo excelente trabalho! Ficou perfeito.",
      "Agradeço pela dedicação e capricho. Recomendarei seu trabalho!",
      "Obrigado! O serviço superou minhas expectativas."
    ]
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Toninho sugere
      </Button>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Sugestões do Toninho</span>
      </div>

      <div className="space-y-2">
        {suggestions[context].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              onSelectMessage(suggestion);
              setIsOpen(false);
            }}
            className="w-full text-left p-3 text-sm rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(false)}
        className="w-full"
      >
        Fechar
      </Button>
    </Card>
  );
}