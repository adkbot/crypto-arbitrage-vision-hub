
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ethers } from 'ethers';
import { toast } from 'sonner';

interface WalletStatusProps {
  connected: boolean;
  walletAddress?: string;
  balance?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  className?: string;
}

const WalletStatus: React.FC<WalletStatusProps> = ({
  connected,
  walletAddress = '',
  balance = 0,
  onConnect,
  onDisconnect,
  className
}) => {
  // Format wallet address to show only first and last few characters
  const formattedAddress = walletAddress 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              'rounded-md border border-muted px-4 py-2',
              connected ? 'bg-crypto-green/10 hover:bg-crypto-green/20 border-crypto-green/50' : 
                         'bg-crypto-red/10 hover:bg-crypto-red/20 border-crypto-red/50'
            )}
          >
            {connected ? (
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-crypto-green" />
                <span className="text-sm font-medium">{formattedAddress}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-crypto-red" />
                <span className="text-sm font-medium">Carteira Desconectada</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-card border border-muted p-4">
          {connected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="text-xs font-mono break-all">{walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="text-base font-medium">{balance.toFixed(4)} ETH</p>
              </div>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={onDisconnect}
                size="sm"
              >
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Conecte sua carteira para iniciar</p>
              <Button 
                className="w-full bg-crypto-blue hover:bg-crypto-blue/90" 
                onClick={onConnect}
                size="sm"
              >
                Conectar Carteira
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default WalletStatus;
