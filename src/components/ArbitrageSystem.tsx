
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
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'sonner';

// Contract Config
const contractAddress = "0x0000000000000000000000000000000000000000"; // Replace with your contract address
const contractAbi = []; // Replace with your contract ABI

// 0x API Config
const BASE_0X_URL = "https://polygon.api.0x.org/swap/v1/quote";
const tradeInterval = 5000;

// Token Configuration
const POLYGON_USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
const POLYGON_USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

interface TradeHistoryItem {
  timestamp: number;
  sellAmount: string;
  buyAmount: string;
  txHash: string;
}

interface ExchangeRate {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
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
  
  // Stats
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  
  // Exchange rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [chartData, setChartData] = useState<{ timestamp: string; profit: number }[]>([]);
  
  // Contract instance
  const [arbitrageContract, setArbitrageContract] = useState<ethers.Contract | null>(null);

  // Get provider and signer
  const getProviderAndSigner = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []); // Request connection to MetaMask
        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        const balance = parseFloat(ethers.utils.formatEther(await web3Provider.getBalance(address)));
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setWalletAddress(address);
        setWalletBalance(balance);
        setIsConnected(true);
        
        // Initialize contract
        const contract = new ethers.Contract(contractAddress, contractAbi, web3Signer);
        setArbitrageContract(contract);
        
        toast.success("Carteira conectada com sucesso!");
        return { web3Provider, web3Signer };
      } else {
        throw new Error("MetaMask não detectada. Use um navegador com MetaMask instalada.");
      }
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
      toast.error("Falha ao conectar carteira. Verifique se a MetaMask está instalada.");
      return { web3Provider: null, web3Signer: null };
    }
  }, []);

  // Function to fetch quotes from 0x API
  const getQuote = async (sellToken: string, buyToken: string, sellAmount: string) => {
    try {
      const params = {
        chainId: 137, // Polygon
        sellToken,
        buyToken,
        sellAmount,
        slippageBps: 100 // 1% slippage
      };
      const response = await axios.get(BASE_0X_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao obter cotação:", error);
      return null;
    }
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    await getProviderAndSigner();
  }, [getProviderAndSigner]);

  // Disconnect wallet
  const disconnectWallet = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    setProvider(null);
    setSigner(null);
    setWalletAddress('');
    setWalletBalance(0);
    setIsConnected(false);
    setArbitrageContract(null);
    toast.info("Carteira desconectada");
  };

  // Toggle running state
  const toggleRunning = () => {
    if (!isConnected && !isRunning) {
      toast.error("Por favor, conecte sua carteira primeiro");
      return;
    }
    setIsRunning(!isRunning);
    toast.info(isRunning ? "Sistema pausado" : "Sistema iniciado");
  };

  // Execute arbitrage
  const executeArbitrage = useCallback(async () => {
    if (!isRunning || !arbitrageContract || !signer) return;
    
    try {
      const sellAmount = ethers.utils.parseUnits("100", 6); // 100 USDC
      const sellToken = POLYGON_USDC;
      const buyToken = POLYGON_USDT;

      toast.info("Buscando cotações para arbitragem...");
      const quote = await getQuote(sellToken, buyToken, sellAmount.toString());
      
      if (!quote) {
        toast.error("Falha ao obter cotações");
        return;
      }

      console.log("Cotações obtidas:", quote);
      
      // Check if profitable opportunity exists
      if (parseFloat(quote.buyAmount) > parseFloat(quote.sellAmount)) {
        toast.success("Oportunidade detectada, executando arbitragem...");
        
        try {
          const tx = await arbitrageContract.executeArbitrage(
            quote.sellAmount,
            quote.minBuyAmount || ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(quote.buyAmount, 6)) * 0.99).toString(), 6),
            quote.data,
            { details: "0x", nonce: 0, amount: sellAmount, expiration: Math.floor(Date.now() / 1000) + 3600, spender: contractAddress, signatureLength: 0 },
            "0x"
          );
          
          toast.info("Transação enviada, aguardando confirmação...");
          const receipt = await tx.wait();
          
          // Calculate profit
          const profitAmount = parseFloat(ethers.utils.formatUnits(
            ethers.BigNumber.from(quote.buyAmount).sub(ethers.BigNumber.from(quote.sellAmount)), 
            6
          ));
          
          // Update UI
          setProfit((prev) => prev + profitAmount);
          setTotalTransactions((prev) => prev + 1);
          
          const newSuccessRate = (successRate * totalTransactions + 100) / (totalTransactions + 1);
          setSuccessRate(newSuccessRate);
          
          setAverageProfit((averageProfit * totalTransactions + profitAmount) / (totalTransactions + 1));
          
          // Add to trade history
          const newTradeItem = {
            timestamp: Date.now(),
            sellAmount: quote.sellAmount,
            buyAmount: quote.buyAmount,
            txHash: receipt.transactionHash
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
          
          toast.success(`Arbitragem concluída! Lucro: $${profitAmount.toFixed(2)}`);
        } catch (error) {
          console.error("Erro na execução da arbitragem:", error);
          toast.error("Falha ao executar arbitragem");
        }
      } else {
        console.log("Sem oportunidades lucrativas no momento");
      }
      
      // Set new random time for next arbitrage (between 30s and 2min)
      const newTime = Math.floor(Math.random() * 90) + 30;
      setNextArbitrageTime(newTime);
      
    } catch (error) {
      console.error("Erro no processo de arbitragem:", error);
      toast.error("Erro durante o processo de arbitragem");
    }
  }, [isRunning, arbitrageContract, signer, successRate, totalTransactions, averageProfit]);

  // Handle arbitrage completion
  const handleArbitrageComplete = useCallback(() => {
    if (isRunning) {
      executeArbitrage();
    }
  }, [isRunning, executeArbitrage]);

  // Update exchange rates
  const fetchExchangeRates = useCallback(async () => {
    // In a real application, you would fetch actual rates from exchanges
    // For now, we'll simulate with semi-realistic data
    const mockExchangeRates = [
      { exchange: 'Binance', symbol: 'USDC/USDT', price: 0.9998 + (Math.random() * 0.0005), change24h: 0.05 + (Math.random() * 0.2) - 0.1 },
      { exchange: 'Coinbase', symbol: 'USDC/USDT', price: 0.9997 + (Math.random() * 0.0006), change24h: 0.03 + (Math.random() * 0.15) - 0.05 },
      { exchange: 'Kraken', symbol: 'USDC/USDT', price: 0.9996 + (Math.random() * 0.0007), change24h: -0.02 + (Math.random() * 0.12) },
      { exchange: 'FTX', symbol: 'USDC/USDT', price: 0.9995 + (Math.random() * 0.0008), change24h: 0.04 + (Math.random() * 0.18) - 0.09 },
      { exchange: 'Huobi', symbol: 'USDC/USDT', price: 0.9999 + (Math.random() * 0.0004), change24h: -0.01 + (Math.random() * 0.14) },
      { exchange: '0x API', symbol: 'USDC/USDT', price: 1.0001 + (Math.random() * 0.0003), change24h: 0.02 + (Math.random() * 0.16) - 0.08 }
    ];
    setExchangeRates(mockExchangeRates);
  }, []);

  // Re-fetch exchange rates periodically
  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 15000);
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  // Handle selecting arbitrage opportunity between exchanges
  const handleSelectArbitrage = (fromExchange: string, toExchange: string) => {
    console.log(`Rota de arbitragem selecionada: ${fromExchange} -> ${toExchange}`);
    toast.info(`Rota de arbitragem: ${fromExchange} -> ${toExchange}`);
    // In a real app, this would calculate and display the potential profit
  };

  // Refresh data
  const refreshData = async () => {
    toast.info("Atualizando dados...");
    if (isConnected && signer) {
      try {
        const address = await signer.getAddress();
        const balance = parseFloat(ethers.utils.formatEther(await provider!.getBalance(address)));
        setWalletBalance(balance);
      } catch (error) {
        console.error("Erro ao atualizar saldo:", error);
      }
    }
    fetchExchangeRates();
    toast.success("Dados atualizados");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-crypto-blue to-crypto-purple bg-clip-text text-transparent">
          Crypto Arbitrage Vision Hub
        </h1>
        
        <div className="flex gap-2 items-center mt-4 md:mt-0">
          <StatusLED active={isConnected} label="Conectado" />
          <StatusLED active={isRunning} label="Em execução" />
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
        <ProfitDisplay currentProfit={profit} currency="USD" className="md:col-span-2" />
        <CountdownTimer 
          initialTime={nextArbitrageTime} 
          onComplete={handleArbitrageComplete} 
          isRunning={isRunning}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ControlButton 
          icon={isRunning ? Pause : Play} 
          label={isRunning ? "Pausar" : "Iniciar"} 
          onClick={toggleRunning}
          variant={isRunning ? "destructive" : "default"}
          active={isRunning}
          disabled={!isConnected}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfitChart data={chartData.length > 0 ? chartData : [{ timestamp: "00:00", profit: 0 }]} />
        <ExchangeRates 
          rates={exchangeRates} 
          onSelectArbitrage={handleSelectArbitrage}
        />
      </div>
    </div>
  );
};

export default ArbitrageSystem;
