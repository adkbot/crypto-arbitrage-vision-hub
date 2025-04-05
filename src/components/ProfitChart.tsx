
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfitDataPoint {
  timestamp: string;
  profit: number;
}

interface ProfitChartProps {
  data: ProfitDataPoint[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const profit = payload[0].value;
    const isPositive = profit >= 0;
    
    return (
      <div className="bg-card/80 backdrop-blur-sm p-3 border border-border rounded-lg shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-bold text-sm ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}>
          {isPositive ? '+' : ''}{profit.toFixed(2)} USD
        </p>
      </div>
    );
  }

  return null;
};

const ProfitChart: React.FC<ProfitChartProps> = ({ data, className }) => {
  const [chartData, setChartData] = useState<ProfitDataPoint[]>([]);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Histórico de Lucro</CardTitle>
        <CardDescription>Análise de ganhos e perdas ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#45B36B"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#45B36B"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#EB5757"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#EB5757"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(value) => value.split(' ')[1]} // Only show time
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#45B36B"
              fillOpacity={1}
              fill="url(#colorProfit)"
              activeDot={{ r: 6, fill: "#45B36B" }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#EB5757"
              fillOpacity={1}
              fill="url(#colorLoss)"
              activeDot={{ r: 6, fill: "#EB5757" }}
              hide={true} // This area will be conditionally shown based on profit values
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProfitChart;
