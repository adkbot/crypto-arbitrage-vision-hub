
import { cn } from '@/lib/utils';

interface StatusLEDProps {
  active: boolean;
  label?: string;
  className?: string;
}

const StatusLED: React.FC<StatusLEDProps> = ({
  active,
  label,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn(
          'w-3 h-3 rounded-full transition-all duration-300',
          active ? 'bg-crypto-green led-active' : 'bg-crypto-red led-inactive'
        )}
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
};

export default StatusLED;
