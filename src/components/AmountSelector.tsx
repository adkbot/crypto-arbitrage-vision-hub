
import React from 'react';
import { Button } from './ui/button';

interface AmountSelectorProps {
  onSelectAmount: (amount: number) => void;
  selectedAmount: number;
}

const presetAmounts = [50, 100, 200, 500, 1000, 2000, 3000, 5000];

const AmountSelector: React.FC<AmountSelectorProps> = ({ onSelectAmount, selectedAmount }) => {
  return (
    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-3">Valor Inicial ($)</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presetAmounts.map((amount) => (
          <Button
            key={amount}
            variant={selectedAmount === amount ? "default" : "outline"}
            className={selectedAmount === amount ? "bg-crypto-blue hover:bg-crypto-blue/90" : ""}
            onClick={() => onSelectAmount(amount)}
          >
            ${amount}
          </Button>
        ))}
        <Button
          variant={!presetAmounts.includes(selectedAmount) ? "default" : "outline"}
          className={!presetAmounts.includes(selectedAmount) ? "bg-crypto-blue hover:bg-crypto-blue/90" : ""}
          onClick={() => onSelectAmount(5001)}
        >
          Outro
        </Button>
      </div>
    </div>
  );
};

export default AmountSelector;
