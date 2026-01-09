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
import { Trophy, Crown, Star, Sparkles } from 'lucide-react';

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
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-team-start/20 via-transparent to-team-end/20 animate-pulse" />
        
        {/* Floating sparkles */}
        <div className="absolute top-4 left-4 animate-float">
          <Sparkles className="h-6 w-6 text-amber-400/60" />
        </div>
        <div className="absolute top-8 right-6 animate-float-delayed">
          <Sparkles className="h-4 w-4 text-amber-400/40" />
        </div>
        <div className="absolute bottom-20 left-8 animate-float-delayed">
          <Star className="h-5 w-5 text-amber-400/50 fill-amber-400/50" />
        </div>
        
        <DialogHeader className="relative">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 animate-glow">
              <Trophy className="h-14 w-14 animate-bounce text-amber-500 drop-shadow-lg" />
            </div>
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-black">مبروك الفوز!</span>
            <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 relative">
          <div className="text-4xl font-bold mb-4 flex items-center justify-center gap-2 text-foreground">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            {winnerName}
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
          
          <div className="text-8xl font-black mb-2 tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent drop-shadow-sm">
            {winnerScore}
          </div>
          
          <div className="text-muted-foreground text-lg">
            vs {loserScore}
          </div>
        </div>

        <div className="flex gap-3 relative">
          <Button 
            onClick={resetGameKeepMode} 
            className="flex-1 text-lg py-6 font-bold btn-press bg-gradient-to-r from-team-start to-team-end hover:opacity-90 shadow-xl"
          >
            لعبة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;