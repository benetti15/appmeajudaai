import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Truck, Play, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StatusUpdate {
  id: string;
  title: string;
  status: string;
  professional_name?: string;
  timestamp: string;
}

export function RealTimeStatusUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);

  useEffect(() => {
    if (!user) return;

    // Carregar atualizações iniciais
    fetchRecentUpdates();

    // Configurar subscription em tempo real
    const channel = supabase
      .channel('status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          handleStatusChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchRecentUpdates = async () => {
    const { data } = await supabase
      .from("service_requests")
      .select("id, title, status, created_at")
      .eq("client_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setUpdates(data.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        timestamp: d.created_at
      })));
    }
  };

  const handleStatusChange = (payload: any) => {
    const oldStatus = payload.old.status;
    const newStatus = payload.new.status;

    if (oldStatus === newStatus) return;

    // Mostrar notificação
    const statusMessages: Record<string, { title: string; icon: string }> = {
      'heading_to_client': {
        title: '🚀 Profissional a Caminho!',
        icon: 'truck'
      },
      'in_progress': {
        title: '🔧 Serviço Iniciado!',
        icon: 'play'
      },
      'awaiting_confirmation': {
        title: '✅ Serviço Concluído!',
        icon: 'check'
      },
      'completed': {
        title: '🎉 Trabalho Finalizado!',
        icon: 'success'
      }
    };

    const message = statusMessages[newStatus];
    if (message) {
      toast.success(message.title, {
        description: `Status atualizado para: ${newStatus}`,
      });
    }

    // Atualizar lista de atualizações
    setUpdates(prev => [
      {
        id: payload.new.id,
        title: payload.new.title,
        status: newStatus,
        timestamp: new Date().toISOString()
      },
      ...prev.slice(0, 4)
    ]);
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'heading_to_client': <Truck className="w-4 h-4 text-blue-500" />,
      'in_progress': <Play className="w-4 h-4 text-green-500" />,
      'awaiting_confirmation': <CheckCircle className="w-4 h-4 text-yellow-500" />,
      'completed': <CheckCircle className="w-4 h-4 text-green-600" />,
      'cancelled': <AlertCircle className="w-4 h-4 text-red-500" />
    };
    return icons[status] || <Bell className="w-4 h-4" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'quoted': 'Com Orçamentos',
      'heading_to_client': 'A Caminho',
      'in_progress': 'Em Andamento',
      'awaiting_confirmation': 'Aguardando Confirmação',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  if (updates.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <CardTitle>Atualizações Recentes</CardTitle>
            <CardDescription>Acompanhe o status dos seus serviços em tempo real</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {updates.map((update) => (
            <div 
              key={update.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
            >
              {getStatusIcon(update.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{update.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(update.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <Badge variant="outline">
                {getStatusLabel(update.status)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
