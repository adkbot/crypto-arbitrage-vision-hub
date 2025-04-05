
import React, { useState, useEffect } from 'react';
import { Play, Pause, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import StatusLED from './StatusLED';
import ProfitDisplay from './ProfitDisplay';
import ControlButton from './ControlButton';
import WalletStatus from './WalletStatus';
import ArbitrageStats from './ArbitrageStats';
import ProfitChart from './ProfitChart';
import ExchangeRates from './ExchangeRates';

// Mock data for demonstration
const mockExchangeRates = [
  { exchange: 'Binance', symbol: 'BTC/USDT', price: 48500.23, change24h: 1.25 },
  { exchange: 'Coinbase', symbol: 'BTC/USDT', price: 48650.78, change24h: 1.34 },
  { exchange: 'Kraken', symbol: 'BTC/USDT', price: 48400.56, change24h: 0.95 },
  { exchange: 'FTX', symbol: 'BTC/USDT', price: 48700.12, change24h: 1.42 },
  { exchange: 'Huobi', symbol: 'BTC/USDT', price: 48350.89, change24h: -0.25 },
  { exchange: 'Kucoin', symbol: 'BTC/USDT', price: 48675.34, change24h: 1.38 }
];

const mockProfitData = [
  { timestamp: '10:00 AM', profit: 12.35 },
  { timestamp: '11:00 AM', profit: 18.72 },
  { timestamp: '12:00 PM', profit: 15.43 },
  { timestamp: '01:00 PM', profit: 22.67 },
  { timestamp: '02:00 PM', profit: 19.85 },
  { timestamp: '03:00 PM', profit: 25.12 },
  { timestamp: '04:00 PM', profit: 28.45 },
  { timestamp: '05:00 PM', profit: 30.21 },
  { timestamp: '06:00 PM', profit: 24.78 }
];

const ArbitrageSystem: React.FC = () => {
  // System states
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [profit, setProfit] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [nextArbitrageTime, setNextArbitrageTime] = useState(60);
  
  // Stats
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);
  
  // Initialize wallet data for demo
  const demoWalletAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const demoWalletBalance = 2.5432;

  // Toggle system running state
  const toggleRunning = () => {
    if (!isConnected && !isRunning) {
      alert("Por favor, conecte sua carteira primeiro");
      return;
    }
    setIsRunning(!isRunning);
  };

  // Connect or disconnect wallet
  const connectWallet = () => {
    setWalletAddress(demoWalletAddress);
    setWalletBalance(demoWalletBalance);
    setIsConnected(true);
  };

  const disconnectWallet = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    setWalletAddress('');
    setWalletBalance(0);
    setIsConnected(false);
  };

  // Handle arbitrage completion
  const handleArbitrageComplete = () => {
    if (!isRunning) return;
    
    // Simulate a successful arbitrage transaction
    const profitAmount = (Math.random() * 5) + 0.5; // Random profit between $0.5 and $5.5
    setProfit((prev) => prev + profitAmount);
    
    // Update stats
    setTotalTransactions((prev) => prev + 1);
    const newSuccessRate = (successRate * totalTransactions + 100) / (totalTransactions + 1);
    setSuccessRate(newSuccessRate);
    setAverageProfit((averageProfit * totalTransactions + profitAmount) / (totalTransactions + 1));
    
    // Set new random time for next arbitrage (between 30s and 2min)
    const newTime = Math.floor(Math.random() * 90) + 30;
    setNextArbitrageTime(newTime);
  };

  // Handle selecting arbitrage opportunity between exchanges
  const handleSelectArbitrage = (fromExchange: string, toExchange: string) => {
    console.log(`Selected arbitrage route: ${fromExchange} -> ${toExchange}`);
    // In a real app, this would calculate and display the potential profit
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
          onClick={() => console.log("Refresh data")}
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
        <ProfitChart data={mockProfitData} />
        <ExchangeRates 
          rates={mockExchangeRates} 
          onSelectArbitrage={handleSelectArbitrage}
        />
      </div>
    </div>
  );
};

export default ArbitrageSystem;
