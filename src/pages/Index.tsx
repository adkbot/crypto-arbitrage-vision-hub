
import ArbitrageSystem from "@/components/ArbitrageSystem";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-crypto-dark py-4">
      <ArbitrageSystem />
      <div className="container mx-auto mt-6 text-center text-xs text-muted-foreground">
        <p>Este sistema exibe dados de arbitragem em tempo real. Todas as oportunidades e porcentagens são calculadas dinamicamente.</p>
        <p className="mt-1 text-crypto-green">Dados atualizados a cada 8 segundos</p>
      </div>
    </div>
  );
};

export default Index;
