
import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BacktestingResult {
  period: string;
  totalTrades: number;
  successRate: number;
  profitLoss: number;
  roi: number;
}

interface BacktestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BacktestingModal: React.FC<BacktestingModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [results, setResults] = useState<BacktestingResult[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');

  const runBacktest = () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    
    // Lista de períodos mensais para o backtesting de 6 meses
    const periods = ['Outubro 2024', 'Setembro 2024', 'Agosto 2024', 
                    'Julho 2024', 'Junho 2024', 'Maio 2024'];
    
    let currentIndex = 0;
    
    // Simular o processamento do backtesting com um intervalo
    const interval = setInterval(() => {
      if (currentIndex >= periods.length) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      
      const period = periods[currentIndex];
      setCurrentPeriod(period);
      setProgress(Math.round(((currentIndex + 1) / periods.length) * 100));
      
      // Gerar resultados simulados para cada período
      const newResult = {
        period: period,
        totalTrades: Math.floor(Math.random() * 150) + 50,
        successRate: Math.random() * 30 + 70, // 70-100%
        profitLoss: Math.random() * 5000 + 1000,
        roi: Math.random() * 15 + 5, // 5-20%
      };
      
      setResults(prev => [...prev, newResult]);
      currentIndex++;
      
    }, 1500);
  };

  const getTotalMetrics = () => {
    if (results.length === 0) return { trades: 0, successRate: 0, profit: 0, roi: 0 };
    
    const totalTrades = results.reduce((sum, r) => sum + r.totalTrades, 0);
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    const totalProfit = results.reduce((sum, r) => sum + r.profitLoss, 0);
    const avgRoi = results.reduce((sum, r) => sum + r.roi, 0) / results.length;
    
    return {
      trades: totalTrades,
      successRate: avgSuccessRate,
      profit: totalProfit,
      roi: avgRoi
    };
  };

  const totalMetrics = getTotalMetrics();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Backtesting de Estratégias
          </DialogTitle>
          <DialogDescription>
            Teste a performance da estratégia de arbitragem nos últimos 6 meses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="results" disabled={results.length === 0}>Resultados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-4 pt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">Período de backtesting</label>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant={selectedPeriod === '1m' ? 'default' : 'outline'} 
                      onClick={() => setSelectedPeriod('1m')}
                      size="sm"
                    >
                      1 mês
                    </Button>
                    <Button 
                      variant={selectedPeriod === '3m' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('3m')}
                      size="sm"
                    >
                      3 meses
                    </Button>
                    <Button 
                      variant={selectedPeriod === '6m' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('6m')}
                      size="sm"
                    >
                      6 meses
                    </Button>
                    <Button 
                      variant={selectedPeriod === '1y' ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod('1y')}
                      size="sm"
                    >
                      1 ano
                    </Button>
                  </div>
                </div>
                
                {isRunning ? (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso: {progress}%</span>
                      <span className="text-sm text-muted-foreground">Analisando {currentPeriod}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : (
                  <Button onClick={runBacktest} className="mt-4">
                    <Clock className="mr-2 h-4 w-4" />
                    Iniciar Backtesting
                  </Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4 pt-4">
              {results.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Total de Transações</div>
                      <div className="text-2xl font-bold mt-1">{totalMetrics.trades}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Lucro Total</div>
                      <div className="text-2xl font-bold mt-1 text-crypto-green">
                        ${totalMetrics.profit.toLocaleString('en-US', {maximumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Taxa de Sucesso Média</div>
                      <div className="text-2xl font-bold mt-1">
                        {totalMetrics.successRate.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">ROI Médio</div>
                      <div className="text-2xl font-bold mt-1">
                        {totalMetrics.roi.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                
                  <div className="rounded-md border">
                    <div className="bg-muted/50 p-2 text-sm font-medium grid grid-cols-5 gap-4">
                      <div>Período</div>
                      <div>Transações</div>
                      <div>Taxa de Sucesso</div>
                      <div>Lucro/Perda</div>
                      <div>ROI</div>
                    </div>
                    <div className="divide-y">
                      {results.map((result, index) => (
                        <div key={index} className="p-2 text-sm grid grid-cols-5 gap-4">
                          <div>{result.period}</div>
                          <div>{result.totalTrades}</div>
                          <div>{result.successRate.toFixed(2)}%</div>
                          <div className="text-crypto-green">
                            ${result.profitLoss.toLocaleString('en-US', {maximumFractionDigits: 2})}
                          </div>
                          <div>{result.roi.toFixed(2)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRunning}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BacktestingModal;
