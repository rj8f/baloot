import { GameProvider, useGame } from '@/contexts/GameContext';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import GameSetup from '@/components/GameSetup';
import GameDashboard from '@/components/GameDashboard';
import SimpleCalculator from '@/components/SimpleCalculator';
import SettingsDialog from '@/components/SettingsDialog';

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
  return <GameSetupWithSettings />;
};

const GameSetupWithSettings = () => {
  const { isFirstTime } = useSettings();
  
  // إظهار الإعدادات للمرة الأولى
  if (isFirstTime) {
    return (
      <>
        <GameSetup />
        <SettingsDialog open={true} onOpenChange={() => {}} isFirstTime={true} />
      </>
    );
  }
  
  return <GameSetup />;
};

const Index = () => {
  return (
    <SettingsProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </SettingsProvider>
  );
};

export default Index;
