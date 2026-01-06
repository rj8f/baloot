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
      // Fire confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = game.winner === 1 
        ? ['#3b82f6', '#60a5fa', '#93c5fd'] // Blue team colors
        : ['#f43f5e', '#fb7185', '#fda4af']; // Rose team colors

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
          game.winner === 1 
            ? "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600" 
            : "bg-gradient-to-br from-rose-500 via-rose-400 to-rose-600"
        )} />
        
        <DialogHeader className="relative">
          <div className="flex justify-center mb-2">
            <div className={cn(
              "p-4 rounded-full",
              game.winner === 1 ? "bg-blue-500/20" : "bg-rose-500/20"
            )}>
              <Trophy className={cn(
                "h-12 w-12 animate-bounce",
                game.winner === 1 ? "text-blue-400" : "text-rose-400"
              )} />
            </div>
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-amber-400" />
            <span>مبروك الفوز!</span>
            <Crown className="h-6 w-6 text-amber-400" />
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 relative">
          <div className={cn(
            "text-4xl font-bold mb-4 flex items-center justify-center gap-2",
            game.winner === 1 ? "text-blue-400" : "text-rose-400"
          )}>
            <Star className="h-6 w-6 fill-current" />
            {winnerName}
            <Star className="h-6 w-6 fill-current" />
          </div>
          
          <div className={cn(
            "text-7xl font-bold mb-2 tabular-nums",
            game.winner === 1 ? "text-blue-400" : "text-rose-400"
          )}>
            {winnerScore}
          </div>
          
          <div className="text-muted-foreground text-lg">
            vs {loserScore}
          </div>
        </div>

        <div className="flex gap-3 relative">
          <Button 
            onClick={resetGame} 
            className={cn(
              "flex-1 text-lg py-6 font-bold",
              game.winner === 1 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-rose-600 hover:bg-rose-700"
            )}
          >
            لعبة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
