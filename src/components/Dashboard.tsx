import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Star, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface DashboardStats {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  totalSpent: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
  conversionRate: number;
  monthlyData: Array<{
    month: string;
    requests: number;
    earnings: number;
  }>;
  serviceDistribution: Array<{
    category: string;
    count: number;
    color: string;
  }>;
}

interface DashboardProps {
  userType: 'client' | 'professional';
}

export function Dashboard({ userType }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeRange]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      if (userType === 'client') {
        await fetchClientStats(startDate, endDate);
      } else {
        await fetchProfessionalStats(startDate, endDate);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientStats = async (startDate: Date, endDate: Date) => {
    // Dados limpos - sem histórico de solicitações
    const totalRequests = 0;
    const completedRequests = 0;
    const pendingRequests = 0;
    const totalSpent = 0;

    // Dados vazios para gráficos
    const monthlyData = generateEmptyMonthlyData();
    const serviceDistribution: any[] = [];

    setStats({
      totalRequests,
      completedRequests,
      pendingRequests,
      totalSpent,
      totalEarnings: 0,
      averageRating: 0,
      reviewCount: 0,
      conversionRate: 0,
      monthlyData,
      serviceDistribution,
    });
  };

  const fetchProfessionalStats = async (startDate: Date, endDate: Date) => {
    // Dados limpos - sem histórico de orçamentos e atendimentos
    const totalQuotes = 0;
    const acceptedQuotes = 0;
    const completedRequests = 0;
    const totalEarnings = 0;
    const averageRating = 0;
    const reviewCount = 0;

    const monthlyData = generateEmptyMonthlyData();
    const serviceDistribution: any[] = [];

    setStats({
      totalRequests: totalQuotes,
      completedRequests,
      pendingRequests: totalQuotes - acceptedQuotes,
      totalSpent: 0,
      totalEarnings,
      averageRating,
      reviewCount,
      conversionRate: 0,
      monthlyData,
      serviceDistribution,
    });
  };

  const generateEmptyMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      monthlyData.push({
        month: monthName,
        requests: 0,
        earnings: 0
      });
    }

    return monthlyData;
  };

  const generateMonthlyData = (data: any[], type: 'client' | 'professional') => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthData = data.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate.getMonth() === date.getMonth() && 
               itemDate.getFullYear() === date.getFullYear();
      });

      monthlyData.push({
        month: monthName,
        requests: monthData.length,
        earnings: type === 'professional' 
          ? monthData.reduce((sum, item) => sum + item.amount, 0)
          : monthData.reduce((sum, item) => {
              const acceptedQuote = item.quotes?.find((q: any) => q.amount);
              return sum + (acceptedQuote?.amount || 0);
            }, 0)
      });
    }

    return monthlyData;
  };

  const generateServiceDistribution = (data: any[]) => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const categoryCount: { [key: string]: number } = {};

    data.forEach(item => {
      const category = item.category?.name || 'Outros';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([category, count], index) => ({
      category,
      count,
      color: colors[index % colors.length]
    }));
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <div>Carregando dashboard...</div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Erro ao carregar dados do dashboard.</div>
      </Card>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Icon className="w-8 h-8 text-primary/60" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 dias' : 
               range === '30d' ? '30 dias' : 
               range === '90d' ? '90 dias' : '1 ano'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={userType === 'client' ? DollarSign : BarChart3}
          title={userType === 'client' ? "Total Gasto" : "Total Ganho"}
          value={userType === 'client' 
            ? `R$ ${stats.totalSpent.toLocaleString('pt-BR')}` 
            : `R$ ${stats.totalEarnings.toLocaleString('pt-BR')}`}
          subtitle={`${timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : timeRange === '90d' ? '90 dias' : '1 ano'}`}
        />
        
        <StatCard
          icon={Calendar}
          title={userType === 'client' ? "Pedidos Realizados" : "Orçamentos Enviados"}
          value={stats.totalRequests}
          subtitle={`${stats.completedRequests} concluídos`}
        />

        <StatCard
          icon={CheckCircle}
          title="Taxa de Conversão"
          value={`${stats.conversionRate.toFixed(1)}%`}
          subtitle={userType === 'client' ? "Pedidos concluídos" : "Orçamentos aceitos"}
        />

        {userType === 'professional' && (
          <StatCard
            icon={Star}
            title="Avaliação Média"
            value={stats.averageRating.toFixed(1)}
            subtitle={`${stats.reviewCount} avaliações`}
          />
        )}

        {userType === 'client' && (
          <StatCard
            icon={Clock}
            title="Pedidos Pendentes"
            value={stats.pendingRequests}
            subtitle="Aguardando orçamentos"
          />
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {userType === 'client' ? 'Gastos Mensais' : 'Receita Mensal'}
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, userType === 'client' ? 'Gastos' : 'Receita']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Service Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.serviceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {stats.serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Métricas Detalhadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total de {userType === 'client' ? 'Pedidos' : 'Orçamentos'}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completedRequests}</div>
                <div className="text-sm text-muted-foreground">Concluídos</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}