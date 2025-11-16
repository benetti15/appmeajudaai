import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FeedbackChartProps {
  data: Array<{
    date: string;
    positive: number;
    negative: number;
  }>;
}

export function FeedbackChart({ data }: FeedbackChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Evolução do Feedback</CardTitle>
        <CardDescription>
          Acompanhe a evolução das avaliações positivas e negativas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="positive" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              name="Positivos"
              dot={{ fill: 'hsl(142, 76%, 36%)' }}
            />
            <Line 
              type="monotone" 
              dataKey="negative" 
              stroke="hsl(0, 84%, 60%)" 
              strokeWidth={2}
              name="Negativos"
              dot={{ fill: 'hsl(0, 84%, 60%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
