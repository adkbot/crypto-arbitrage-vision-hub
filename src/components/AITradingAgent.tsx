
import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Brain, Zap, AlertTriangle, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchArbitrageOpportunities, executeArbitrageTrade } from '@/services/financialDatasetAPI';

interface AIAgentProps {
  isActive: boolean;
  walletConnected: boolean;
  onToggle: () => void;
  selectedAmount: number;
  onArbitrageComplete: (profit: number, type: 'normal' | 'triangular' | 'hot') => void;
}

interface ArbitrageLog {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

const AITradingAgent: React.FC<AIAgentProps> = ({
  isActive,
  walletConnected,
  onToggle,
  selectedAmount,
  onArbitrageComplete
}) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'executing' | 'completed'>('idle');
  const [agentLogs, setAgentLogs] = useState<ArbitrageLog[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState('');
  const [opportunityCount, setOpportunityCount] = useState(0);
  
  // Add a log entry
  const addLog = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setAgentLogs(prev => [
      {
        timestamp,
        message,
        type
      },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  // Simulate thinking animation with dots
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (status === 'scanning' || status === 'executing') {
      interval = setInterval(() => {
        setThinkingDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 500);
    } else {
      setThinkingDots('');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Main AI agent logic
  const runAgentLogic = useCallback(async () => {
    if (!isActive || !walletConnected) return;

    try {
      // Phase 1: Scanning for opportunities
      setStatus('scanning');
      addLog('Iniciando busca por oportunidades de arbitragem', 'info');
      addLog('Conectando à API financialdatasets.ai', 'info');
      
      // Fetch real arbitrage opportunities
      const opportunities = await fetchArbitrageOpportunities();
      
      if (!opportunities || opportunities.length === 0) {
        addLog('Nenhuma oportunidade de arbitragem encontrada neste momento', 'warning');
        setStatus('idle');
        return;
      }
      
      setOpportunityCount(opportunities.length);
      addLog(`${opportunities.length} oportunidades identificadas`, 'success');
      
      // Find the best opportunity
      const bestOpportunity = opportunities[0];
      addLog(`Melhor oportunidade: ${bestOpportunity.route}`, 'success');
      addLog(`Lucro potencial: ${bestOpportunity.profit.toFixed(2)}%`, 'info');
      setCurrentStrategy(bestOpportunity.route);
      
      // Phase 2: Executing trade
      setStatus('executing');
      addLog('Preparando execução de arbitragem', 'info');
      addLog(`Valor de entrada: ${selectedAmount} USDT`, 'info');
      
      // Execute the arbitrage trade
      const result = await executeArbitrageTrade(bestOpportunity.id, selectedAmount);
      
      if (result.success) {
        const profit = (result.finalAmount - selectedAmount);
        addLog(`Arbitragem concluída com sucesso!`, 'success');
        addLog(`Lucro realizado: ${profit.toFixed(2)} USDT`, 'success');
        
        // Notify the parent component
        onArbitrageComplete(profit, bestOpportunity.type as 'normal' | 'triangular' | 'hot');
        toast.success(`Arbitragem concluída! Lucro: ${profit.toFixed(2)} USDT`);
      } else {
        addLog(`Falha na execução: ${result.error}`, 'error');
        toast.error(`Falha na arbitragem: ${result.error}`);
      }
      
      setStatus('completed');
      
      // Reset after 5 seconds if agent is still active
      setTimeout(() => {
        if (isActive) {
          setStatus('idle');
          setCurrentStrategy(null);
        }
      }, 5000);
      
    } catch (error) {
      console.error('AI Agent error:', error);
      addLog(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`, 'error');
      setStatus('idle');
      toast.error('Erro durante operação do agente de IA');
    }
  }, [isActive, walletConnected, selectedAmount, onArbitrageComplete]);

  // Run the agent logic periodically
  useEffect(() => {
    if (!isActive || !walletConnected) return;
    
    if (status === 'idle') {
      // Start immediately on activation
      runAgentLogic();
    }
    
    // Then run periodically (more frequently to find opportunities)
    const interval = setInterval(() => {
      if (status === 'idle') {
        runAgentLogic();
      }
    }, 15000 + (Math.random() * 5000)); // 15-20 seconds
    
    return () => clearInterval(interval);
  }, [isActive, walletConnected, status, runAgentLogic]);

  // Reset on deactivation
  useEffect(() => {
    if (!isActive) {
      setStatus('idle');
      setCurrentStrategy(null);
    } else {
      // When activated, add initial log entries
      addLog('Agente de IA de arbitragem ativado', 'info');
      addLog('Iniciando análise de mercado', 'info');
    }
  }, [isActive]);

  // When first mounted, add intro log
  useEffect(() => {
    addLog('Agente de IA de arbitragem inicializado', 'info');
    addLog('Conectado ao sistema principal', 'info');
    addLog('Aguardando ativação para buscar oportunidades', 'info');
  }, []);

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-lg font-semibold">Agente de IA de Arbitragem</CardTitle>
          </div>
          
          <Badge 
            variant={isActive ? "default" : "outline"} 
            className={`${isActive ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Agent Status */}
        <div className="mb-3 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            status === 'idle' ? 'bg-slate-400' :
            status === 'scanning' ? 'bg-blue-500 animate-pulse' :
            status === 'executing' ? 'bg-amber-500 animate-pulse' :
            'bg-green-500'
          }`} />
          
          <span className="text-sm font-medium">
            {status === 'idle' ? 'Aguardando' :
            status === 'scanning' ? `Analisando mercado${thinkingDots}` :
            status === 'executing' ? `Executando arbitragem${thinkingDots}` :
            'Operação concluída'}
          </span>
          
          {opportunityCount > 0 && status !== 'idle' && (
            <span className="text-xs font-medium bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full ml-auto">
              {opportunityCount} oportunidades
            </span>
          )}
        </div>
        
        {/* Current Strategy */}
        {currentStrategy && (
          <div className="mb-3 p-2 bg-background/50 rounded-md border border-border">
            <div className="text-xs text-muted-foreground mb-1">Estratégia em execução:</div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">{currentStrategy}</span>
            </div>
          </div>
        )}
        
        {/* Agent Logs */}
        <div className="max-h-[200px] overflow-y-auto rounded-md border border-border bg-background/50">
          <div className="p-2 text-xs text-muted-foreground border-b border-border">
            Log de atividades
          </div>
          <div className="p-2 space-y-1">
            {agentLogs.length > 0 ? (
              agentLogs.map((log, index) => (
                <div key={index} className="text-xs flex gap-1">
                  <span className="text-muted-foreground">[{log.timestamp}]</span>
                  <span className={`flex-1 ${
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'success' ? 'text-green-500' :
                    log.type === 'warning' ? 'text-amber-500' :
                    'text-foreground'
                  }`}>
                    {log.type === 'error' && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                    {log.type === 'success' && <Check className="inline h-3 w-3 mr-1" />}
                    {log.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">Nenhum log disponível</div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          onClick={onToggle}
          disabled={!walletConnected}
          variant={isActive ? "destructive" : "default"}
          size="sm"
          className="w-full"
        >
          {isActive ? (
            <>
              <Bot className="h-4 w-4 mr-2" /> Pausar Agente
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 mr-2" /> {walletConnected ? 'Ativar Agente' : 'Conecte sua carteira'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AITradingAgent;
