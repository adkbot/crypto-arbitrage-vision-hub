
import React from 'react';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface ArbitrageOpportunity {
  id: string;
  route: string;
  profit: number;
  timestamp: string;
  type: 'normal' | 'triangular' | 'hot';
}

interface ArbitrageOpportunitiesProps {
  opportunities: ArbitrageOpportunity[];
  selectedType: string;
  onSelectType: (type: string) => void;
  onSelectOpportunity: (opportunity: ArbitrageOpportunity) => void;
}

const ArbitrageOpportunities: React.FC<ArbitrageOpportunitiesProps> = ({
  opportunities,
  selectedType,
  onSelectType,
  onSelectOpportunity,
}) => {
  // Filtrar oportunidades pelo tipo selecionado, ou mostrar todas se "all" estiver selecionado
  const filteredOpportunities = selectedType === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === selectedType);

  const getBorderColor = (profit: number) => {
    if (profit >= 7) return 'border-green-500';
    if (profit >= 5) return 'border-orange-500';
    return 'border-yellow-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Oportunidades de Arbitragem</h2>
        <div className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
          0x85aa...cfeb
        </div>
      </div>

      <div className="relative">
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={selectedType === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('all')}
            className="rounded-full"
          >
            Todas
          </Button>
          <Button 
            variant={selectedType === 'triangular' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('triangular')}
            className="rounded-full"
          >
            Triangular
          </Button>
          <Button 
            variant={selectedType === 'normal' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('normal')}
            className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Direta
          </Button>
          <Button 
            variant={selectedType === 'hot' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('hot')}
            className="rounded-full"
          >
            Hot
          </Button>
        </div>

        <div className="space-y-3">
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opportunity) => (
              <div 
                key={opportunity.id}
                className={`p-3 border ${getBorderColor(opportunity.profit)} rounded-lg bg-background/30 backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors`}
                onClick={() => onSelectOpportunity(opportunity)}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{opportunity.route}</div>
                  <div className={opportunity.profit >= 7 ? 'text-green-500' : opportunity.profit >= 5 ? 'text-orange-500' : 'text-yellow-500'}>
                    {opportunity.profit.toFixed(2)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <div>${opportunity.profit.toFixed(2)} lucro estimado</div>
                  <div>{opportunity.timestamp}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">Nenhuma oportunidade disponível no momento</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArbitrageOpportunities;
