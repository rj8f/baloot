import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Game, 
  Round, 
  GameType, 
  Multiplier, 
  TeamProjects,
  calculateProjectsWithoutBaloot,
  calculateBalootPoints,
} from '@/types/baloot';

interface RoundInput {
  gameType: GameType;
  buyingTeam: 1 | 2;
  team1RawPoints: number;
  team2RawPoints: number;
  team1Projects: TeamProjects;
  team2Projects: TeamProjects;
  multiplier: Multiplier;
}

interface GameContextType {
  game: Game | null;
  startGame: (team1Name: string, team2Name: string, winningScore: number) => void;
  addRound: (round: RoundInput) => void;
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

  // تحويل البنط الخام إلى نقاط (القسمة على 10 مع التقريب)
  const rawToScore = (rawPoints: number, gameType: GameType): number => {
    const divided = rawPoints / 10;
    const floored = Math.floor(divided);
    const decimal = divided - floored;

    // قواعد التقريب:
    // أقل من 0.5 = يكسر (floor)
    // أكثر من 0.5 = يجبر (ceil)
    // بالضبط 0.5:
    //   - في الصن: يضاعف (3.5 × 2 = 7)
    //   - في الحكم: يكسر (4.5 → 4)
    if (decimal < 0.5) {
      return floored;
    } else if (decimal > 0.5) {
      return floored + 1;
    } else {
      // decimal === 0.5
      if (gameType === 'صن') {
        // في الصن: 3.5 × 2 = 7
        return floored * 2 + 1;
      } else {
        return floored; // في الحكم يكسر
      }
    }
  };

  const calculateRoundResult = (
    roundData: RoundInput
  ): { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number } => {
    const { gameType, buyingTeam, team1RawPoints, team2RawPoints, team1Projects, team2Projects, multiplier } = roundData;
    const otherTeam: 1 | 2 = buyingTeam === 1 ? 2 : 1;

    // قهوة: من يربح يأخذ اللعبة كلها (152 نقطة)
    if (multiplier === 'قهوة') {
      return {
        winningTeam: buyingTeam,
        finalTeam1Points: buyingTeam === 1 ? 152 : 0,
        finalTeam2Points: buyingTeam === 2 ? 152 : 0,
      };
    }

    // حساب نقاط المشاريع (بالأبناط - تضرب في 10)
    const team1ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team1Projects, gameType);
    const team2ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team2Projects, gameType);
    const team1Baloot = calculateBalootPoints(team1Projects, gameType);
    const team2Baloot = calculateBalootPoints(team2Projects, gameType);

    // المشاريع تُضرب في 10 وتُضاف للبنط الخام
    const team1ProjectsRaw = team1ProjectsWithoutBaloot * 10;
    const team2ProjectsRaw = team2ProjectsWithoutBaloot * 10;
    const team1BalootRaw = team1Baloot * 10;
    const team2BalootRaw = team2Baloot * 10;

    // المجموع الكلي للبنط مع المشاريع
    // صن: 260 + مشاريع
    // حكم: 162 + مشاريع
    const baseRawCards = gameType === 'صن' ? 260 : 162;
    const totalRawWithProjects = baseRawCards + team1ProjectsRaw + team2ProjectsRaw + team1BalootRaw + team2BalootRaw;

    // البنط الخام لكل فريق مع المشاريع
    const team1TotalRaw = team1RawPoints + team1ProjectsRaw + team1BalootRaw;
    const team2TotalRaw = team2RawPoints + team2ProjectsRaw + team2BalootRaw;

    // التحقق من نجاح المشتري
    // يجب أن يحصل على نصف البنط الكلي (مع المشاريع) أو أكثر ويتفوق أو يتساوى مع الخصم
    const buyingTeamTotalRaw = buyingTeam === 1 ? team1TotalRaw : team2TotalRaw;
    const otherTeamTotalRaw = buyingTeam === 1 ? team2TotalRaw : team1TotalRaw;

    const halfTotalRaw = totalRawWithProjects / 2;
    const buyingTeamSucceeded = buyingTeamTotalRaw >= halfTotalRaw && buyingTeamTotalRaw >= otherTeamTotalRaw;

    let winningTeam: 1 | 2;
    let team1FinalRaw: number;
    let team2FinalRaw: number;

    if (buyingTeamSucceeded) {
      // المشتري نجح - كل فريق يأخذ نقاطه
      winningTeam = buyingTeam;
      team1FinalRaw = team1TotalRaw;
      team2FinalRaw = team2TotalRaw;
    } else {
      // المشتري خسر - الخصم يأخذ كل البنط (بما فيها مشاريع المشتري)
      winningTeam = otherTeam;
      
      if (winningTeam === 1) {
        team1FinalRaw = totalRawWithProjects;
        team2FinalRaw = 0;
      } else {
        team1FinalRaw = 0;
        team2FinalRaw = totalRawWithProjects;
      }
    }

    // تحويل البنط للنقاط (÷ 10 مع التقريب)
    let team1Score = rawToScore(team1FinalRaw, gameType);
    let team2Score = rawToScore(team2FinalRaw, gameType);

    // تطبيق المضاعفة
    const multiplierFactor =
      multiplier === 'عادي' ? 1 :
      multiplier === 'دبل' ? 2 :
      multiplier === '×3' ? 2.5 : 4; // ×3 = 16+16+8=40 يعني 2.5

    // ملاحظة: البلوت يتضاعف مع باقي النقاط لأنه أصبح جزء من البنط الخام
    const finalTeam1Points = Math.round(team1Score * multiplierFactor);
    const finalTeam2Points = Math.round(team2Score * multiplierFactor);

    return {
      winningTeam,
      finalTeam1Points,
      finalTeam2Points,
    };
  };

  const addRound = (roundData: RoundInput) => {
    if (!game) return;

    const result = calculateRoundResult(roundData);

    const newRound: Round = {
      ...roundData,
      id: crypto.randomUUID(),
      roundNumber: game.rounds.length + 1,
      ...result,
      // للتوافق مع الكود القديم
      team1Points: roundData.team1RawPoints,
      team2Points: roundData.team2RawPoints,
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
