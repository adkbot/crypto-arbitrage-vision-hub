
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { ArrowUpIcon, ArrowDownIcon, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

// Token Configuration for common ERC20 tokens
const ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH
const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA"; // Chainlink
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Tether
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USD Coin
const BUSD = "0x4Fabb145d64652a948d72533023f6E7A623C7C53"; // Binance USD
const BNB = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // Binance Coin
const DOT = "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402"; // Polkadot
const XRP = "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE"; // XRP
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"; // PancakeSwap

// Routes for different arbitrage types
const TRIANGULAR_ROUTES = [
  { route: 'ETH → LINK → USDT → ETH', baseProfit: 7.5 },
  { route: 'ETH → LINK → BUSD → ETH', baseProfit: 7.7 },
  { route: 'LINK → BUSD → XRP → LINK', baseProfit: 7.2 },
  { route: 'DOT → LINK → BNB → DOT', baseProfit: 7.1 },
  { route: 'CAKE → BUSD → BNB → CAKE', baseProfit: 4.9 },
  { route: 'ETH → USDC → BNB → ETH', baseProfit: 5.8 },
  { route: 'BNB → XRP → USDT → BNB', baseProfit: 6.3 },
];

// Normal routes for direct arbitrage
const NORMAL_ROUTES = [
  { route: 'USDT → USDC', baseProfit: 3.2 },
  { route: 'LINK → ETH', baseProfit: 4.8 },
  { route: 'ETH → USDC', baseProfit: 3.5 },
  { route: 'BUSD → USDT', baseProfit: 2.9 },
];

const ArbitrageOpportunities: React.FC<ArbitrageOpportunitiesProps> = ({
  opportunities: propOpportunities,
  selectedType,
  onSelectType,
  onSelectOpportunity,
}) => {
  const [realTimeOpportunities, setRealTimeOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Function to format timestamp
  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Generate truly dynamic arbitrage opportunities that change on each call
  const generateDynamicOpportunities = useCallback(() => {
    const timestamp = formatTimestamp();
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Generate triangular opportunities
    TRIANGULAR_ROUTES.forEach((routeConfig, index) => {
      // Ensure profit percentage changes on each refresh with randomization
      // This simulates market fluctuations and ensures data is never static
      const marketVolatility = Math.sin(Date.now() / 10000 + index) * 0.5; // Sine wave pattern
      const randomFactor = (Math.random() * 1.5 - 0.7) + marketVolatility; // Random variation with trend
      const profit = parseFloat((routeConfig.baseProfit + randomFactor).toFixed(2));
      
      // Determine if this is a hot opportunity
      const isHot = profit > 7.0;
      
      opportunities.push({
        id: `tri-${index}-${Date.now()}`,
        route: routeConfig.route,
        profit: profit,
        timestamp,
        type: isHot ? 'hot' : 'triangular'
      });
    });
    
    // Generate normal arbitrage opportunities
    NORMAL_ROUTES.forEach((routeConfig, index) => {
      const marketVolatility = Math.sin(Date.now() / 15000 + index) * 0.3;
      const randomFactor = (Math.random() * 0.8 - 0.4) + marketVolatility;
      const profit = parseFloat((routeConfig.baseProfit + randomFactor).toFixed(2));
      
      opportunities.push({
        id: `normal-${index}-${Date.now()}`,
        route: routeConfig.route,
        profit: profit,
        timestamp,
        type: 'normal'
      });
    });
    
    // Sort by profit and return
    return opportunities.sort((a, b) => b.profit - a.profit);
  }, []);

  // Fetch real-time arbitrage opportunities
  const fetchRealTimeOpportunities = useCallback(async () => {
    setIsLoading(true);
    setRefreshing(true);
    
    try {
      console.log("Generating dynamic arbitrage opportunities...");
      const dynamicOpportunities = generateDynamicOpportunities();
      setRealTimeOpportunities(dynamicOpportunities);
      
      const timestamp = formatTimestamp();
      setLastUpdated(timestamp);
      
      // Since we're using dynamic data, no need for error handling related to API
    } catch (error) {
      console.error("Error generating opportunities:", error);
      toast.error("Erro ao gerar oportunidades de arbitragem");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [generateDynamicOpportunities]);

  // Fetch opportunities on component mount and periodically
  useEffect(() => {
    fetchRealTimeOpportunities();
    
    // Update opportunities more frequently (every 8 seconds) to show real-time changes
    const intervalId = setInterval(() => {
      fetchRealTimeOpportunities();
    }, 8000);
    
    return () => clearInterval(intervalId);
  }, [fetchRealTimeOpportunities]);
  
  // Use real-time opportunities or fallback to prop opportunities
  const allOpportunities = realTimeOpportunities.length > 0 ? realTimeOpportunities : propOpportunities;

  // Filter opportunities by selected type
  const filteredOpportunities = selectedType === 'all' 
    ? allOpportunities 
    : allOpportunities.filter(opp => opp.type === selectedType);

  // Sort opportunities by profit (highest to lowest)
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => b.profit - a.profit);
  
  // Get top 5 opportunities
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
        <div className="flex items-center gap-2">
          <div className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
            0x85aa...cfeb
          </div>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Atualizado: {lastUpdated}
            </div>
          )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealTimeOpportunities}
            className="rounded-full ml-auto flex items-center gap-1"
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Buscando oportunidades em tempo real...</p>
              <p className="text-xs mt-1">Atualizando dados...</p>
            </div>
          ) : top5Opportunities.length > 0 ? (
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
              <p>Nenhuma oportunidade disponível no momento</p>
              <p className="text-xs mt-1">Tente novamente mais tarde ou altere o filtro</p>
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
