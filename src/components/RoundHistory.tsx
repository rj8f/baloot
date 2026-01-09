import { useState, useCallback } from 'react';
import { useGame, SimpleHistoryEntry } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Round } from '@/types/baloot';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RoundHistory = () => {
  const { game, deleteRound, deleteSimpleEntry, getUnifiedHistory } = useGame();
  const { settings } = useSettings();
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'round' | 'simple'; id: string } | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const announceRound = useCallback((team1Score: number, team2Score: number, itemId: string) => {
    if (settings.isMuted) return;
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setSpeakingId(itemId);
      
      const team1Name = game?.team1Name || 'لنا';
      const team2Name = game?.team2Name || 'لهم';
      const message = `${team1Name} ${team1Score}، ${team2Name} ${team2Score}`;
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.2;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      
      window.speechSynthesis.speak(utterance);
    }
  }, [game?.team1Name, game?.team2Name, settings.isMuted]);

  if (!game) return null;

  const unifiedHistory = getUnifiedHistory();

  if (unifiedHistory.length === 0) return null;

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'round') {
      deleteRound(deleteConfirm.id);
    } else {
      deleteSimpleEntry(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <>
      <Card className="mx-4 mb-4 glass border-border/50 shadow-lg">
        <CardContent className="space-y-2 pt-4">
          {unifiedHistory.map((item, index) => {
            if (item.type === 'advanced') {
              const round = item.entry as Round;
              return (
                <div
                  key={round.id}
                  onClick={() => announceRound(round.finalTeam1Points, round.finalTeam2Points, round.id)}
                  className={cn(
                    "relative flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden hover:bg-card/80 transition-all duration-300 group cursor-pointer active:scale-[0.98]",
                    speakingId === round.id && "ring-2 ring-primary/50"
                  )}
                >
                  {/* Gradient accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-team-start to-team-end opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-3 mr-2">
                    <span className="text-xs text-muted-foreground font-medium">#{unifiedHistory.length - index}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{round.gameType}</span>
                        {round.multiplier !== 'عادي' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-foreground/10 font-medium">
                            {round.multiplier}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        المشتري: {round.buyingTeam === 1 ? game.team1Name : game.team2Name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left flex gap-3">
                      <div className="text-center">
                        <span className="font-black text-lg tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                          {round.finalTeam1Points}
                        </span>
                        <span className="text-xs text-muted-foreground block">{game.team1Name}</span>
                      </div>
                      <span className="text-muted-foreground self-center font-light">—</span>
                      <div className="text-center">
                        <span className="font-black text-lg tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                          {round.finalTeam2Points}
                        </span>
                        <span className="text-xs text-muted-foreground block">{game.team2Name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'round', id: round.id })}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            } else {
              const entry = item.entry as SimpleHistoryEntry;
              return (
                <div
                  key={entry.id}
                  onClick={() => announceRound(entry.team1, entry.team2, entry.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group cursor-pointer active:scale-[0.98]",
                    speakingId === entry.id && "ring-2 ring-primary/50"
                  )}
                >
                  <span className="text-xs text-muted-foreground font-medium">#{unifiedHistory.length - index}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-lg tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                      {entry.team1}
                    </span>
                    <span className="text-muted-foreground font-light">—</span>
                    <span className="font-black text-lg tabular-nums bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
                      {entry.team2}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm({ type: 'simple', id: entry.id })}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>

      {/* تأكيد الحذف */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs p-4 glass" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center text-base">حذف؟</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="py-5 text-lg font-bold btn-press"
            >
              لا
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="py-5 text-lg font-bold btn-press"
            >
              نعم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoundHistory;