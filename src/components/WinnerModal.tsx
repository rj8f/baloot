import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Star } from 'lucide-react';

const WinnerModal = () => {
  const { game, resetGame } = useGame();

  useEffect(() => {
    if (game?.winner) {
      // Fire confetti celebration - grayscale
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ffffff', '#a0a0a0', '#606060', '#303030'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      // Initial burst
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });

      frame();

      // Vibrate if supported
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
    <Dialog open={true} onOpenChange={() => resetGame()}>
      <DialogContent className="text-center max-w-sm border-2 overflow-hidden">
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 opacity-20 animate-pulse",
          "bg-gradient-to-br from-foreground/50 via-foreground/30 to-foreground/50"
        )} />
        
        <DialogHeader className="relative">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-full bg-foreground/10">
              <Trophy className="h-12 w-12 animate-bounce text-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-foreground" />
            <span>مبروك الفوز!</span>
            <Crown className="h-6 w-6 text-foreground" />
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 relative">
          <div className="text-4xl font-bold mb-4 flex items-center justify-center gap-2 text-foreground">
            <Star className="h-6 w-6 fill-current" />
            {winnerName}
            <Star className="h-6 w-6 fill-current" />
          </div>
          
          <div className="text-7xl font-bold mb-2 tabular-nums text-foreground">
            {winnerScore}
          </div>
          
          <div className="text-muted-foreground text-lg">
            vs {loserScore}
          </div>
        </div>

        <div className="flex gap-3 relative">
          <Button 
            onClick={resetGame} 
            className="flex-1 text-lg py-6 font-bold"
          >
            لعبة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;