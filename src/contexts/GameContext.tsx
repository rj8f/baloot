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

  // تحويل البنط الخام إلى نقاط الجولة (القسمة على 10 مع التقريب)
  const rawToFinalScore = (rawPoints: number, gameType: GameType): number => {
    const divided = rawPoints / 10;
    const floored = Math.floor(divided);
    const decimal = divided - floored;

    // قواعد التقريب:
    // أقل من 0.5 = يكسر (floor)
    // أكثر من 0.5 = يجبر (ceil)
    // بالضبط 0.5:
    //   - في الصن: يضاعف (3.5 → 7)
    //   - في الحكم: يكسر (4.5 → 4)
    if (decimal < 0.5) {
      return floored;
    } else if (decimal > 0.5) {
      return floored + 1;
    } else {
      // decimal === 0.5
      if (gameType === 'صن') {
        return Math.round(divided * 2) / 2 * 2; // 3.5 * 2 = 7
      } else {
        return floored; // في الحكم يكسر
      }
    }
  };

  const calculateRoundResult = (
    gameType: GameType,
    buyingTeam: 1 | 2,
    team1RawPoints: number,
    team2RawPoints: number,
    multiplier: Multiplier
  ): { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number } => {
    const otherTeam: 1 | 2 = buyingTeam === 1 ? 2 : 1;

    // قهوة: من يربح يأخذ اللعبة كلها
    if (multiplier === 'قهوة') {
      return {
        winningTeam: buyingTeam,
        finalTeam1Points: buyingTeam === 1 ? 152 : 0,
        finalTeam2Points: buyingTeam === 2 ? 152 : 0,
      };
    }

    // المجموع الكلي للبنط
    const totalRaw = gameType === 'صن' ? 260 : 162;
    
    // تأكد من صحة القيم المدخلة
    const t1Raw = Math.max(0, Math.min(team1RawPoints, totalRaw));
    const t2Raw = Math.max(0, Math.min(team2RawPoints, totalRaw));

    const buyingTeamRaw = buyingTeam === 1 ? t1Raw : t2Raw;
    const otherTeamRaw = buyingTeam === 1 ? t2Raw : t1Raw;

    // تحويل البنط لنقاط الجولة
    let team1Score = rawToFinalScore(t1Raw, gameType);
    let team2Score = rawToFinalScore(t2Raw, gameType);

    // نجاح المشتري: يجب أن يحصل على نصف البنط أو أكثر (ويتفوق أو يتساوى مع الخصم)
    const halfRaw = totalRaw / 2;
    const buyingTeamSucceeded = buyingTeamRaw >= halfRaw && buyingTeamRaw >= otherTeamRaw;

    let winningTeam: 1 | 2;

    if (buyingTeamSucceeded) {
      // المشتري نجح - كل فريق يأخذ نقاطه
      winningTeam = buyingTeam;
    } else {
      // المشتري خسر - الخصم يأخذ كل النقاط (بما فيها مشاريع المشتري)
      winningTeam = otherTeam;
      const totalScore = team1Score + team2Score;
      team1Score = winningTeam === 1 ? totalScore : 0;
      team2Score = winningTeam === 2 ? totalScore : 0;
    }

    // تطبيق المضاعفة (البلوت لا يتضاعف لكن هنا نفترض المدخل شامل المشاريع بعد الحساب)
    const multiplierFactor =
      multiplier === 'عادي' ? 1 :
      multiplier === 'دبل' ? 2 :
      multiplier === '×3' ? 3 : 4;

    return {
      winningTeam,
      finalTeam1Points: team1Score * multiplierFactor,
      finalTeam2Points: team2Score * multiplierFactor,
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
