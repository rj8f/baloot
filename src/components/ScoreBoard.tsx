import { useGame } from '@/contexts/GameContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ScoreBoard = () => {
  const { game } = useGame();
  
  if (!game) return null;

  const team1Progress = Math.min((game.team1Score / game.winningScore) * 100, 100);
  const team2Progress = Math.min((game.team2Score / game.winningScore) * 100, 100);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Team 1 */}
      <div className={cn(
        "rounded-2xl p-4 text-center transition-all",
        "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
      )}>
        <h2 className="text-lg font-bold text-blue-400 truncate">{game.team1Name}</h2>
        <div className="text-5xl font-bold my-3 text-blue-300">{game.team1Score}</div>
        <Progress value={team1Progress} className="h-2 bg-blue-950" />
      </div>

      {/* Team 2 */}
      <div className={cn(
        "rounded-2xl p-4 text-center transition-all",
        "bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30"
      )}>
        <h2 className="text-lg font-bold text-rose-400 truncate">{game.team2Name}</h2>
        <div className="text-5xl font-bold my-3 text-rose-300">{game.team2Score}</div>
        <Progress value={team2Progress} className="h-2 bg-rose-950" />
      </div>
    </div>
  );
};

export default ScoreBoard;
