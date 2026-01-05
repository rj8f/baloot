import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Game, Round, GameType, Multiplier } from '@/types/baloot';

interface GameContextType {
  game: Game | null;
  startGame: (team1Name: string, team2Name: string, winningScore: number) => void;
  addRound: (round: Omit<Round, 'id' | 'roundNumber' | 'winningTeam' | 'finalTeam1Points' | 'finalTeam2Points'>) => void;
  deleteRound: (roundId: string) => void;
  resetGame: () => void;
  canDoubleSun: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [game, setGame] = useState<Game | null>(null);

  const startGame = (team1Name: string, team2Name: string, winningScore: number) => {
    setGame({
      id: crypto.randomUUID(),
      team1Name,
      team2Name,
      team1Score: 0,
      team2Score: 0,
      winningScore,
      rounds: [],
      winner: null,
      createdAt: new Date(),
    });
  };

  const canDoubleSun = (): boolean => {
    if (!game) return false;
    const { team1Score, team2Score } = game;
    return (team1Score <= 100 && team2Score >= 101) || (team2Score <= 100 && team1Score >= 101);
  };

  const calculateRoundResult = (
    gameType: GameType,
    buyingTeam: 1 | 2,
    team1Points: number,
    team2Points: number,
    multiplier: Multiplier
  ): { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number } => {
    const totalPoints = team1Points + team2Points;
    const halfPoints = totalPoints / 2;
    
    // Determine round winner based on buying team logic
    const buyingTeamPoints = buyingTeam === 1 ? team1Points : team2Points;
    const otherTeamPoints = buyingTeam === 1 ? team2Points : team1Points;
    
    // If buying team got less than half, they lose and other team takes all
    let winningTeam: 1 | 2;
    let pointsToAward: number;
    
    if (buyingTeamPoints < halfPoints) {
      // Buying team lost - other team takes all points
      winningTeam = buyingTeam === 1 ? 2 : 1;
      pointsToAward = totalPoints;
    } else {
      // Buying team won - they take their points (or all if other team got less than half)
      winningTeam = buyingTeam;
      if (otherTeamPoints < halfPoints) {
        pointsToAward = totalPoints;
      } else {
        pointsToAward = buyingTeamPoints;
      }
    }

    // Apply multiplier
    if (multiplier === 'قهوة') {
      return {
        winningTeam,
        finalTeam1Points: winningTeam === 1 ? 152 : 0,
        finalTeam2Points: winningTeam === 2 ? 152 : 0,
      };
    }

    const multiplierValue = multiplier === 'عادي' ? 1 : multiplier === 'دبل' ? 2 : multiplier === '×3' ? 3 : 4;
    const finalPoints = pointsToAward * multiplierValue;

    return {
      winningTeam,
      finalTeam1Points: winningTeam === 1 ? finalPoints : 0,
      finalTeam2Points: winningTeam === 2 ? finalPoints : 0,
    };
  };

  const addRound = (roundData: Omit<Round, 'id' | 'roundNumber' | 'winningTeam' | 'finalTeam1Points' | 'finalTeam2Points'>) => {
    if (!game) return;

    const result = calculateRoundResult(
      roundData.gameType,
      roundData.buyingTeam,
      roundData.team1Points,
      roundData.team2Points,
      roundData.multiplier
    );

    const newRound: Round = {
      ...roundData,
      id: crypto.randomUUID(),
      roundNumber: game.rounds.length + 1,
      ...result,
    };

    const newTeam1Score = game.team1Score + result.finalTeam1Points;
    const newTeam2Score = game.team2Score + result.finalTeam2Points;

    let winner: 1 | 2 | null = null;
    if (newTeam1Score >= game.winningScore) winner = 1;
    else if (newTeam2Score >= game.winningScore) winner = 2;

    setGame({
      ...game,
      team1Score: newTeam1Score,
      team2Score: newTeam2Score,
      rounds: [...game.rounds, newRound],
      winner,
    });
  };

  const deleteRound = (roundId: string) => {
    if (!game) return;

    const roundToDelete = game.rounds.find(r => r.id === roundId);
    if (!roundToDelete) return;

    const newRounds = game.rounds.filter(r => r.id !== roundId).map((r, i) => ({
      ...r,
      roundNumber: i + 1,
    }));

    const newTeam1Score = game.team1Score - roundToDelete.finalTeam1Points;
    const newTeam2Score = game.team2Score - roundToDelete.finalTeam2Points;

    setGame({
      ...game,
      team1Score: newTeam1Score,
      team2Score: newTeam2Score,
      rounds: newRounds,
      winner: null,
    });
  };

  const resetGame = () => {
    setGame(null);
  };

  return (
    <GameContext.Provider value={{ game, startGame, addRound, deleteRound, resetGame, canDoubleSun }}>
      {children}
    </GameContext.Provider>
  );
};
