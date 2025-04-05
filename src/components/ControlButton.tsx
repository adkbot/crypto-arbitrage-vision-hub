
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ControlButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  disabled?: boolean;
  active?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  className,
  disabled = false,
  active = false
}) => {
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':
        return active 
          ? 'bg-crypto-blue text-white hover:bg-crypto-blue/90 shadow-glow' 
          : 'bg-crypto-blue/80 text-white hover:bg-crypto-blue/70';
      case 'secondary':
        return active 
          ? 'bg-crypto-purple text-white hover:bg-crypto-purple/90 shadow-glow' 
          : 'bg-crypto-purple/80 text-white hover:bg-crypto-purple/70';
      case 'destructive':
        return active 
          ? 'bg-crypto-red text-white hover:bg-crypto-red/90 shadow-glow-red' 
          : 'bg-crypto-red/80 text-white hover:bg-crypto-red/70';
      case 'outline':
        return active 
          ? 'bg-transparent border border-crypto-light-blue text-crypto-light-blue hover:bg-crypto-light-blue/10 shadow-glow' 
          : 'bg-transparent border border-crypto-light-blue/70 text-crypto-light-blue/70 hover:border-crypto-light-blue hover:text-crypto-light-blue';
      default:
        return active 
          ? 'bg-crypto-green text-white hover:bg-crypto-green/90 shadow-glow-green' 
          : 'bg-crypto-green/80 text-white hover:bg-crypto-green/70';
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 py-6 px-4 rounded-md transition-all',
        getVariantStyles(),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span className="font-medium">{label}</span>
    </Button>
  );
};

export default ControlButton;
