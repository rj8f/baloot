import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import ScoreBoard from './ScoreBoard';
import AddRound from './AddRound';
import RoundHistory from './RoundHistory';
import WinnerModal from './WinnerModal';
import { RotateCcw } from 'lucide-react';

const GameDashboard = () => {
  const { game, resetGame } = useGame();

  if (!game) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold text-primary">🃏 البلوت</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            الجولة {game.rounds.length + 1}
          </span>
          <Button variant="ghost" size="icon" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Score Board */}
      <ScoreBoard />

      {/* Add Round */}
      <AddRound />

      {/* Round History */}
      <RoundHistory />

      {/* Winner Modal */}
      <WinnerModal />
    </div>
  );
};

export default GameDashboard;
