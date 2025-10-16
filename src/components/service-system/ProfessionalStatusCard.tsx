import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  AlertTriangle,
  Briefcase,
  DollarSign,
  Calendar,
  Target
} from "lucide-react";
import { ServiceStatus, SERVICE_STATUS_CONFIG } from "@/components/service-system/ServiceStatusFlow";

interface ProfessionalStatusCardProps {
  currentStatus: ServiceStatus;
  requestTitle: string;
  clientName?: string;
  budgetEstimate?: number;
  preferredDate?: string;
  urgencyLevel: number;
  optimisticStatus?: ServiceStatus | null;
}

export function ProfessionalStatusCard({ 
  currentStatus, 
  requestTitle,
  clientName,
  budgetEstimate,
  preferredDate,
  urgencyLevel,
  optimisticStatus = null
}: ProfessionalStatusCardProps) {
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'quoted':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'accepted':
        return <PlayCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getUrgencyInfo = (level: number) => {
    const urgencyConfig = {
      1: { label: "Baixa", color: "bg-green-100 text-green-800", icon: "🟢" },
      2: { label: "Média", color: "bg-yellow-100 text-yellow-800", icon: "🟡" }, 
      3: { label: "Alta", color: "bg-red-100 text-red-800", icon: "🔴" }
    };
    return urgencyConfig[level as keyof typeof urgencyConfig] || urgencyConfig[1];
  };

  const getNextAction = (status: ServiceStatus) => {
    switch (status) {
      case 'pending':
        return "Envie seu orçamento para ser selecionado";
      case 'quoted':
        return "Aguardando cliente aceitar orçamento";
      case 'accepted':
        return "Inicie o atendimento ao cliente";
      case 'in_progress':
        return "Finalize o serviço e marque como concluído";
      case 'completed':
        return "Serviço finalizado com sucesso";
      default:
        return "";
    }
  };

  const displayStatus = optimisticStatus || currentStatus;
  const urgencyInfo = getUrgencyInfo(urgencyLevel);
  const statusConfig = SERVICE_STATUS_CONFIG[displayStatus];

  return (
    <Card className={`border-l-4 transition-all duration-500 ${optimisticStatus ? 'animate-fade-in' : ''}`} style={{ borderLeftColor: statusConfig.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Painel de Controle
          </CardTitle>
          <Badge className={urgencyInfo.color}>
            {urgencyInfo.icon} {urgencyInfo.label} Urgência
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg transition-all duration-300 ${optimisticStatus ? 'animate-pulse bg-primary/10' : ''}`}>
          {getStatusIcon(displayStatus)}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Status Atual</h4>
            <p className="text-sm text-muted-foreground">{statusConfig.label}</p>
          </div>
          <Badge variant="outline" className={`ml-auto ${optimisticStatus ? 'animate-pulse' : ''}`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Próxima Ação */}
        <div className={`p-3 bg-primary/5 border-l-2 border-primary rounded-r-lg transition-all duration-300 ${optimisticStatus === 'in_progress' ? 'bg-green-50 border-green-500' : ''}`}>
          <h4 className="font-semibold text-sm text-primary mb-1">Próxima Ação</h4>
          <p className="text-sm">{getNextAction(displayStatus)}</p>
        </div>

        {/* Informações do Serviço */}
        <div className="grid grid-cols-1 gap-3">
          {clientName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Cliente:</span>
              <span>{clientName}</span>
            </div>
          )}
          
          {budgetEstimate && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-muted-foreground">Orçamento Estimado:</span>
              <span className="font-semibold text-green-700">
                R$ {budgetEstimate.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
          
          {preferredDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-muted-foreground">Data Preferida:</span>
              <span>{new Date(preferredDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}