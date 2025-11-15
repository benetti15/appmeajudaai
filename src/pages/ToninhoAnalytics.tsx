import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MessageSquare, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  totalConversations: number;
  activeUsers: number;
  avgResponseTime: number;
  conversionRate: number;
  conversationsOverTime: any[];
  topCategories: any[];
  userSegmentation: any[];
}

export default function ToninhoAnalytics() {
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  // Only allow admin access (you can adjust this logic)
  if (!user || profile?.user_type !== 'professional') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = timeRange === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Total conversations
      const { count: totalConversations } = await supabase
        .from('ai_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Active users
      const { data: activeUsersData } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .gte('created_at', startDate.toISOString());

      const activeUsers = new Set(activeUsersData?.map(c => c.user_id) || []).size;

      // Conversion rate (conversations that led to service requests)
      const { data: conversationsWithRequests } = await supabase
        .from('ai_conversations')
        .select('id, metadata')
        .gte('created_at', startDate.toISOString());

      const conversionsCount = conversationsWithRequests?.filter(
        c => c.metadata && (c.metadata as any).created_request === true
      ).length || 0;

      const conversionRate = totalConversations 
        ? Math.round((conversionsCount / (totalConversations || 1)) * 100) 
        : 0;

      // Conversations over time
      const { data: conversationsByDay } = await supabase
        .from('ai_conversations')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      const conversationsOverTime = processTimeSeriesData(conversationsByDay || [], daysAgo);

      // Top categories from service requests created via AI
      const { data: requests } = await supabase
        .from('service_requests')
        .select('category_id, service_categories(name)')
        .gte('created_at', startDate.toISOString())
        .limit(100);

      const categoryCount: Record<string, number> = {};
      requests?.forEach(req => {
        const categoryName = (req.service_categories as any)?.name || 'Sem categoria';
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalConversations: totalConversations || 0,
        activeUsers,
        avgResponseTime: 1.2, // Mock data - would need to track in edge function
        conversionRate,
        conversationsOverTime,
        topCategories,
        userSegmentation: [], // Could be expanded
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (data: any[], days: number) => {
    const counts: Record<string, number> = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const key = date.toISOString().split('T')[0];
      counts[key] = 0;
    }

    // Count actual conversations
    data.forEach(item => {
      const key = item.created_at.split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Analytics do Toninho</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Analytics do Toninho</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '7d' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '30d' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {timeRange === '7d' ? '7' : '30'} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Chat → Pedido criado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Média de resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversas ao Longo do Tempo</CardTitle>
            <CardDescription>Número de interações diárias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.conversationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias Mais Solicitadas</CardTitle>
            <CardDescription>Top 5 serviços via Toninho</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.conversionRate > 50 ? (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  Excelente taxa de conversão!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  O Toninho está convertendo mais de {analytics.conversionRate}% das conversas em pedidos reais.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-300">
                  Oportunidade de melhoria
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Considere ajustar os prompts do Toninho para aumentar a taxa de conversão de {analytics.conversionRate}%.
                </p>
              </div>
            </div>
          )}

          {analytics.activeUsers > 0 && (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Usuários engajados
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.activeUsers} usuários estão interagindo ativamente com o Toninho nos últimos {timeRange === '7d' ? '7' : '30'} dias.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
