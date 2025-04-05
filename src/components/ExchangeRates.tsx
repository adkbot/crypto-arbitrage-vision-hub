
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

interface ExchangeRate {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
}

interface ExchangeRatesProps {
  rates: ExchangeRate[];
  onSelectArbitrage?: (from: string, to: string) => void;
  className?: string;
}

const ExchangeRates: React.FC<ExchangeRatesProps> = ({
  rates,
  onSelectArbitrage,
  className
}) => {
  const [sortedRates, setSortedRates] = useState<ExchangeRate[]>([]);
  const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null);

  useEffect(() => {
    setSortedRates([...rates].sort((a, b) => a.price - b.price));
  }, [rates]);

  const handleRowClick = (index: number) => {
    if (selectedPair === null) {
      setSelectedPair([index, null as unknown as number]);
    } else if (selectedPair[0] === index) {
      setSelectedPair(null);
    } else if (selectedPair[1] === null) {
      const newPair: [number, number] = [selectedPair[0], index];
      setSelectedPair(newPair);
      
      if (onSelectArbitrage) {
        onSelectArbitrage(
          sortedRates[newPair[0]].exchange,
          sortedRates[newPair[1]].exchange
        );
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setSelectedPair(null);
      }, 2000);
    }
  };

  const isSelected = (index: number) => {
    return selectedPair !== null && (selectedPair[0] === index || selectedPair[1] === index);
  };

  const isPrimarySelected = (index: number) => {
    return selectedPair !== null && selectedPair[0] === index;
  };

  // Calculate potential arbitrage between cheapest and most expensive
  const lowestPrice = sortedRates[0]?.price || 0;
  const highestPrice = sortedRates[sortedRates.length - 1]?.price || 0;
  const arbitragePercent = lowestPrice > 0 
    ? ((highestPrice - lowestPrice) / lowestPrice) * 100 
    : 0;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Taxas de câmbio</span>
          {arbitragePercent > 0.5 && (
            <span className="text-sm text-crypto-green font-normal">
              Oportunidade: {arbitragePercent.toFixed(2)}%
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Selecione duas exchanges para visualizar oportunidade de arbitragem
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[400px]">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-muted">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Exchange</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Token</th>
                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Preço (USD)</th>
                <th className="px-3 py-2 text-right text-xs text-muted-foreground">24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/50">
              {sortedRates.map((rate, index) => (
                <tr 
                  key={rate.exchange}
                  onClick={() => handleRowClick(index)}
                  className={cn(
                    'hover:bg-accent/50 cursor-pointer transition-colors',
                    isSelected(index) ? 'bg-accent' : '',
                    isPrimarySelected(index) ? 'border-l-4 border-crypto-blue' : ''
                  )}
                >
                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center">
                      {isPrimarySelected(index) && selectedPair && selectedPair[1] !== null && (
                        <ArrowRight className="h-4 w-4 mr-1 text-crypto-green animate-pulse" />
                      )}
                      {rate.exchange}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm">{rate.symbol}</td>
                  <td className="px-3 py-4 text-sm text-right font-mono">${rate.price.toFixed(2)}</td>
                  <td className={cn(
                    'px-3 py-4 text-sm text-right',
                    rate.change24h > 0 ? 'text-crypto-green' : 'text-crypto-red'
                  )}>
                    <div className="flex items-center justify-end">
                      {rate.change24h > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(rate.change24h).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRates;
