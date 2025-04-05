
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  initialTime: number; // in seconds
  onComplete?: () => void;
  className?: string;
  isRunning: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialTime,
  onComplete,
  className,
  isRunning
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!isRunning) return;
    
    if (timeLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete, isRunning]);

  // Reset timer when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className={cn(
      'bg-card rounded-lg p-3 text-center transition-all',
      isRunning ? 'shadow-glow' : '',
      className
    )}>
      <div className="text-sm text-muted-foreground mb-2">Próxima Arbitragem</div>
      <div className={cn(
        'text-4xl font-bold font-mono',
        isRunning ? 'text-crypto-green' : 'text-crypto-red',
        timeLeft < 10 && isRunning ? 'animate-countdown' : ''
      )}>
        {formattedTime}
      </div>
    </div>
  );
};

export default CountdownTimer;
