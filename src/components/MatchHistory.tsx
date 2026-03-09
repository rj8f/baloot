import React, { useState, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Trophy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameRecord {
  id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  winner: number | null;
  created_at: string;
  finished_at: string | null;
  rounds?: any[];
  simpleHistory?: any[];
}

interface MatchHistoryProps {
  expandedByDefault?: boolean;
  onRestore?: (game: GameRecord) => void;
  onConfirmActive?: (active: boolean) => void;
}

const MatchHistory = forwardRef<HTMLDivElement, MatchHistoryProps>(({ expandedByDefault = false, onRestore, onConfirmActive }, ref) => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(expandedByDefault);
  const [confirmGame, setConfirmGame] = useState<GameRecord | null>(null);

  const fetchGames = () => {
    setLoading(true);
    try {
      const savedHistory = localStorage.getItem('baloot_match_history');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      setGames(history);
    } catch (error) {
      console.error('Error loading match history:', error);
      setGames([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (expandedByDefault) {
      fetchGames();
    }
  }, [expandedByDefault]);

  useEffect(() => {
    if (isOpen && !expandedByDefault) {
      fetchGames();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (isOpen || expandedByDefault) {
        fetchGames();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isOpen, expandedByDefault]);

  const deleteGame = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedGames = games.filter(g => g.id !== id);
    setGames(updatedGames);
    localStorage.setItem('baloot_match_history', JSON.stringify(updatedGames));
  };

  const handleCardClick = (game: GameRecord) => {
    if (onRestore) {
      openConfirm(game);
    }
  };

  const handleConfirmRestore = () => {
    if (confirmGame && onRestore) {
      onRestore(confirmGame);
      setConfirmGame(null);
      onConfirmActive?.(false);
    }
  };

  const openConfirm = (game: GameRecord) => {
    setConfirmGame(game);
    onConfirmActive?.(true);
  };

  const closeConfirm = () => {
    setConfirmGame(null);
    onConfirmActive?.(false);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM yyyy - h:mm a');
  };

  const renderGameCard = (game: GameRecord) => (
    <Card key={game.id} className={cn("bg-card border", onRestore && "cursor-pointer active:scale-[0.98] transition-transform")} onClick={() => handleCardClick(game)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className={game.winner === 1 ? "font-bold text-team-text" : ""}>
                {game.team1_name}
              </span>
              <span className="text-xl font-black bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                {game.team1_score}
              </span>
              <span className="text-muted-foreground font-light">—</span>
              <span className="text-xl font-black bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                {game.team2_score}
              </span>
              <span className={game.winner === 2 ? "font-bold text-team-text" : ""}>
                {game.team2_name}
              </span>
              {game.winner && (
                <Trophy className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(game.created_at)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => deleteGame(e, game.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const confirmDialog = (
    <Dialog open={confirmGame !== null} onOpenChange={() => closeConfirm()}>
      <DialogContent className="max-w-xs p-4" dir="rtl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base">استرجاع هذه المباراة؟</DialogTitle>
        </DialogHeader>
        {confirmGame && (
          <div className="text-center text-sm text-muted-foreground mb-2">
            {confirmGame.team1_name} {confirmGame.team1_score} — {confirmGame.team2_score} {confirmGame.team2_name}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => closeConfirm()}
            className="py-5 text-lg font-bold"
          >
            لا
          </Button>
          <Button
            onClick={handleConfirmRestore}
            className="py-5 text-lg font-bold"
          >
            نعم
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (expandedByDefault) {
    return (
      <div className="w-full space-y-2">
        {confirmDialog}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">لا توجد مباريات سابقة</div>
        ) : (
          <div className="space-y-2">
            {games.map(renderGameCard)}
          </div>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      {confirmDialog}
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-12 text-muted-foreground">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>سجل المباريات</span>
            {games.length > 0 && !isOpen && (
              <span className="px-1.5 py-0.5 bg-primary/20 rounded text-xs">{games.length}</span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">لا توجد مباريات سابقة</div>
        ) : (
          <div className="space-y-2">
            {games.map(renderGameCard)}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});

MatchHistory.displayName = 'MatchHistory';

export default MatchHistory;