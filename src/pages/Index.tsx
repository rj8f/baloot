import { GameProvider, useGame } from '@/contexts/GameContext';
import GameSetup from '@/components/GameSetup';
import GameDashboard from '@/components/GameDashboard';
import SimpleCalculator from '@/components/SimpleCalculator';

const GameContent = () => {
  const { game, calculatorMode, goToSelection } = useGame();
  
  // الحاسبة المختصرة
  if (calculatorMode === 'simple') {
    return <SimpleCalculator onBack={goToSelection} />;
  }
  
  // الحاسبة المتقدمة
  if (calculatorMode === 'advanced' && game) {
    return <GameDashboard />;
  }
  
  // شاشة الاختيار
  return <GameSetup />;
};

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
