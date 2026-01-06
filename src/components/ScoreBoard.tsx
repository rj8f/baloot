import { useGame } from '@/contexts/GameContext';
import { Progress } from '@/components/ui/progress';

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
    <div className="grid grid-cols-2 gap-3 p-4">
      {/* Team 1 */}
      <div className="relative rounded-2xl p-4 text-center transition-all overflow-hidden bg-team-bg border border-border shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-team-start/10 via-transparent to-team-end/5" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-team-start via-team-end to-team-start" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-team-text truncate">{game.team1Name}</h2>
          <div className="text-5xl font-black my-2 bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
            {game.team1Score}
          </div>
          {hasPreview && (
            <div className="text-sm text-team-text/60 mb-2 font-medium" dir="ltr">
              + {previewTeam1}
            </div>
          )}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-team-start to-team-end transition-all duration-500"
              style={{ width: `${team1Progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Team 2 */}
      <div className="relative rounded-2xl p-4 text-center transition-all overflow-hidden bg-team-bg border border-border shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-team-start/10 via-transparent to-team-end/5" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-team-start via-team-end to-team-start" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-team-text truncate">{game.team2Name}</h2>
          <div className="text-5xl font-black my-2 bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">
            {game.team2Score}
          </div>
          {hasPreview && (
            <div className="text-sm text-team-text/60 mb-2 font-medium" dir="ltr">
              + {previewTeam2}
            </div>
          )}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-team-start to-team-end transition-all duration-500"
              style={{ width: `${team2Progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;