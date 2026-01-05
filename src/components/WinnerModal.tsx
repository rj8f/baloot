import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const WinnerModal = () => {
  const { game, resetGame } = useGame();

  if (!game || !game.winner) return null;

  const winnerName = game.winner === 1 ? game.team1Name : game.team2Name;
  const winnerScore = game.winner === 1 ? game.team1Score : game.team2Score;

  return (
    <Dialog open={true}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 مبروك! 🎉</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className={cn(
            "text-4xl font-bold mb-2",
            game.winner === 1 ? "text-blue-400" : "text-rose-400"
          )}>
            {winnerName}
          </div>
          <div className="text-6xl font-bold text-primary mb-2">{winnerScore}</div>
          <div className="text-muted-foreground">نقطة</div>
        </div>
        <div className="flex gap-3">
          <Button onClick={resetGame} className="flex-1 text-lg py-5">
            لعبة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
