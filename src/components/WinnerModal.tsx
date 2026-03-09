import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import { Trophy, Star } from 'lucide-react';

const WinnerModal = () => {
  const { game, resetGameKeepMode } = useGame();

  useEffect(() => {
    if (game?.winner) {
      const colors = ['#ffffff', '#a0a0a0', '#606060', '#303030'];

      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [game?.winner]);

  if (!game || !game.winner) return null;

  const winnerName = game.winner === 1 ? game.team1Name : game.team2Name;
  const winnerScore = game.winner === 1 ? game.team1Score : game.team2Score;
  const loserScore = game.winner === 1 ? game.team2Score : game.team1Score;

  return (
    <Dialog open={true} onOpenChange={() => resetGameKeepMode()}>
      <DialogContent className="text-center max-w-sm border-2 overflow-hidden glass">
        <div className="absolute inset-0 bg-gradient-to-br from-team-start/20 via-transparent to-team-end/20" />
        
        <DialogHeader className="relative">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10">
              <Trophy className="h-14 w-14 text-amber-500 drop-shadow-lg" />
            </div>
          </div>
          <DialogTitle className="sr-only">الفائز</DialogTitle>
        </DialogHeader>

        <div className="py-6 relative">
          <div className="text-4xl font-bold mb-4 flex items-center justify-center gap-2 text-foreground">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            {winnerName}
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-7xl font-black tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent drop-shadow-sm">
              {winnerScore}
            </span>
            <span className="text-3xl font-light text-muted-foreground">—</span>
            <span className="text-7xl font-black tabular-nums text-muted-foreground/60">
              {loserScore}
            </span>
          </div>
        </div>

        <div className="flex gap-3 relative">
          <Button 
            onClick={resetGameKeepMode} 
            className="flex-1 text-lg py-6 font-bold btn-press bg-gradient-to-r from-team-start to-team-end hover:opacity-90 shadow-xl"
          >
            صكة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;