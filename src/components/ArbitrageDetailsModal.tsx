
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface ArbitrageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: string;
  estimatedProfit: number;
  investmentAmount: number;
  onExecute: () => void;
  onValidate: () => void;
  arbitrageType: 'normal' | 'triangular' | 'hot' | null;
  profitDetails?: {
    grossProfit: number;
    gasFees: number;
    totalFees: number;
    netProfit: number;
  };
}

const ArbitrageDetailsModal: React.FC<ArbitrageDetailsModalProps> = ({
  isOpen,
  onClose,
  route,
  estimatedProfit,
  investmentAmount,
  onExecute,
  onValidate,
  arbitrageType,
  profitDetails
}) => {
  const profitPercentage = ((estimatedProfit / investmentAmount) * 100).toFixed(2);
  
  const showDetailedBreakdown = profitDetails !== undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detalhes da Arbitragem</DialogTitle>
          <DialogClose asChild>
            <button 
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Rota</p>
            <p className="font-medium">{route}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lucro Estimado</p>
            <p className="text-green-500 text-xl font-bold">{profitPercentage}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor de Investimento (USD)</p>
            <div className="bg-muted/50 p-2 rounded-md">
              <p className="text-lg">{investmentAmount}</p>
            </div>
          </div>

          {showDetailedBreakdown && (
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <p className="font-medium">Detalhes do Lucro</p>
              <div className="flex justify-between">
                <span>Lucro Bruto:</span>
                <span>${profitDetails.grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxas Gas:</span>
                <span>${profitDetails.gasFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Taxas:</span>
                <span>${profitDetails.totalFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Lucro Líquido:</span>
                <span className="text-green-500">${profitDetails.netProfit.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={onValidate}
            >
              Validar
            </Button>
            <Button 
              variant="default" 
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={onExecute}
            >
              Executar com ${investmentAmount}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArbitrageDetailsModal;
