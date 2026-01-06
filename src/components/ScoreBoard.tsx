import { useGame } from '@/contexts/GameContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScoreBoardProps {
  previewTeam1?: number;
  previewTeam2?: number;
}

const ScoreBoard = ({ previewTeam1, previewTeam2 }: ScoreBoardProps) => {
  const { game } = useGame();
  
  if (!game) return null;

  const team1Progress = Math.min((game.team1Score / game.winningScore) * 100, 100);
  const team2Progress = Math.min((game.team2Score / game.winningScore) * 100, 100);

  const hasPreview = previewTeam1 !== undefined && previewTeam2 !== undefined;

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Team 1 */}
      <div className={cn(
        "rounded-2xl p-4 text-center transition-all",
        "bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/20"
      )}>
        <h2 className="text-lg font-bold text-team1 truncate">{game.team1Name}</h2>
        <div className="text-5xl font-bold my-2 text-team1">{game.team1Score}</div>
        {hasPreview && (
          <div className="text-sm text-team1-light mb-2" dir="ltr">
            + {previewTeam1}
          </div>
        )}
        <Progress value={team1Progress} className="h-2 bg-muted" />
      </div>

      {/* Team 2 */}
      <div className={cn(
        "rounded-2xl p-4 text-center transition-all",
        "bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5 border border-muted-foreground/20"
      )}>
        <h2 className="text-lg font-bold text-team2 truncate">{game.team2Name}</h2>
        <div className="text-5xl font-bold my-2 text-team2">{game.team2Score}</div>
        {hasPreview && (
          <div className="text-sm text-team2-light mb-2" dir="ltr">
            + {previewTeam2}
          </div>
        )}
        <Progress value={team2Progress} className="h-2 bg-muted" />
      </div>
    </div>
  );
};

export default ScoreBoard;