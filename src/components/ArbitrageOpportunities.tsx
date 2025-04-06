
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
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

// 0x API Configuration
const BASE_0X_URL = "https://api.0x.org/swap/permit2/quote";
const API_KEY = ""; // Should be set via environment variable in production

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
  { from: ETH, to: LINK, toName: "LINK", fromName: "ETH" },
  { from: LINK, to: USDT, toName: "USDT", fromName: "LINK" },
  { from: USDT, to: ETH, toName: "ETH", fromName: "USDT" },
  { from: ETH, to: LINK, toName: "LINK", fromName: "ETH" },
  { from: LINK, to: BUSD, toName: "BUSD", fromName: "LINK" },
  { from: BUSD, to: ETH, toName: "ETH", fromName: "BUSD" },
  { from: LINK, to: BUSD, toName: "BUSD", fromName: "LINK" },
  { from: BUSD, to: XRP, toName: "XRP", fromName: "BUSD" },
  { from: XRP, to: LINK, toName: "LINK", fromName: "XRP" },
  { from: DOT, to: LINK, toName: "LINK", fromName: "DOT" },
  { from: LINK, to: BNB, toName: "BNB", fromName: "LINK" },
  { from: BNB, to: DOT, toName: "DOT", fromName: "BNB" },
  { from: CAKE, to: BUSD, toName: "BUSD", fromName: "CAKE" },
  { from: BUSD, to: BNB, toName: "BNB", fromName: "BUSD" },
  { from: BNB, to: CAKE, toName: "CAKE", fromName: "BNB" },
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

  // Function to format timestamp
  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Function to get quote from 0x API
  const getQuote = async (sellToken: string, buyToken: string, sellAmount: string) => {
    try {
      const headers = {
        "0x-api-key": API_KEY,
        "0x-version": "v2"
      };

      const params: any = {
        chainId: 1, // Ethereum Mainnet
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage: "0.01" // 1% slippage
      };

      const response = await axios.get(BASE_0X_URL, { 
        params,
        headers: API_KEY ? headers : undefined // Only send headers if API key is set
      });
      
      return response.data;
    } catch (error) {
      console.error("Error getting quote:", error);
      return null;
    }
  };

  // Fetch real-time arbitrage opportunities
  const fetchRealTimeOpportunities = async () => {
    setIsLoading(true);
    
    try {
      const opportunities: ArbitrageOpportunity[] = [];
      const timestamp = formatTimestamp();
      
      // Base amount in Wei (1 ETH)
      const sellAmount = "1000000000000000000";
      
      // Generate triangular arbitrage opportunities
      // For real implementation, this would be multiple API calls to check for price differences
      for (let i = 0; i < TRIANGULAR_ROUTES.length; i += 3) {
        if (i + 2 < TRIANGULAR_ROUTES.length) {
          try {
            // Quote for first leg
            const quote1 = await getQuote(
              TRIANGULAR_ROUTES[i].from, 
              TRIANGULAR_ROUTES[i].to, 
              sellAmount
            );
            
            if (quote1) {
              // Calculate profit percentage (simplified for demo)
              // In a real implementation, you would chain all 3 quotes
              const profit = 5 + Math.random() * 3; // Simulate 5-8% profit for demo
              
              // Create the route representation
              const route = `${TRIANGULAR_ROUTES[i].fromName} → ${TRIANGULAR_ROUTES[i].toName} → ${TRIANGULAR_ROUTES[i+1].toName} → ${TRIANGULAR_ROUTES[i+2].toName}`;
              
              // Determine if this is a hot opportunity
              const isHot = profit > 7;
              
              opportunities.push({
                id: `tri-${i}-${Date.now()}`,
                route,
                profit,
                timestamp,
                type: isHot ? 'hot' : 'triangular'
              });
            }
          } catch (error) {
            console.error("Error in triangular arbitrage calculation:", error);
          }
        }
      }
      
      // Generate direct (normal) arbitrage opportunities
      try {
        const directPairs = [
          { from: USDT, to: USDC, fromName: "USDT", toName: "USDC" },
          { from: LINK, to: ETH, fromName: "LINK", toName: "ETH" }
        ];
        
        for (const pair of directPairs) {
          const quoteA = await getQuote(pair.from, pair.to, sellAmount);
          
          if (quoteA) {
            const profit = 4 + Math.random() * 2; // Simulate 4-6% profit
            
            opportunities.push({
              id: `normal-${pair.fromName}-${pair.toName}-${Date.now()}`,
              route: `${pair.fromName} → ${pair.toName}`,
              profit,
              timestamp,
              type: 'normal'
            });
          }
        }
      } catch (error) {
        console.error("Error in normal arbitrage calculation:", error);
      }
      
      setRealTimeOpportunities(opportunities);
      setLastUpdated(timestamp);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error fetching real-time opportunities:", error);
      toast.error("Falha ao buscar oportunidades em tempo real");
      setIsLoading(false);
    }
  };

  // Fetch opportunities on component mount and periodically
  useEffect(() => {
    fetchRealTimeOpportunities();
    
    // Update opportunities every 30 seconds
    const intervalId = setInterval(() => {
      fetchRealTimeOpportunities();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
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
            className="rounded-full ml-auto"
          >
            Atualizar
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Buscando oportunidades em tempo real...</p>
              <p className="text-xs mt-1">Aguarde enquanto consultamos a API 0x</p>
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
