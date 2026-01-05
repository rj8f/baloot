import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RoundHistory = () => {
  const { game, deleteRound } = useGame();

  if (!game || game.rounds.length === 0) return null;

  return (
    <Card className="mx-4 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg">سجل الجولات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {game.rounds.map((round) => (
          <div
            key={round.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              round.winningTeam === 1 ? "bg-blue-500/10 border-blue-500/30" : "bg-rose-500/10 border-rose-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">#{round.roundNumber}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{round.gameType}</span>
                  {round.multiplier !== 'عادي' && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      round.multiplier === 'قهوة' ? "bg-amber-500/30 text-amber-300" : "bg-primary/30"
                    )}>
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
              <div className="text-left">
                <span className={cn(
                  "font-bold",
                  round.winningTeam === 1 ? "text-blue-400" : "text-rose-400"
                )}>
                  +{round.winningTeam === 1 ? round.finalTeam1Points : round.finalTeam2Points}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {round.winningTeam === 1 ? game.team1Name : game.team2Name}
                </span>
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
        ))}
      </CardContent>
    </Card>
  );
};

export default RoundHistory;
