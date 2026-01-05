import { GameProvider, useGame } from '@/contexts/GameContext';
import GameSetup from '@/components/GameSetup';
import GameDashboard from '@/components/GameDashboard';

const GameContent = () => {
  const { game } = useGame();
  return game ? <GameDashboard /> : <GameSetup />;
};

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
