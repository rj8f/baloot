import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Game, Round, GameType, Multiplier } from '@/types/baloot';

interface GameContextType {
  game: Game | null;
  startGame: (team1Name: string, team2Name: string, winningScore: number) => void;
  addRound: (round: Omit<Round, 'id' | 'roundNumber' | 'winningTeam' | 'finalTeam1Points' | 'finalTeam2Points'>) => void;
  deleteRound: (roundId: string) => void;
  undoLastRound: () => void;
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
    // NOTE: team1Points/team2Points are the round points the user enters ("أكلات + مشاريع")
    // If the buying team fails, the other team takes ALL points for that round.

    const t1 = Number.isFinite(team1Points) ? Math.max(0, Math.trunc(team1Points)) : 0;
    const t2 = Number.isFinite(team2Points) ? Math.max(0, Math.trunc(team2Points)) : 0;

    const otherTeam: 1 | 2 = buyingTeam === 1 ? 2 : 1;

    // قهوة: من يربح يأخذ اللعبة كلها (حالياً نعتمد المشتري كفائز، لأن الإدخال يكون معطّل)
    if (multiplier === 'قهوة') {
      const winningTeam: 1 | 2 = buyingTeam;
      return {
        winningTeam,
        finalTeam1Points: winningTeam === 1 ? 152 : 0,
        finalTeam2Points: winningTeam === 2 ? 152 : 0,
      };
    }

    const totalPoints = t1 + t2;
    if (totalPoints <= 0) {
      return { winningTeam: buyingTeam, finalTeam1Points: 0, finalTeam2Points: 0 };
    }

    const buyingTeamPoints = buyingTeam === 1 ? t1 : t2;
    const otherTeamPoints = buyingTeam === 1 ? t2 : t1;

    // نجاح اللعب: المشتري لازم يجيب نصف المجموع أو أكثر (يعني يتعادل أو يفوز على الخصم)
    const buyingTeamSucceeded = buyingTeamPoints >= otherTeamPoints;

    let baseFinalTeam1Points: number;
    let baseFinalTeam2Points: number;
    let winningTeam: 1 | 2;

    if (buyingTeamSucceeded) {
      winningTeam = buyingTeam;
      baseFinalTeam1Points = t1;
      baseFinalTeam2Points = t2;
    } else {
      winningTeam = otherTeam;
      baseFinalTeam1Points = winningTeam === 1 ? totalPoints : 0;
      baseFinalTeam2Points = winningTeam === 2 ? totalPoints : 0;
    }

    const multiplierFactor =
      multiplier === 'عادي'
        ? 1
        : multiplier === 'دبل'
          ? 2
          : multiplier === '×3'
            ? 2.5
            : 4;

    const roundByRules = (value: number) => {
      if (Number.isInteger(value)) return value;
      const floored = Math.floor(value);
      const frac = value - floored;

      // العدد المناصف: في الحكم يُكسر، وفي الصن يتبع التقريب الطبيعي
      if (Math.abs(frac - 0.5) < 1e-9) {
        return gameType === 'حكم' ? floored : Math.round(value);
      }

      return Math.round(value);
    };

    const applyMultiplier = (points: number) => roundByRules(points * multiplierFactor);

    return {
      winningTeam,
      finalTeam1Points: applyMultiplier(baseFinalTeam1Points),
      finalTeam2Points: applyMultiplier(baseFinalTeam2Points),
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

  const undoLastRound = () => {
    if (!game || game.rounds.length === 0) return;
    const lastRound = game.rounds[game.rounds.length - 1];
    deleteRound(lastRound.id);
  };

  const resetGame = () => {
    setGame(null);
  };

  return (
    <GameContext.Provider value={{ game, startGame, addRound, deleteRound, undoLastRound, resetGame, canDoubleSun }}>
      {children}
    </GameContext.Provider>
  );
};
