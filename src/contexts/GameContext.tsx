import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Game, 
  Round, 
  GameType, 
  Multiplier, 
  TeamProjects,
  calculateProjectsWithoutBaloot,
  calculateBalootPoints,
} from '@/types/baloot';
import { supabase } from '@/integrations/supabase/client';

interface RoundInput {
  gameType: GameType;
  buyingTeam: 1 | 2;
  team1RawPoints: number;
  team2RawPoints: number;
  team1Projects: TeamProjects;
  team2Projects: TeamProjects;
  multiplier: Multiplier;
  kabootTeam?: 1 | 2 | null; // الفريق الذي حصل على كبوت (إن وجد)
}

interface GameContextType {
  game: Game | null;
  startGame: (team1Name: string, team2Name: string, winningScore: number) => void;
  addRound: (round: RoundInput) => void;
  deleteRound: (roundId: string) => void;
  undoLastRound: () => void;
  resetGame: () => void;
  canDoubleSun: () => boolean;
  previewRoundResult: (round: RoundInput) => { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number };
  setScores: (team1Score: number, team2Score: number) => void;
  initGameIfNeeded: () => void;
}

export type { RoundInput };

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

  // دالة حساب نتيجة الجولة - متاحة للاستخدام الخارجي للمعاينة
  const calculateRoundResult = (
    roundData: RoundInput
  ): { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number } => {
    const { gameType, buyingTeam, team1RawPoints, team2RawPoints, team1Projects, team2Projects, multiplier, kabootTeam } = roundData;
    const otherTeam: 1 | 2 = buyingTeam === 1 ? 2 : 1;

    // كبوت: الفريق الفائز يحصل على 25 في الحكم أو 44 في الصن + مشاريعه
    if (kabootTeam) {
      const kabootPoints = gameType === 'حكم' ? 25 : 44;
      const kabootTeamProjects = kabootTeam === 1 ? team1Projects : team2Projects;
      const projectPoints = calculateProjectsWithoutBaloot(kabootTeamProjects, gameType);
      const balootPoints = calculateBalootPoints(kabootTeamProjects, gameType);
      
      // PROJECT_VALUES للصن مضاعفة مسبقاً، لا حاجة للضرب في sunFactor
      const finalPoints = kabootPoints + projectPoints + balootPoints;
      
      return {
        winningTeam: kabootTeam,
        finalTeam1Points: kabootTeam === 1 ? finalPoints : 0,
        finalTeam2Points: kabootTeam === 2 ? finalPoints : 0,
      };
    }

    // قهوة: من يربح يأخذ اللعبة كلها (152 نقطة)
    if (multiplier === 'قهوة') {
      return {
        winningTeam: buyingTeam,
        finalTeam1Points: buyingTeam === 1 ? 152 : 0,
        finalTeam2Points: buyingTeam === 2 ? 152 : 0,
      };
    }

    // حساب نقاط المشاريع (كنقاط - لا تُضرب في 10)
    const team1ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team1Projects, gameType);
    const team2ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team2Projects, gameType);
    const team1Baloot = calculateBalootPoints(team1Projects, gameType);
    const team2Baloot = calculateBalootPoints(team2Projects, gameType);

    // البنط الخام لكل فريق (أكلات + أرض فقط)
    const team1TotalRaw = team1RawPoints;
    const team2TotalRaw = team2RawPoints;

    // المجموع الكلي للبنط (بدون المشاريع - المشاريع تُحسب منفصلة)
    const totalRaw = team1TotalRaw + team2TotalRaw;

    // التحقق من نجاح المشتري
    // يجب أن يحصل على نصف البنط الكلي أو أكثر
    const buyingTeamRaw = buyingTeam === 1 ? team1TotalRaw : team2TotalRaw;
    const otherTeamRaw = buyingTeam === 1 ? team2TotalRaw : team1TotalRaw;

    const halfTotalRaw = totalRaw / 2;
    const buyingTeamSucceeded = buyingTeamRaw >= halfTotalRaw && buyingTeamRaw >= otherTeamRaw;

    let winningTeam: 1 | 2;
    let team1FinalRaw: number;
    let team2FinalRaw: number;
    let team1FinalProjects: number;
    let team2FinalProjects: number;
    let team1FinalBaloot: number;
    let team2FinalBaloot: number;

    // في حالة المضاعفات (غير عادي) - الفائز ياخذ كل النقاط
    const hasMultiplier = multiplier !== 'عادي';

    if (buyingTeamSucceeded) {
      // المشتري نجح
      winningTeam = buyingTeam;
      
      if (hasMultiplier) {
        // في المضاعفات: الفائز ياخذ كل البنط والمشاريع
        if (winningTeam === 1) {
          team1FinalRaw = totalRaw;
          team2FinalRaw = 0;
          team1FinalProjects = team1ProjectsWithoutBaloot + team2ProjectsWithoutBaloot;
          team2FinalProjects = 0;
          team1FinalBaloot = team1Baloot + team2Baloot;
          team2FinalBaloot = 0;
        } else {
          team1FinalRaw = 0;
          team2FinalRaw = totalRaw;
          team1FinalProjects = 0;
          team2FinalProjects = team1ProjectsWithoutBaloot + team2ProjectsWithoutBaloot;
          team1FinalBaloot = 0;
          team2FinalBaloot = team1Baloot + team2Baloot;
        }
      } else {
        // عادي: كل فريق يأخذ نقاطه
        team1FinalRaw = team1TotalRaw;
        team2FinalRaw = team2TotalRaw;
        team1FinalProjects = team1ProjectsWithoutBaloot;
        team2FinalProjects = team2ProjectsWithoutBaloot;
        team1FinalBaloot = team1Baloot;
        team2FinalBaloot = team2Baloot;
      }
    } else {
      // المشتري خسر - الخصم يأخذ كل البنط والمشاريع
      winningTeam = otherTeam;
      const totalProjects = team1ProjectsWithoutBaloot + team2ProjectsWithoutBaloot;
      const totalBaloot = team1Baloot + team2Baloot;
      
      if (winningTeam === 1) {
        team1FinalRaw = totalRaw;
        team2FinalRaw = 0;
        team1FinalProjects = totalProjects;
        team2FinalProjects = 0;
        team1FinalBaloot = totalBaloot;
        team2FinalBaloot = 0;
      } else {
        team1FinalRaw = 0;
        team2FinalRaw = totalRaw;
        team1FinalProjects = 0;
        team2FinalProjects = totalProjects;
        team1FinalBaloot = 0;
        team2FinalBaloot = totalBaloot;
      }
    }

    // تحويل البنط للنقاط (÷ 10 مع التقريب)
    let team1RawScore = rawToScore(team1FinalRaw, gameType);
    let team2RawScore = rawToScore(team2FinalRaw, gameType);

    // تطبيق المضاعفة
    const multiplierFactor =
      multiplier === 'عادي' ? 1 :
      multiplier === 'دبل' ? 2 :
      multiplier === '×3' ? 2.5 : 4; // ×3 = 16+16+8=40 يعني 2.5

    // في الصن: البنط يُضرب في 2 (قبل أي مضاعفات أخرى)
    // المشاريع لا تُضرب في sunFactor لأن قيمها في PROJECT_VALUES مضاعفة مسبقاً
    const sunFactor = gameType === 'صن' ? 2 : 1;

    // النقاط النهائية = (بنط ÷ 10 × مضاعف الصن + مشاريع) × المضاعف + بلوت
    // البلوت لا يتضاعف
    const finalTeam1Points = Math.round((team1RawScore * sunFactor + team1FinalProjects) * multiplierFactor) + team1FinalBaloot;
    const finalTeam2Points = Math.round((team2RawScore * sunFactor + team2FinalProjects) * multiplierFactor) + team2FinalBaloot;

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

    const updatedGame = {
      ...game,
      team1Score: newTeam1Score,
      team2Score: newTeam2Score,
      rounds: [...game.rounds, newRound],
      winner,
    };

    setGame(updatedGame);

    // حفظ المباراة عند انتهائها
    if (winner) {
      saveGameToHistory(updatedGame);
    }
  };

  const saveGameToHistory = async (gameData: Game) => {
    try {
      await supabase.from('games').insert([{
        team1_name: gameData.team1Name,
        team2_name: gameData.team2Name,
        team1_score: gameData.team1Score,
        team2_score: gameData.team2Score,
        winner: gameData.winner,
        rounds: JSON.parse(JSON.stringify(gameData.rounds)),
        finished_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Error saving game:', error);
    }
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

  const previewRoundResult = (roundData: RoundInput) => {
    return calculateRoundResult(roundData);
  };

  // تحديث النتيجة مباشرة (للمزامنة بين الحاسبتين)
  const setScores = (team1Score: number, team2Score: number) => {
    if (!game) return;
    
    let winner: 1 | 2 | null = null;
    if (team1Score >= game.winningScore) winner = 1;
    else if (team2Score >= game.winningScore) winner = 2;

    const updatedGame = {
      ...game,
      team1Score,
      team2Score,
      winner,
    };

    setGame(updatedGame);

    if (winner) {
      saveGameToHistory(updatedGame);
    }
  };

  // تهيئة اللعبة إذا لم تكن موجودة
  const initGameIfNeeded = () => {
    if (!game) {
      startGame('لنا', 'لهم', 152);
    }
  };

  return (
    <GameContext.Provider value={{ game, startGame, addRound, deleteRound, undoLastRound, resetGame, canDoubleSun, previewRoundResult, setScores, initGameIfNeeded }}>
      {children}
    </GameContext.Provider>
  );
};
