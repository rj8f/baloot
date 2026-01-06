import { useGame, SimpleHistoryEntry } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Round } from '@/types/baloot';

const RoundHistory = () => {
  const { game, deleteRound, deleteSimpleEntry, getUnifiedHistory } = useGame();

  if (!game) return null;

  const unifiedHistory = getUnifiedHistory();

  if (unifiedHistory.length === 0) return null;

  return (
    <Card className="mx-4 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg">السجل</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
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
                    onClick={() => deleteRound(round.id)}
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
                  onClick={() => deleteSimpleEntry(entry.id)}
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
  );
};

export default RoundHistory;
