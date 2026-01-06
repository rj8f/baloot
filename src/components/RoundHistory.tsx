import { useState } from 'react';
import { useGame, SimpleHistoryEntry } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'round' | 'simple'; id: string } | null>(null);

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
      <Card className="mx-4 mb-4">
        <CardContent className="space-y-2 pt-4">
          {unifiedHistory.map((item, index) => {
            if (item.type === 'advanced') {
              const round = item.entry as Round;
              return (
                <div
                  key={round.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    round.winningTeam === 1
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-rose-500/10 border-rose-500/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">#{unifiedHistory.length - index}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{round.gameType}</span>
                        {round.multiplier !== 'عادي' && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              round.multiplier === 'قهوة'
                                ? "bg-amber-500/30 text-amber-300"
                                : "bg-primary/30"
                            )}
                          >
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
                        <span className="text-blue-400 font-bold text-lg tabular-nums">
                          {round.finalTeam1Points}
                        </span>
                        <span className="text-xs text-muted-foreground block">{game.team1Name}</span>
                      </div>
                      <span className="text-muted-foreground self-center">-</span>
                      <div className="text-center">
                        <span className="text-rose-400 font-bold text-lg tabular-nums">
                          {round.finalTeam2Points}
                        </span>
                        <span className="text-xs text-muted-foreground block">{game.team2Name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'round', id: round.id })}
                      className="h-8 w-8 text-destructive hover:text-destructive"
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
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <span className="text-xs text-muted-foreground">#{unifiedHistory.length - index}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-400 font-bold text-lg tabular-nums">{entry.team1}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-rose-400 font-bold text-lg tabular-nums">{entry.team2}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm({ type: 'simple', id: entry.id })}
                    className="h-8 w-8 text-destructive hover:text-destructive"
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
        <DialogContent className="max-w-xs p-4" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center text-base">حذف؟</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="py-5 text-lg font-bold"
            >
              لا
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="py-5 text-lg font-bold"
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
