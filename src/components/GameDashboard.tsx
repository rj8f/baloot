import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import ScoreBoard from './ScoreBoard';
import AddRound from './AddRound';
import RoundHistory from './RoundHistory';
import WinnerModal from './WinnerModal';
import ThemeToggle from './ThemeToggle';
import MatchHistory from './MatchHistory';
import { RotateCcw, Undo2, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const GameDashboard = () => {
  const { game, resetGame, undoLastRound } = useGame();

  if (!game) return null;

  const handleUndo = () => {
    if (game.rounds.length === 0) {
      toast.error('لا توجد جولات للتراجع عنها');
      return;
    }
    undoLastRound();
    toast.success('تم التراجع عن آخر جولة');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-primary">🃏 البلوت</h1>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground ml-2">
            الجولة {game.rounds.length + 1}
          </span>
          
          {/* Match History Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" title="سجل المباريات">
                <History className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>سجل المباريات</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-auto h-full pb-8">
                <MatchHistory />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUndo}
            disabled={game.rounds.length === 0}
            title="تراجع"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={resetGame} title="إعادة تعيين">
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
