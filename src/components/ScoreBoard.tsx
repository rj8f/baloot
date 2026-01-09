import { useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';

interface ScoreBoardProps {
  previewTeam1?: number;
  previewTeam2?: number;
}

const ScoreBoard = ({ previewTeam1, previewTeam2 }: ScoreBoardProps) => {
  const { game } = useGame();
  const { settings } = useSettings();
  
  const announceScore = useCallback(() => {
    if (!game || settings.isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const message = `${game.team1Name} ${game.team1Score}، ${game.team2Name} ${game.team2Score}`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.2;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [game, settings.isMuted]);
  
  if (!game) return null;

  const team1Progress = Math.min((game.team1Score / game.winningScore) * 100, 100);
  const team2Progress = Math.min((game.team2Score / game.winningScore) * 100, 100);

  const hasPreview = previewTeam1 !== undefined && previewTeam2 !== undefined;

  return (
    <div 
      className="relative p-4 cursor-pointer active:scale-[0.98] transition-transform" 
      onClick={announceScore}
    >
      {/* Floating decorative elements */}
      <div className="absolute top-2 left-8 w-16 h-16 rounded-full bg-gradient-to-br from-team-start/5 to-transparent animate-float blur-xl" />
      <div className="absolute bottom-4 right-12 w-20 h-20 rounded-full bg-gradient-to-br from-team-end/5 to-transparent animate-float-delayed blur-xl" />
      
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {/* Team 1 - 3D Card */}
        <div className="relative rounded-2xl p-4 text-center overflow-hidden bg-team-bg border border-border/50 shadow-xl">
          {/* Glass overlay */}
          <div className="absolute inset-0 glass opacity-50" />
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-team-start to-transparent" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-30" />
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-team-text truncate">{game.team1Name}</h2>
            <div className="text-5xl font-black my-3 bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent drop-shadow-sm">
              {game.team1Score}
            </div>
            {hasPreview && (
              <div className="text-sm text-team-text/60 mb-2 font-medium animate-pulse" dir="ltr">
                + {previewTeam1}
              </div>
            )}
            {/* 3D Progress bar */}
            <div className="h-3 bg-background/80 rounded-full overflow-hidden shadow-inner border border-team-start/30">
              <div 
                className="h-full bg-gradient-to-r from-team-start via-team-end to-team-start rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ 
                  width: `${team1Progress}%`,
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Team 2 - 3D Card */}
        <div className="relative rounded-2xl p-4 text-center overflow-hidden bg-team-bg border border-border/50 shadow-xl">
          {/* Glass overlay */}
          <div className="absolute inset-0 glass opacity-50" />
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-team-start to-transparent" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-30" />
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-team-text truncate">{game.team2Name}</h2>
            <div className="text-5xl font-black my-3 bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent drop-shadow-sm">
              {game.team2Score}
            </div>
            {hasPreview && (
              <div className="text-sm text-team-text/60 mb-2 font-medium animate-pulse" dir="ltr">
                + {previewTeam2}
              </div>
            )}
            {/* 3D Progress bar */}
            <div className="h-3 bg-background/80 rounded-full overflow-hidden shadow-inner border border-team-start/30">
              <div 
                className="h-full bg-gradient-to-r from-team-start via-team-end to-team-start rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ 
                  width: `${team2Progress}%`,
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;