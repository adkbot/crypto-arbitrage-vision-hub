
import { cn } from '@/lib/utils';

interface ArbitrageStatsProps {
  totalTransactions: number;
  successRate: number;
  averageProfit: number;
  className?: string;
}

const ArbitrageStats: React.FC<ArbitrageStatsProps> = ({
  totalTransactions,
  successRate,
  averageProfit,
  className
}) => {
  // Format number for display
  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const formatUSD = (value: number) => {
    return '$' + value.toFixed(2);
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      <div className="bg-card rounded-lg p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-1">Total de Transações</div>
        <div className="text-2xl font-bold">{totalTransactions}</div>
      </div>
      
      <div className="bg-card rounded-lg p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-1">Taxa de Sucesso</div>
        <div className={cn(
          'text-2xl font-bold',
          successRate > 75 ? 'text-crypto-green' : 
          successRate > 50 ? 'text-crypto-yellow' : 
          'text-crypto-red'
        )}>
          {formatPercent(successRate)}
        </div>
      </div>
      
      <div className="bg-card rounded-lg p-4 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-1">Lucro Médio</div>
        <div className={cn(
          'text-2xl font-bold',
          averageProfit > 0 ? 'text-crypto-green' : 'text-crypto-red'
        )}>
          {formatUSD(averageProfit)}
        </div>
      </div>
    </div>
  );
};

export default ArbitrageStats;
