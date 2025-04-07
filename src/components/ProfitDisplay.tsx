
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProfitDisplayProps {
  currentProfit: number;
  currency?: string;
  className?: string;
}

const ProfitDisplay: React.FC<ProfitDisplayProps> = ({
  currentProfit,
  currency = 'USDT',
  className
}) => {
  const [animatedProfit, setAnimatedProfit] = useState(currentProfit);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);

  useEffect(() => {
    if (currentProfit !== animatedProfit) {
      setIsIncreasing(currentProfit > animatedProfit);
      
      // Animate the change
      const diff = currentProfit - animatedProfit;
      const step = diff / 10;
      let current = animatedProfit;
      
      const interval = setInterval(() => {
        current += step;
        if ((step > 0 && current >= currentProfit) || 
            (step < 0 && current <= currentProfit)) {
          clearInterval(interval);
          setAnimatedProfit(currentProfit);
        } else {
          setAnimatedProfit(current);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [currentProfit, animatedProfit]);

  // Format the profit with commas for thousands and fixed decimal points
  const formattedProfit = animatedProfit.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const isPositive = animatedProfit >= 0;
  
  return (
    <div className={cn('p-4 rounded-lg bg-card', className)}>
      <div className="text-sm text-muted-foreground mb-1">Lucro Total</div>
      <div className="flex items-center">
        <span className={cn(
          'text-3xl font-bold transition-all',
          isPositive ? 'profit-positive' : 'profit-negative'
        )}>
          {isPositive ? '+' : ''}{formattedProfit} {currency}
        </span>
        
        {isIncreasing !== null && (
          <span className={cn(
            'ml-2 text-sm',
            isIncreasing ? 'text-crypto-green' : 'text-crypto-red'
          )}>
            {isIncreasing ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfitDisplay;
