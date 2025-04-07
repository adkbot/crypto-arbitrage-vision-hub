
import ArbitrageSystem from "@/components/ArbitrageSystem";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import BacktestingModal from "@/components/BacktestingModal";

const Index = () => {
  const [backtestingOpen, setBacktestingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-crypto-dark py-4">
      <ArbitrageSystem />
      <div className="container mx-auto mt-6 flex flex-col items-center">
        <Button 
          onClick={() => setBacktestingOpen(true)}
          className="mb-4 bg-crypto-blue hover:bg-crypto-blue/80"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Backtesting (6 meses)
        </Button>
        <div className="text-xs text-muted-foreground text-center">
          <p>Este sistema exibe dados de arbitragem em tempo real. Todas as oportunidades e porcentagens são calculadas dinamicamente.</p>
          <p className="mt-1 text-crypto-green">Dados atualizados a cada 8 segundos</p>
        </div>
      </div>
      
      <BacktestingModal 
        isOpen={backtestingOpen}
        onClose={() => setBacktestingOpen(false)}
      />
    </div>
  );
};

export default Index;
