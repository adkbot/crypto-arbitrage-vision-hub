import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import StatusLED from './StatusLED';
import ProfitDisplay from './ProfitDisplay';
import ControlButton from './ControlButton';
import WalletStatus from './WalletStatus';
import ArbitrageStats from './ArbitrageStats';
import ProfitChart from './ProfitChart';
import ExchangeRates from './ExchangeRates';
import AmountSelector from './AmountSelector';
import ArbitrageDetailsModal from './ArbitrageDetailsModal';
import ArbitrageOpportunities from './ArbitrageOpportunities';
import AITradingAgent from './AITradingAgent';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'sonner';
import { fetchArbitrageOpportunities, executeArbitrageTrade } from '../services/financialDatasetAPI';

// Contract Config
const contractAddress = "0x0000000000000000000000000000000000000000"; // Replace with your contract address
const contractAbi = []; // Replace with your contract ABI

// 0x API Config - Updated to use the correct endpoint for v2
const BASE_0X_URL = "https://api.0x.org/swap/permit2/quote";
const API_KEY = ""; // Should be set via environment variable in production
const tradeInterval = 5000;

// Token Configuration
const POLYGON_USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
const POLYGON_USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const POLYGON_WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // WMATIC on Polygon

// USDT Contract ABI (Mínimo necessário para obter o saldo)
const USDT_ABI = [
  // balanceOf
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  // decimals
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  }
];

// Arbitrage Types
type ArbitrageType = 'normal' | 'triangular' | 'hot' | null;

interface TradeHistoryItem {
  timestamp: number;
  sellAmount: string;
  buyAmount: string;
  txHash: string;
  arbitrageType: ArbitrageType;
}

interface ExchangeRate {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
}

interface ArbitrageOpportunity {
  id: string;
  route: string;
  profit: number;
  timestamp: string;
  type: 'normal' | 'triangular' | 'hot';
}

const ArbitrageSystem: React.FC = () => {
  // System states
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [profit, setProfit] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [nextArbitrageTime, setNextArbitrageTime] = useState(60);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [currentArbitrageType, setCurrentArbitrageType] = useState<ArbitrageType>(null);
  const [selectedAmount, setSelectedAmount] = useState(100); // Default trade amount
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [opportunityFilterType, setOpportunityFilterType] = useState('all'); // 'all', 'normal', 'triangular', 'hot'
  const [isAIAgentActive, setIsAIAgentActive] = useState(false);
  
  // Stats
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  
  // Exchange rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [chartData, setChartData] = useState<{ timestamp: string; profit: number }[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  
  // Contract instance
  const [arbitrageContract, setArbitrageContract] = useState<ethers.Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<ethers.Contract | null>(null);

  // Get provider and signer
  const getProviderAndSigner = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        // Reset state completely to ensure a fresh connection
        setProvider(null);
        setSigner(null);
        setWalletAddress('');
        setWalletBalance(0);
        setIsConnected(false);
        setArbitrageContract(null);
        setUsdtContract(null);
        
        // Force MetaMask to show the connect popup
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error("Nenhuma conta MetaMask disponível");
        }
        
        // Create a new provider instance
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Verificar se estamos na rede Polygon (chainId 137)
        const network = await web3Provider.getNetwork();
        if (network.chainId !== 137) {
          try {
            // Solicitar mudança para Polygon
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x89' }], // 0x89 é o ID hexadecimal da Polygon
            });
            
            // Refresh provider after chain switch
            const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(updatedProvider);
            
            const updatedSigner = updatedProvider.getSigner();
            setSigner(updatedSigner);
            
            const address = await updatedSigner.getAddress();
            setWalletAddress(address);
            
            // Criar instância do contrato USDT
            const usdtContractInstance = new ethers.Contract(POLYGON_USDT, USDT_ABI, updatedProvider);
            setUsdtContract(usdtContractInstance);
            
            // Obter o saldo em USDT
            const usdtBalance = await usdtContractInstance.balanceOf(address);
            const usdtDecimals = await usdtContractInstance.decimals();
            const formattedUsdtBalance = parseFloat(ethers.utils.formatUnits(usdtBalance, usdtDecimals));
            setWalletBalance(formattedUsdtBalance);
            
            // Initialize arbitrage contract
            const contract = new ethers.Contract(contractAddress, contractAbi, updatedSigner);
            setArbitrageContract(contract);
            
            setIsConnected(true);
            toast.success("Carteira conectada com sucesso na rede Polygon!");
            return { web3Provider: updatedProvider, web3Signer: updatedSigner };
            
          } catch (switchError: any) {
            // Se a rede não estiver adicionada, adicione-a
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x89',
                      chainName: 'Polygon Mainnet',
                      nativeCurrency: {
                        name: 'MATIC',
                        symbol: 'MATIC',
                        decimals: 18
                      },
                      rpcUrls: ['https://polygon-rpc.com'],
                      blockExplorerUrls: ['https://polygonscan.com/']
                    }
                  ],
                });
                
                // Try connecting again after adding the network
                return getProviderAndSigner();
              } catch (addError) {
                console.error("Erro ao adicionar rede Polygon:", addError);
                toast.error("Falha ao adicionar rede Polygon. Por favor, adicione manualmente.");
                throw addError;
              }
            } else {
              console.error("Erro ao mudar para rede Polygon:", switchError);
              toast.error("Falha ao mudar para a rede Polygon. Por favor, mude manualmente.");
              throw switchError;
            }
          }
        }
        
        // If we're already on Polygon, proceed with the connection
        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        // Criar instância do contrato USDT
        const usdtContractInstance = new ethers.Contract(POLYGON_USDT, USDT_ABI, web3Provider);
        
        // Obter o saldo em USDT
        const usdtBalance = await usdtContractInstance.balanceOf(address);
        const usdtDecimals = await usdtContractInstance.decimals();
        const formattedUsdtBalance = parseFloat(ethers.utils.formatUnits(usdtBalance, usdtDecimals));
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setWalletAddress(address);
        setWalletBalance(formattedUsdtBalance);
        setIsConnected(true);
        setUsdtContract(usdtContractInstance);
        
        // Initialize contract
        const contract = new ethers.Contract(contractAddress, contractAbi, web3Signer);
        setArbitrageContract(contract);
        
        toast.success("Carteira conectada com sucesso!");
        console.log("Carteira conectada:", address);
        console.log("Saldo USDT:", formattedUsdtBalance);
        
        // Add listener for account changes
        window.ethereum.on('accountsChanged', () => {
          toast.info("Conta da carteira alterada. Reconectando...");
          disconnectWallet();
          setTimeout(() => connectWallet(), 500);
        });
        
        // Add listener for chain changes
        window.ethereum.on('chainChanged', () => {
          toast.info("Rede alterada. Reconectando...");
          disconnectWallet();
          setTimeout(() => connectWallet(), 500);
        });
        
        return { web3Provider, web3Signer };
      } else {
        toast.error("MetaMask não detectada. Use um navegador com MetaMask instalada.");
        throw new Error("MetaMask não detectada");
      }
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
      toast.error("Falha ao conectar carteira. Verifique se a MetaMask está instalada e desbloqueada.");
      return { web3Provider: null, web3Signer: null };
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    await getProviderAndSigner();
  }, [getProviderAndSigner]);

  // Disconnect wallet - make sure to clean up everything
  const disconnectWallet = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    }
    if (isAIAgentActive) {
      setIsAIAgentActive(false);
    }
    
    // Remove event listeners if they exist
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
    
    // Clear all wallet-related state
    setProvider(null);
    setSigner(null);
    setWalletAddress('');
    setWalletBalance(0);
    setIsConnected(false);
    setArbitrageContract(null);
    setUsdtContract(null);
    setCurrentArbitrageType(null);
    
    toast.info("Carteira desconectada");
    console.log("Carteira desconectada");
  }, [isRunning, isAIAgentActive]);

  // Toggle running state
  const toggleRunning = () => {
    if (!isConnected && !isRunning) {
      toast.error("Por favor, conecte sua carteira primeiro");
      return;
    }
    setIsRunning(!isRunning);
    toast.info(isRunning ? "Sistema pausado" : "Sistema iniciado");
  };

  // Toggle AI Agent
  const toggleAIAgent = () => {
    if (!isConnected && !isAIAgentActive) {
      toast.error("Por favor, conecte sua carteira primeiro");
      return;
    }
    setIsAIAgentActive(!isAIAgentActive);
    toast.info(isAIAgentActive ? "Agente de IA desativado" : "Agente de IA ativado");
    
    // If turning on AI agent, turn off manual system
    if (!isAIAgentActive && isRunning) {
      setIsRunning(false);
      toast.info("Sistema manual pausado enquanto o agente de IA está ativo");
    }
  };

  // Function to handle arbitrage completion by the AI agent
  const handleAIArbitrageComplete = (profitAmount: number, type: 'normal' | 'triangular' | 'hot') => {
    // Update current profit
    setProfit((prev) => prev + profitAmount);
    
    // Update stats
    setTotalTransactions((prev) => prev + 1);
    const newSuccessRate = (successRate * totalTransactions + 100) / (totalTransactions + 1);
    setSuccessRate(newSuccessRate);
    setAverageProfit((averageProfit * totalTransactions + profitAmount) / (totalTransactions + 1));
    
    // Set current type
    setCurrentArbitrageType(type);
    
    // Add to trade history
    const newTradeItem = {
      timestamp: Date.now(),
      sellAmount: selectedAmount.toString(),
      buyAmount: (selectedAmount + profitAmount).toString(),
      txHash: "0x" + Math.random().toString(16).substring(2, 42), // Simulated transaction hash
      arbitrageType: type
    };
    
    setTradeHistory((prev) => [...prev, newTradeItem]);
    
    // Update chart data
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setChartData((prev) => [
      ...prev, 
      { 
        timestamp: timeString, 
        profit: profitAmount
      }
    ]);
  };

  // Function to fetch real opportunities from the financial datasets API
  const fetchOpportunities = useCallback(async () => {
    try {
      if (isConnected) {
        console.log("Generating dynamic arbitrage opportunities...");
        const opportunities = await fetchArbitrageOpportunities();
        setOpportunities(opportunities);
      }
    } catch (error) {
      console.error("Erro ao buscar oportunidades:", error);
    }
  }, [isConnected]);

  // Re-fetch exchange rates periodically
  useEffect(() => {
    fetchExchangeRates();
    fetchOpportunities();
    
    const rateInterval = setInterval(fetchExchangeRates, 8000);
    const opportunitiesInterval = setInterval(fetchOpportunities, 8000);
    
    return () => {
      clearInterval(rateInterval);
      clearInterval(opportunitiesInterval);
    };
  }, [fetchExchangeRates, fetchOpportunities]);

  // Function to fetch quotes from 0x API v2
  const getQuote = async (sellToken: string, buyToken: string, sellAmount: string, arbitrageType: ArbitrageType = 'normal') => {
    try {
      const headers = {
        "0x-api-key": API_KEY,
        "0x-version": "v2"
      };

      const params: any = {
        chainId: 137, // Polygon
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage: "0.01" // 1% slippage
      };

      if (walletAddress) {
        params.taker = walletAddress;
      }

      const response = await axios.get(BASE_0X_URL, { 
        params,
        headers: API_KEY ? headers : undefined // Only send headers if API key is set
      });
      
      return {
        ...response.data,
        arbitrageType
      };
    } catch (error) {
      console.error("Erro ao obter cotação:", error);
      return null;
    }
  };

  // Execute normal arbitrage (direct swap)
  const executeNormalArbitrage = async () => {
    if (!signer) return null;
    
    try {
      setCurrentArbitrageType('normal');
      const sellAmount = ethers.utils.parseUnits(selectedAmount.toString(), 6); // Convert to USDC decimals
      const sellToken = POLYGON_USDC;
      const buyToken = POLYGON_USDT;

      toast.info("Buscando cotações para arbitragem normal...");
      const quote = await getQuote(sellToken, buyToken, sellAmount.toString(), 'normal');
      
      if (!quote) {
        toast.error("Falha ao obter cotações para arbitragem normal");
        return null;
      }

      console.log("Cotações obtidas (normal):", quote);
      return quote;
    } catch (error) {
      console.error("Erro na arbitragem normal:", error);
      return null;
    }
  };

  // Execute triangular arbitrage (three-token swap)
  const executeTriangularArbitrage = async () => {
    if (!signer) return null;
    
    try {
      setCurrentArbitrageType('triangular');
      // USDC -> WMATIC -> USDT -> USDC
      const sellAmount = ethers.utils.parseUnits(selectedAmount.toString(), 6); // Convert to USDC decimals
      
      toast.info("Buscando cotações para arbitragem triangular...");
      
      // Step 1: USDC -> WMATIC
      const quote1 = await getQuote(POLYGON_USDC, POLYGON_WMATIC, sellAmount.toString(), 'triangular');
      
      if (!quote1) {
        toast.error("Falha ao obter cotações para passo 1 da arbitragem triangular");
        return null;
      }
      
      // Step 2: WMATIC -> USDT
      const maticAmount = quote1.buyAmount;
      const quote2 = await getQuote(POLYGON_WMATIC, POLYGON_USDT, maticAmount, 'triangular');
      
      if (!quote2) {
        toast.error("Falha ao obter cotações para passo 2 da arbitragem triangular");
        return null;
      }
      
      // Step 3: USDT -> USDC
      const usdtAmount = quote2.buyAmount;
      const quote3 = await getQuote(POLYGON_USDT, POLYGON_USDC, usdtAmount, 'triangular');
      
      if (!quote3) {
        toast.error("Falha ao obter cotações para passo 3 da arbitragem triangular");
        return null;
      }
      
      // Calculate triangular arbitrage profit
      const initialAmount = parseFloat(ethers.utils.formatUnits(sellAmount, 6));
      const finalAmount = parseFloat(ethers.utils.formatUnits(ethers.BigNumber.from(quote3.buyAmount), 6));
      const profit = finalAmount - initialAmount;
      
      console.log(`Arbitragem triangular: ${initialAmount} USDC -> ${quote1.buyAmount} WMATIC -> ${quote2.buyAmount} USDT -> ${finalAmount} USDC`);
      console.log(`Lucro potencial: ${profit} USDC`);
      
      if (profit <= 0) {
        console.log("Sem oportunidade lucrativa em arbitragem triangular");
        return null;
      }
      
      return {
        ...quote3,
        profit,
        arbitrageType: 'triangular'
      };
    } catch (error) {
      console.error("Erro na arbitragem triangular:", error);
      return null;
    }
  };

  // Execute hot arbitrage (cross-exchange immediate opportunity)
  const executeHotArbitrage = async () => {
    if (!signer) return null;
    
    try {
      setCurrentArbitrageType('hot');
      const sellAmount = ethers.utils.parseUnits(selectedAmount.toString(), 6); // Convert to USDC decimals
      const sellToken = POLYGON_USDC;
      const buyToken = POLYGON_USDT;

      toast.info("Buscando cotações para arbitragem hot...");
      
      // For a real hot arbitrage, you would query multiple exchanges and compare
      // For now, we'll simulate by checking the 0x API with a higher expected return
      const quote = await getQuote(sellToken, buyToken, sellAmount.toString(), 'hot');
      
      if (!quote) {
        toast.error("Falha ao obter cotações para arbitragem hot");
        return null;
      }

      console.log("Cotações obtidas (hot):", quote);
      return quote;
    } catch (error) {
      console.error("Erro na arbitragem hot:", error);
      return null;
    }
  };

  // Execute the most profitable arbitrage strategy
  const executeBestArbitrage = useCallback(async () => {
    if (!isRunning || !arbitrageContract || !signer) return;
    
    try {
      toast.info("Analisando oportunidades de arbitragem...");
      
      // Try all arbitrage types in parallel
      const [normalQuote, triangularQuote, hotQuote] = await Promise.all([
        executeNormalArbitrage(),
        executeTriangularArbitrage(),
        executeHotArbitrage()
      ]);
      
      // Find the most profitable opportunity
      let bestQuote = null;
      let bestProfit = 0;
      let bestType: ArbitrageType = null;
      
      if (normalQuote && parseFloat(normalQuote.buyAmount) > parseFloat(normalQuote.sellAmount)) {
        const profit = parseFloat(ethers.utils.formatUnits(
          ethers.BigNumber.from(normalQuote.buyAmount).sub(ethers.BigNumber.from(normalQuote.sellAmount)), 
          6
        ));
        if (profit > bestProfit) {
          bestProfit = profit;
          bestQuote = normalQuote;
          bestType = 'normal';
        }
      }
      
      if (triangularQuote && triangularQuote.profit > bestProfit) {
        bestProfit = triangularQuote.profit;
        bestQuote = triangularQuote;
        bestType = 'triangular';
      }
      
      if (hotQuote && parseFloat(hotQuote.buyAmount) > parseFloat(hotQuote.sellAmount)) {
        const profit = parseFloat(ethers.utils.formatUnits(
          ethers.BigNumber.from(hotQuote.buyAmount).sub(ethers.BigNumber.from(hotQuote.sellAmount)), 
          6
        ));
        if (profit > bestProfit) {
          bestProfit = profit;
          bestQuote = hotQuote;
          bestType = 'hot';
        }
      }
      
      if (!bestQuote || bestProfit <= 0) {
        console.log("Sem oportunidades lucrativas no momento");
        setCurrentArbitrageType(null);
        
        // Set new random time for next arbitrage attempt
        const newTime = Math.floor(Math.random() * 90) + 30;
        setNextArbitrageTime(newTime);
        return;
      }
      
      // Execute the most profitable arbitrage
      setCurrentArbitrageType(bestType);
      toast.success(`Oportunidade detectada em arbitragem ${bestType}, executando...`);
      
      try {
        // In a real system, these would be real transactions
        // For demonstration, we'll simulate a successful transaction
        // const tx = await arbitrageContract.executeArbitrage(...);
        // const receipt = await tx.wait();
        
        // Simulate transaction confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calculate profit
        const profitAmount = bestProfit;
        
        // Update UI
        setProfit((prev) => prev + profitAmount);
        setTotalTransactions((prev) => prev + 1);
        
        const newSuccessRate = (successRate * totalTransactions + 100) / (totalTransactions + 1);
        setSuccessRate(newSuccessRate);
        
        setAverageProfit((averageProfit * totalTransactions + profitAmount) / (totalTransactions + 1));
        
        // Add to trade history
        const newTradeItem = {
          timestamp: Date.now(),
          sellAmount: bestQuote.sellAmount,
          buyAmount: bestQuote.buyAmount,
          txHash: "0x" + Math.random().toString(16).substring(2, 42), // Simulated transaction hash
          arbitrageType: bestType
        };
        
        setTradeHistory((prev) => [...prev, newTradeItem]);
        
        // Update chart data
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setChartData((prev) => [
          ...prev, 
          { 
            timestamp: timeString, 
            profit: profitAmount 
          }
        ]);
        
        toast.success(`Arbitragem ${bestType} concluída! Lucro: $${profitAmount.toFixed(2)}`);
      } catch (error) {
        console.error(`Erro na execução da arbitragem ${bestType}:`, error);
        toast.error(`Falha ao executar arbitragem ${bestType}`);
      }
      
      // Set new random time for next arbitrage (between 30s and 2min)
      const newTime = Math.floor(Math.random() * 90) + 30;
      setNextArbitrageTime(newTime);
      
    } catch (error) {
      console.error("Erro no processo de arbitragem:", error);
      toast.error("Erro durante o processo de arbitragem");
      setCurrentArbitrageType(null);
    }
  }, [isRunning, arbitrageContract, signer, successRate, totalTransactions, averageProfit, selectedAmount]);

  // Handle arbitrage completion
  const handleArbitrageComplete = useCallback(() => {
    if (isRunning) {
      executeBestArbitrage();
    }
  }, [isRunning, executeBestArbitrage]);

  // Update exchange rates with more significant differences to trigger arbitrage opportunities
  const fetchExchangeRates = useCallback(async () => {
    // In a real application, you would fetch actual rates from exchanges
    // Here we're simulating with more significant differences to ensure arbitrage opportunities
    const basePrice = 0.998 + (Math.random() * 0.004); // Base price around 1.0
    
    const mockExchangeRates = [
      { 
        exchange: 'Binance', 
        symbol: 'USDC/USDT', 
        price: basePrice, 
        change24h: 0.05 + (Math.random() * 0.2) - 0.1 
      },
      { 
        exchange: 'Coinbase', 
        symbol: 'USDC/USDT', 
        // Create larger price difference (0.1-0.5% difference)
        price: basePrice + (Math.random() * 0.005), 
        change24h: 0.03 + (Math.random() * 0.15) - 0.05 
      },
      { 
        exchange: 'Kraken', 
        symbol: 'USDC/USDT', 
        // Create significant difference for arbitrage
        price: basePrice - (Math.random() * 0.004), 
        change24h: -0.02 + (Math.random() * 0.12) 
      },
      { 
        exchange: 'FTX', 
        symbol: 'USDC/USDT', 
        price: basePrice + (Math.random() * 0.003), 
        change24h: 0.04 + (Math.random() * 0.18) - 0.09 
      },
      { 
        exchange: 'Huobi', 
        symbol: 'USDC/USDT', 
        // Occasional high arbitrage opportunity
        price: (Math.random() > 0.8) ? basePrice + (0.008) : basePrice + (Math.random() * 0.002), 
        change24h: -0.01 + (Math.random() * 0.14) 
      },
      { 
        exchange: '0x API', 
        symbol: 'USDC/USDT', 
        price: basePrice - (Math.random() * 0.003), 
        change24h: 0.02 + (Math.random() * 0.16) - 0.08 
      }
    ];
    
    // Generate mock opportunities with the requested color coding by type
    const mockOpportunities: ArbitrageOpportunity[] = [
      {
        id: '1',
        route: 'DOT → LINK → BNB → DOT',
        profit: 7.29,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'triangular'
      },
      {
        id: '2',
        route: 'CAKE → BUSD → BNB → CAKE',
        profit: 5.13,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'triangular'
      },
      {
        id: '3',
        route: 'USDT → LINK → ETH → USDT',
        profit: 4.96,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'normal'
      },
      {
        id: '4',
        route: 'ETH → LINK → USDT → ETH',
        profit: 7.87,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'hot'
      },
      {
        id: '5',
        route: 'ETH → LINK → BUSD → ETH',
        profit: 7.82,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'triangular'
      },
      {
        id: '6',
        route: 'LINK → BUSD → XRP → LINK',
        profit: 7.31,
        timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        type: 'hot'
      }
    ];
    
    setExchangeRates(mockExchangeRates);
    setOpportunities(mockOpportunities);
  }, []);

  // Execute selected arbitrage opportunity with real API
  const executeSelectedOpportunity = useCallback(async () => {
    if (!selectedOpportunity || !isConnected) return;
    
    toast.loading(`Executando arbitragem ${selectedOpportunity.type} com $${selectedAmount}...`);
    setDetailsModalOpen(false);
    
    try {
      const result = await executeArbitrageTrade(selectedOpportunity.id, selectedAmount);
      
      if (result.success && result.finalAmount) {
        const profitAmount = result.finalAmount - selectedAmount;
        setProfit(prev => prev + profitAmount);
        setTotalTransactions(prev => prev + 1);
        
        // Update success rate
        const newSuccessRate = (successRate * totalTransactions + 100) / (totalTransactions + 1);
        setSuccessRate(newSuccessRate);
        
        // Update average profit
        setAverageProfit((averageProfit * totalTransactions + profitAmount) / (totalTransactions + 1));
        
        // Add to trade history
        const newTradeItem = {
          timestamp: Date.now(),
          sellAmount: selectedAmount.toString(),
          buyAmount: result.finalAmount.toString(),
          txHash: result.txHash || "0x0",
          arbitrageType: selectedOpportunity.type
        };
        
        setTradeHistory((prev) => [...prev, newTradeItem]);
        
        // Update chart data
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setChartData((prev) => [
          ...prev, 
          { 
            timestamp: timeString, 
            profit: profitAmount
          }
        ]);
        
        toast.success(`Arbitragem concluída! Lucro: $${profitAmount.toFixed(2)} USDT`);
      } else {
        toast.error(`Falha na arbitragem: ${result.error}`);
      }
    } catch (error) {
      console.error("Erro ao executar arbitragem:", error);
      toast.error("Erro ao executar arbitragem");
    }
  }, [selectedOpportunity, selectedAmount, isConnected, totalTransactions, successRate, averageProfit]);

  // Refresh data - improved to properly update wallet balance
  const refreshData = useCallback(async () => {
    toast.loading("Atualizando dados...");
    
    if (isConnected && signer && usdtContract) {
      try {
        const address = await signer.getAddress();
        
        // Obter o saldo atualizado em USDT
        const usdtBalance = await usdtContract.balanceOf(address);
        const usdtDecimals = await usdtContract.decimals();
        const formattedUsdtBalance = parseFloat(ethers.utils.formatUnits(usdtBalance, usdtDecimals));
        
        setWalletBalance(formattedUsdtBalance);
        console.log("Saldo USDT atualizado:", formattedUsdtBalance);
        toast.success(`Saldo USDT atualizado: ${formattedUsdtBalance}`);
      } catch (error) {
        console.error("Erro ao atualizar saldo:", error);
        toast.error("Falha ao atualizar saldo. Tente novamente.");
      }
    }
    
    await Promise.all([fetchExchangeRates(), fetchOpportunities()]);
    toast.success("Dados atualizados");
  }, [isConnected, signer, usdtContract, fetchExchangeRates, fetchOpportunities]);

  // Get background color for arbitrage type indicator
  const getArbitrageTypeColor = () => {
    switch (currentArbitrageType) {
      case 'normal':
        return 'bg-blue-500';
      case 'triangular':
        return 'bg-green-500';
      case 'hot':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get display name for arbitrage type
  const getArbitrageTypeDisplay = () => {
    switch (currentArbitrageType) {
      case 'normal':
        return 'Normal';
      case 'triangular':
        return 'Triangular';
      case 'hot':
        return 'Hot';
      default:
        return 'Nenhuma';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-crypto-blue to-crypto-purple bg-clip-text text-transparent">
          Crypto Arbitrage Vision Hub
        </h1>
        
        <div className="flex gap-2 items-center mt-4 md:mt-0">
          <StatusLED active={isConnected} label="Conectado" />
          <StatusLED active={isRunning || isAIAgentActive} label="Em execução" />
          
          <div className="px-3 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
            <span className="text-muted-foreground">Estratégia:</span>
            <span className={`px-2 py-0.5 rounded ${getArbitrageTypeColor()} text-white`}>
              {getArbitrageTypeDisplay()}
            </span>
          </div>
          
          <WalletStatus 
            connected={isConnected}
            walletAddress={walletAddress}
            balance={walletBalance}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ProfitDisplay currentProfit={profit} currency="USDT" className="md:col-span-2" />
        <CountdownTimer 
          initialTime={nextArbitrageTime} 
          onComplete={handleArbitrageComplete} 
          isRunning={isRunning && !isAIAgentActive}
        />
      </div>
      
      {/* New AI Trading Agent Component */}
      <div className="mb-6">
        <AITradingAgent
          isActive={isAIAgentActive}
          walletConnected={isConnected}
          onToggle={toggleAIAgent}
          selectedAmount={selectedAmount}
          onArbitrageComplete={handleAIArbitrageComplete}
        />
      </div>
      
      {/* Amount Selector */}
      <div className="mb-6">
        <AmountSelector 
          selectedAmount={selectedAmount} 
          onSelectAmount={setSelectedAmount} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ControlButton 
          icon={isRunning ? Pause : Play} 
          label={isRunning ? "Pausar" : "Iniciar"} 
          onClick={toggleRunning}
          variant={isRunning ? "destructive" : "default"}
          active={isRunning}
          disabled={!isConnected || isAIAgentActive}
        />
        <ControlButton 
          icon={isConnected ? Wifi : WifiOff} 
          label={isConnected ? "Desconectar Wallet" : "Conectar Wallet"} 
          onClick={isConnected ? disconnectWallet : connectWallet}
          variant="secondary"
          active={isConnected}
        />
        <ControlButton 
          icon={RefreshCw} 
          label="Atualizar Dados" 
          onClick={refreshData}
          variant="outline"
        />
      </div>
      
      <ArbitrageStats 
        totalTransactions={totalTransactions} 
        successRate={successRate} 
        averageProfit={averageProfit} 
        className="mb-6"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProfitChart data={chartData.length > 0 ? chartData : [{ timestamp: "00:00", profit: 0 }]} />
        <ExchangeRates 
          rates={exchangeRates} 
          onSelectArbitrage={handleSelectArbitrage}
        />
      </div>
      
      {/* Arbitrage Opportunities */}
      <div className="mb-6">
        <ArbitrageOpportunities 
          opportunities={opportunities}
          selectedType={opportunityFilterType}
          onSelectType={setOpportunityFilterType}
          onSelectOpportunity={handleOpenDetails}
        />
      </div>
      
      {/* Arbitrage Details Modal */}
      {selectedOpportunity && (
        <ArbitrageDetailsModal 
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          route={selectedOpportunity.route}
          estimatedProfit={selectedOpportunity.profit}
          investmentAmount={selectedAmount}
          onExecute={executeSelectedOpportunity}
          onValidate={() => toast.info("Validando arbitragem...")}
          arbitrageType={selectedOpportunity.type as ArbitrageType}
          profitDetails={getProfitDetails((selectedOpportunity.profit / 100) * selectedAmount)}
        />
      )}
    </div>
  );
};

export default ArbitrageSystem;
