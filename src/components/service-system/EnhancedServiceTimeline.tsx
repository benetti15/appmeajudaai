import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, Clock, Car, MapPin, Play, CreditCard, Star, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceStatus, ExtendedServiceStatus, SERVICE_STATUS_CONFIG } from "./ServiceStatusFlow";

interface TimelineEvent {
  id: string;
  status: ExtendedServiceStatus;
  timestamp: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isEstimated: boolean;
  details?: string;
  user?: {
    name: string;
    role: 'client' | 'professional';
  };
}

interface EnhancedServiceTimelineProps {
  requestId: string;
  currentStatus: ExtendedServiceStatus;
  events?: TimelineEvent[];
  userRole: 'client' | 'professional';
}

export function EnhancedServiceTimeline({ 
  requestId, 
  currentStatus, 
  events = [],
  userRole
}: EnhancedServiceTimelineProps) {
  // Auto-expand only: current, previous, and next steps
  const statusOrder: ExtendedServiceStatus[] = [
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

  const currentIndex = statusOrder.indexOf(currentStatus);

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    const generatedEvents = generateTimelineEvents();
    
    if (currentIndex > 0 && generatedEvents[currentIndex - 1]) {
      initialExpanded.add(generatedEvents[currentIndex - 1].id);
    }
    if (generatedEvents[currentIndex]) {
      initialExpanded.add(generatedEvents[currentIndex].id);
    }
    if (currentIndex < generatedEvents.length - 1 && generatedEvents[currentIndex + 1]) {
      initialExpanded.add(generatedEvents[currentIndex + 1].id);
    }
    
    return initialExpanded;
  });

  // Moved statusOrder and currentIndex up to useState initializer

  const generateTimelineEvents = (): TimelineEvent[] => {
    const generatedEvents: TimelineEvent[] = [];

    statusOrder.forEach((status, index) => {
      const config = SERVICE_STATUS_CONFIG[status];
      const isCompleted = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const isEstimated = index > currentIndex;
      
      // Use provided event data or generate default
      const existingEvent = events.find(e => e.status === status);
      
      generatedEvents.push({
        id: existingEvent?.id || `${status}-${index}`,
        status,
        timestamp: existingEvent?.timestamp || new Date().toISOString(),
        title: isEstimated ? `${config.label} (Estimado)` : config.label,
        description: getStepDescription(status, isEstimated, isCompleted),
        isCompleted,
        isEstimated,
        details: config.description,
        user: existingEvent?.user
      });
    });

    return generatedEvents;
  };

  const estimateTimeForStatus = (status: ExtendedServiceStatus): string => {
    const estimates: Partial<Record<ExtendedServiceStatus, string>> = {
      'pending': '~2h',
      'quoted': '~4h',
      'accepted': 'Imediato',
      'on_way': '~30min',
      'arrived': '~5min',
      'in_progress': '~2h',
      'awaiting_client_confirmation': '~10min',
      'payment_confirmed': 'Imediato',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado',
      'disputed': 'Em disputa'
    };
    
    return estimates[status] || 'A definir';
  };

  const getStepDescription = (status: ExtendedServiceStatus, isEstimated: boolean, isCompleted: boolean): string => {
    if (isCompleted && !isEstimated) {
      // Etapa já realizada
      switch (status) {
        case 'pending': return 'Solicitação foi criada e publicada';
        case 'quoted': return 'Orçamentos foram recebidos de profissionais';
        case 'accepted': return 'Orçamento foi aceito pelo cliente';
        case 'on_way': return 'Profissional iniciou deslocamento';
        case 'arrived': return 'Profissional chegou no local';
        case 'in_progress': return 'Serviço foi executado';
        case 'awaiting_client_confirmation': return 'Cliente confirmou conclusão';
        case 'payment_confirmed': return 'Pagamento foi confirmado';
        case 'completed': return 'Serviço finalizado com sucesso';
        default: return SERVICE_STATUS_CONFIG[status].description;
      }
    } else if (isEstimated) {
      // Etapa futura estimada
      switch (status) {
        case 'quoted': return 'Profissionais enviarão orçamentos';
        case 'accepted': return 'Cliente aceitará um orçamento';
        case 'on_way': return 'Profissional se dirigirá ao local';
        case 'arrived': return 'Profissional chegará no local';
        case 'in_progress': return 'Serviço será executado';
        case 'awaiting_client_confirmation': return 'Cliente confirmará conclusão';
        case 'payment_confirmed': return 'Pagamento será confirmado';
        case 'completed': return 'Serviço será finalizado';
        default: return SERVICE_STATUS_CONFIG[status].description;
      }
    }
    
    return SERVICE_STATUS_CONFIG[status].description;
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (status: ExtendedServiceStatus) => {
    const config = SERVICE_STATUS_CONFIG[status];
    return config.icon;
  };

  const timelineEvents = generateTimelineEvents();

  const toggleAllSteps = () => {
    if (expandedSteps.size === timelineEvents.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(timelineEvents.map(e => e.id)));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base truncate">Progresso do Serviço</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAllSteps}
            className="text-xs"
          >
            {expandedSteps.size === timelineEvents.length ? 'Colapsar' : 'Expandir'} Todas
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-1">
          {timelineEvents.map((event, index) => {
            const Icon = getStepIcon(event.status);
            const isExpanded = expandedSteps.has(event.id);
            const isCurrent = event.status === currentStatus;
            
            return (
              <div key={event.id} className="relative">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 sm:gap-4 p-3 sm:p-4 h-auto transition-all ${
                        isCurrent 
                          ? 'bg-primary/10 border-2 border-primary/30 hover:bg-primary/15' 
                          : event.isCompleted
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                          : 'bg-muted/50 border border-muted hover:bg-muted/70'
                      }`}
                      onClick={() => toggleStepExpansion(event.id)}
                    >
                      {/* Timeline connector line */}
                      {index < timelineEvents.length - 1 && (
                        <div className={`absolute left-6 sm:left-8 top-12 sm:top-16 w-0.5 h-4 sm:h-6 ${
                          event.isCompleted ? 'bg-green-300' : 'bg-muted'
                        } transition-colors`} />
                      )}
                      
                      {/* Status Icon */}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        event.isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : 'bg-muted border border-muted-foreground'
                      }`}>
                        {event.isCompleted ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-start gap-1 sm:gap-2 mb-1 flex-wrap">
                          <h4 className={`font-medium text-sm sm:text-base flex-1 min-w-0 ${
                            isCurrent ? 'text-primary' : event.isCompleted ? 'text-green-700' : 'text-muted-foreground'
                          }`}>
                            <span className="break-words">{event.title}</span>
                          </h4>
                          <div className="flex gap-1 flex-wrap flex-shrink-0">
                            {isCurrent && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5">
                                Atual
                              </Badge>
                            )}
                            {event.isEstimated && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5">
                                Estimado
                              </Badge>
                            )}
                            {event.isCompleted && !event.isEstimated && event.status !== 'pending' && (
                              <Badge variant="default" className="text-[10px] sm:text-xs bg-green-600 px-1 sm:px-2 py-0.5">
                                Realizado
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-xs sm:text-sm break-words ${
                          isCurrent ? 'text-primary/80' : event.isCompleted ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {event.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            <span className="break-words">
                              {event.isEstimated ? 'Estimativa: ' : ''}
                              {format(new Date(event.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {event.isEstimated && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {estimateTimeForStatus(event.status)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse indicator */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="ml-10 sm:ml-14 p-3 sm:p-4 border-l-2 border-muted">
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        {event.details}
                      </p>
                      
                      {event.user && (
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          <strong>Atualizado por:</strong> <span className="break-words">{event.user.name} ({event.user.role === 'client' ? 'Cliente' : 'Profissional'})</span>
                        </div>
                      )}

                      {/* Additional details based on status */}
                      {event.status === 'on_way' && event.isCompleted && (
                        <div className="text-[10px] sm:text-xs bg-blue-50 p-2 rounded">
                          <strong>Tempo estimado de chegada:</strong> <span className="break-words">Profissional informará pelo chat</span>
                        </div>
                      )}

                      {event.status === 'in_progress' && event.isCompleted && (
                        <div className="text-[10px] sm:text-xs bg-orange-50 p-2 rounded">
                          <strong>Duração do serviço:</strong> <span className="break-words">Será calculada automaticamente</span>
                        </div>
                      )}

                      {event.status === 'completed' && event.isCompleted && (
                        <div className="text-[10px] sm:text-xs bg-green-50 p-2 rounded">
                          <strong>Serviço finalizado!</strong> <span className="break-words">Não esqueça de avaliar o profissional</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
        
        {/* Timeline Legend */}
        <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-muted/30 rounded-lg">
          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span>Realizado - Etapa concluída</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0"></div>
              <span>Em andamento - Etapa atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full flex-shrink-0"></div>
              <span>Estimado - Próximas etapas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}