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
      {/* Team 1 - Dark/Bold style */}
      <div className="relative rounded-2xl p-4 text-center transition-all overflow-hidden bg-team1-bg border border-border shadow-lg">
        {/* Ombré gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-team1-start/10 via-transparent to-team1-end/5" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-team1-start via-team1-end to-team1-start" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-team1-text truncate">{game.team1Name}</h2>
          <div className="text-5xl font-black my-2 bg-gradient-to-b from-team1-start to-team1-end bg-clip-text text-transparent">
            {game.team1Score}
          </div>
          {hasPreview && (
            <div className="text-sm text-team1-text/60 mb-2 font-medium" dir="ltr">
              + {previewTeam1}
            </div>
          )}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-team1-start to-team1-end transition-all duration-500"
              style={{ width: `${team1Progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Team 2 - Light/Subtle style */}
      <div className="relative rounded-2xl p-4 text-center transition-all overflow-hidden bg-team2-bg border border-border/50 shadow-md">
        {/* Ombré gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-team2-start/5 via-transparent to-team2-end/10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-team2-start via-team2-end to-team2-start opacity-60" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-team2-text truncate">{game.team2Name}</h2>
          <div className="text-5xl font-black my-2 bg-gradient-to-b from-team2-start to-team2-end bg-clip-text text-transparent">
            {game.team2Score}
          </div>
          {hasPreview && (
            <div className="text-sm text-team2-text/60 mb-2 font-medium" dir="ltr">
              + {previewTeam2}
            </div>
          )}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-team2-start to-team2-end transition-all duration-500"
              style={{ width: `${team2Progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;