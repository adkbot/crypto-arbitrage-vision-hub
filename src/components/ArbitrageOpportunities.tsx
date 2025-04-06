
import React from 'react';
import { Button } from './ui/button';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

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

  // Ordenar oportunidades por profit (da maior para a menor)
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => b.profit - a.profit);
  
  // Pegar as 5 melhores oportunidades
  const top5Opportunities = sortedOpportunities.slice(0, 5);

  // Get border color based on arbitrage type
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'normal':
        return 'border-green-500';
      case 'triangular':
        return 'border-yellow-500';
      case 'hot':
        return 'border-orange-500';
      default:
        return 'border-gray-500';
    }
  };

  // Get text color based on arbitrage type
  const getTextColor = (type: string) => {
    switch (type) {
      case 'normal':
        return 'text-green-500';
      case 'triangular':
        return 'text-yellow-500';
      case 'hot':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get background color based on arbitrage type for percentage badge
  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'normal':
        return 'bg-green-500';
      case 'triangular':
        return 'bg-yellow-500';
      case 'hot':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
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
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
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
            className="rounded-full bg-yellow-500/80 hover:bg-yellow-600 text-white"
          >
            Triangular
          </Button>
          <Button 
            variant={selectedType === 'normal' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('normal')}
            className="rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            Normal
          </Button>
          <Button 
            variant={selectedType === 'hot' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onSelectType('hot')}
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Hot
          </Button>
        </div>

        <div className="space-y-3">
          {top5Opportunities.length > 0 ? (
            top5Opportunities.map((opportunity) => (
              <div 
                key={opportunity.id}
                className={`p-3 border ${getBorderColor(opportunity.type)} rounded-lg bg-background/30 backdrop-blur-sm cursor-pointer hover:bg-background/50 transition-colors`}
                onClick={() => onSelectOpportunity(opportunity)}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{opportunity.route}</div>
                  <div className={`${getBackgroundColor(opportunity.type)} text-white font-medium px-2 py-0.5 rounded-full flex items-center`}>
                    {opportunity.profit > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    {opportunity.profit.toFixed(2)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <div>${(opportunity.profit * 0.01 * 100).toFixed(2)} lucro estimado</div>
                  <div>{opportunity.timestamp}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Buscando oportunidades em tempo real...</p>
              <p className="text-xs mt-1">Aguarde enquanto consultamos a API 0x</p>
            </div>
          )}
        </div>
        
        {filteredOpportunities.length > 0 && top5Opportunities.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">Nenhuma oportunidade disponível no momento</p>
        )}
        
        {filteredOpportunities.length > 5 && (
          <div className="text-center mt-2 text-xs text-muted-foreground">
            Mostrando as 5 melhores oportunidades de {filteredOpportunities.length} disponíveis
          </div>
        )}
      </div>
    </div>
  );
};

export default ArbitrageOpportunities;
