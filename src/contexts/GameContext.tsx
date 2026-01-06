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
  miyaDoubleOnly?: boolean; // في حكم مع ×3 أو ×4، المية أقصاها ×2
  allProjectsDoubleOnly?: boolean; // في حكم مع ×3 أو ×4، كل المشاريع (سرا، 50، 100) أقصاها ×2
  hokmWithoutPointsMode?: boolean; // وضع حكم بدون أبناط
}

export interface SimpleHistoryEntry {
  id: string;
  team1: number;
  team2: number;
  createdAt: number;  // timestamp للترتيب الزمني
}

interface GameContextType {
  game: Game | null;
  calculatorMode: 'simple' | 'advanced' | null;
  simpleHistory: SimpleHistoryEntry[];
  startGame: (team1Name: string, team2Name: string, winningScore: number) => void;
  startSimpleMode: () => void;
  switchToAdvanced: () => void;
  switchToSimple: () => void;
  goToSelection: () => void;
  addRound: (round: RoundInput) => void;
  deleteRound: (roundId: string) => void;
  deleteSimpleEntry: (entryId: string) => void;
  undoLast: () => void;  // تراجع موحد
  resetGame: () => void;
  canDoubleSun: () => boolean;
  previewRoundResult: (round: RoundInput) => { winningTeam: 1 | 2; finalTeam1Points: number; finalTeam2Points: number };
  setScores: (team1Score: number, team2Score: number) => void;
  addSimpleHistoryEntry: (entry: { id: string; team1: number; team2: number }) => void;
  getUnifiedHistory: () => Array<{ type: 'simple' | 'advanced'; entry: SimpleHistoryEntry | Round; createdAt: number }>;
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
  // تحميل البيانات من localStorage عند البدء
  const [game, setGame] = useState<Game | null>(() => {
    const saved = localStorage.getItem('baloot_game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, createdAt: new Date(parsed.createdAt) };
      } catch { return null; }
    }
    return null;
  });
  
  const [calculatorMode, setCalculatorMode] = useState<'simple' | 'advanced' | null>(() => {
    return localStorage.getItem('baloot_mode') as 'simple' | 'advanced' | null;
  });

  const [simpleHistory, setSimpleHistory] = useState<SimpleHistoryEntry[]>(() => {
    const saved = localStorage.getItem('baloot_simple_history');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // إضافة createdAt للسجلات القديمة
        return parsed.map((e: any, i: number) => ({
          ...e,
          createdAt: e.createdAt ?? Date.now() - (parsed.length - i) * 1000
        }));
      } catch { return []; }
    }
    return [];
  });

  // حفظ البيانات في localStorage عند التغيير
  useEffect(() => {
    if (game) {
      localStorage.setItem('baloot_game', JSON.stringify(game));
    } else {
      localStorage.removeItem('baloot_game');
    }
  }, [game]);

  useEffect(() => {
    if (calculatorMode) {
      localStorage.setItem('baloot_mode', calculatorMode);
    } else {
      localStorage.removeItem('baloot_mode');
    }
  }, [calculatorMode]);

  useEffect(() => {
    localStorage.setItem('baloot_simple_history', JSON.stringify(simpleHistory));
  }, [simpleHistory]);

  // دالة الإعلان الصوتي للنتيجة
  const announceScore = (team1Name: string, team2Name: string, team1Score: number, team2Score: number) => {
    // التحقق من إعداد كتم الصوت
    const settingsStr = localStorage.getItem('baloot_settings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        if (settings.isMuted) return;
      } catch {}
    }
    
    if ('speechSynthesis' in window) {
      // إيقاف أي إعلان سابق
      window.speechSynthesis.cancel();
      
      const announcement = `${team1Name} ${team1Score}، ${team2Name} ${team2Score}`;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // اختيار صوت عربي إن وجد
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const createNewGame = () => ({
    id: crypto.randomUUID(),
    team1Name: 'لنا',
    team2Name: 'لهم',
    team1Score: 0,
    team2Score: 0,
    winningScore: 152,
    rounds: [],
    winner: null,
    createdAt: new Date(),
  });

  const startGame = (team1Name: string, team2Name: string, winningScore: number) => {
    setCalculatorMode('advanced');
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

  const startSimpleMode = () => {
    setCalculatorMode('simple');
    if (!game) {
      setGame(createNewGame());
    }
  };

  const switchToAdvanced = () => {
    setCalculatorMode('advanced');
  };

  const switchToSimple = () => {
    setCalculatorMode('simple');
  };

  const goToSelection = () => {
    setCalculatorMode(null);
  };

  const addSimpleHistoryEntry = (entry: { id: string; team1: number; team2: number }) => {
    const entryWithTime: SimpleHistoryEntry = {
      ...entry,
      createdAt: Date.now(),
    };
    setSimpleHistory(prev => [entryWithTime, ...prev]);
  };

  const deleteSimpleEntry = (entryId: string) => {
    const entry = simpleHistory.find(e => e.id === entryId);
    if (!entry) return;
    if (game) {
      const newTeam1Score = game.team1Score - entry.team1;
      const newTeam2Score = game.team2Score - entry.team2;
      setScores(newTeam1Score, newTeam2Score);
    }
    setSimpleHistory(prev => prev.filter(e => e.id !== entryId));
  };

  // الحصول على السجل الموحد مرتب من الأحدث
  const getUnifiedHistory = () => {
    const simpleEntries = simpleHistory.map(e => ({
      type: 'simple' as const,
      entry: e,
      createdAt: e.createdAt,
    }));
    
    const advancedEntries = (game?.rounds ?? []).map(r => ({
      type: 'advanced' as const,
      entry: r,
      createdAt: r.createdAt ?? 0,
    }));
    
    return [...simpleEntries, ...advancedEntries].sort((a, b) => b.createdAt - a.createdAt);
  };

  // تراجع موحد - يحذف آخر إدخال بغض النظر عن نوعه
  const undoLast = () => {
    const unified = getUnifiedHistory();
    if (unified.length === 0) return;
    
    const last = unified[0];
    if (last.type === 'simple') {
      deleteSimpleEntry((last.entry as SimpleHistoryEntry).id);
    } else {
      deleteRound((last.entry as Round).id);
    }
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
    const { gameType, buyingTeam, team1RawPoints, team2RawPoints, team1Projects, team2Projects, multiplier, kabootTeam, miyaDoubleOnly, allProjectsDoubleOnly, hokmWithoutPointsMode } = roundData;
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

    // البنط بعد تطبيق خيار "بدون أبناط" (إن كان مفعلاً)
    let team1AdjustedRaw = team1TotalRaw;
    let team2AdjustedRaw = team2TotalRaw;

    // المجموع الكلي للبنط (أكلات + أرض فقط)
    const totalRaw = team1TotalRaw + team2TotalRaw;

    // تحويل المشاريع إلى مكافئها الخام للتحقق من نجاح المشتري
    // في الحكم: النقاط × 10 لأن التقريب /10
    // في الصن: النقاط كما هي لأن التقريب غير مطلوب (1 نقطة = 1 بنط)
    const projectMultiplier = gameType === 'حكم' ? 10 : 1;
    const team1ProjectsRawEq = team1ProjectsWithoutBaloot * projectMultiplier;
    const team2ProjectsRawEq = team2ProjectsWithoutBaloot * projectMultiplier;
    const team1BalootRawEq = team1Baloot * projectMultiplier;
    const team2BalootRawEq = team2Baloot * projectMultiplier;

    // التحقق من نجاح المشتري
    let buyingTeamRaw = buyingTeam === 1 ? team1AdjustedRaw : team2AdjustedRaw;
    let otherTeamRaw = buyingTeam === 1 ? team2AdjustedRaw : team1AdjustedRaw;

    const buyingTeamProjectsRawEq = buyingTeam === 1 ? team1ProjectsRawEq : team2ProjectsRawEq;
    const otherTeamProjectsRawEq = buyingTeam === 1 ? team2ProjectsRawEq : team1ProjectsRawEq;
    const buyingTeamBalootRawEq = buyingTeam === 1 ? team1BalootRawEq : team2BalootRawEq;
    const otherTeamBalootRawEq = buyingTeam === 1 ? team2BalootRawEq : team1BalootRawEq;

    // إذا كانت الخاصية مفعلة: ننقل 5 أبناط (خام) من الخصم للمشتري إذا آحاد مجموع المشتري (مع المشاريع والبلوت) 0/6/7/8/9
    if (hokmWithoutPointsMode && gameType === 'حكم' && multiplier === 'عادي') {
      const buyingTotalRawForRule = buyingTeamRaw + buyingTeamProjectsRawEq + buyingTeamBalootRawEq;
      const ones = ((buyingTotalRawForRule % 10) + 10) % 10;
      if (ones >= 6 || ones === 0) {
        const transfer = Math.min(5, Math.max(0, otherTeamRaw));

        buyingTeamRaw += transfer;
        otherTeamRaw -= transfer;

        if (buyingTeam === 1) {
          team1AdjustedRaw = buyingTeamRaw;
          team2AdjustedRaw = otherTeamRaw;
        } else {
          team2AdjustedRaw = buyingTeamRaw;
          team1AdjustedRaw = otherTeamRaw;
        }
      }
    }

    const buyingTeamTotalRawForSuccess = buyingTeamRaw + buyingTeamProjectsRawEq + buyingTeamBalootRawEq;
    const otherTeamTotalRawForSuccess = otherTeamRaw + otherTeamProjectsRawEq + otherTeamBalootRawEq;
    const grandTotalRawForSuccess = buyingTeamTotalRawForSuccess + otherTeamTotalRawForSuccess;
    const halfTotalRawForSuccess = grandTotalRawForSuccess / 2;

    console.log('=== تشخيص نجاح المشتري ===');
    console.log('المشتري:', buyingTeam === 1 ? 'فريق 1' : 'فريق 2');
    console.log('أبناط المشتري (بعد التعديل):', buyingTeamRaw);
    console.log('مشاريع المشتري (خام):', buyingTeamProjectsRawEq);
    console.log('بلوت المشتري (خام):', buyingTeamBalootRawEq);
    console.log('مجموع المشتري الكلي:', buyingTeamTotalRawForSuccess);
    console.log('أبناط الخصم (بعد التعديل):', otherTeamRaw);
    console.log('مشاريع الخصم (خام):', otherTeamProjectsRawEq);
    console.log('مجموع الخصم الكلي:', otherTeamTotalRawForSuccess);
    console.log('المجموع الكلي:', grandTotalRawForSuccess);
    console.log('النصف:', halfTotalRawForSuccess);
    console.log('نجح المشتري؟', buyingTeamTotalRawForSuccess >= halfTotalRawForSuccess);

    const buyingTeamSucceeded = buyingTeamTotalRawForSuccess >= halfTotalRawForSuccess;

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
        // إذا كانت الخاصية مفعلة، نستخدم النقاط المُعدَّلة
        const useAdjusted = hokmWithoutPointsMode && gameType === 'حكم' && multiplier === 'عادي';
        team1FinalRaw = useAdjusted ? team1AdjustedRaw : team1TotalRaw;
        team2FinalRaw = useAdjusted ? team2AdjustedRaw : team2TotalRaw;
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

    // حالة خاصة: في الحكم العادي، إذا كان المشتري 86 والخصم 76
    // التقريب العادي يعطي 9+8=17، لكن المجموع الصحيح 16
    // القاعدة: المشتري يأخذ 9 والخصم يأخذ 7
    if (gameType === 'حكم' && !hasMultiplier && buyingTeamSucceeded) {
      const buyingRaw = buyingTeam === 1 ? team1FinalRaw : team2FinalRaw;
      const otherRaw = buyingTeam === 1 ? team2FinalRaw : team1FinalRaw;
      
      // إذا المشتري 86 والخصم 76
      if (buyingRaw === 86 && otherRaw === 76) {
        if (buyingTeam === 1) {
          team1RawScore = 9;
          team2RawScore = 7;
        } else {
          team1RawScore = 7;
          team2RawScore = 9;
        }
      }
    }

    // تطبيق المضاعفة
    const multiplierFactor =
      multiplier === 'عادي' ? 1 :
      multiplier === 'دبل' ? 2 :
      multiplier === '×3' ? 3 : 4;

    // في الصن: البنط يُضرب في 2 (قبل أي مضاعفات أخرى)
    // المشاريع لا تُضرب في sunFactor لأن قيمها في PROJECT_VALUES مضاعفة مسبقاً
    const sunFactor = gameType === 'صن' ? 2 : 1;

    // حساب تعديل المشاريع إذا اختار اللاعب ×2 فقط
    // في حكم مع ×3 أو ×4
    let projectsAdjustment = 0;
    
    if (gameType === 'حكم' && (multiplier === '×3' || multiplier === '×4')) {
      // إذا allProjectsDoubleOnly: كل المشاريع (سرا، 50، 100) أقصاها ×2
      if (allProjectsDoubleOnly) {
        const team1Sira = team1Projects.سرا;
        const team2Sira = team2Projects.سرا;
        const team150 = team1Projects.خمسين;
        const team250 = team2Projects.خمسين;
        const team1100 = team1Projects.مية;
        const team2100 = team2Projects.مية;
        
        // قيم المشاريع في الحكم: سرا=2، 50=5، 100=10
        const siraAdjust = (team1Sira + team2Sira) * 2 * (multiplierFactor - 2);
        const fiftyAdjust = (team150 + team250) * 5 * (multiplierFactor - 2);
        const miyaAdjust = (team1100 + team2100) * 10 * (multiplierFactor - 2);
        
        projectsAdjustment = siraAdjust + fiftyAdjust + miyaAdjust;
      }
      // إذا miyaDoubleOnly: المية فقط أقصاها ×2
      else if (miyaDoubleOnly) {
        const team1MiyaCount = team1Projects.مية;
        const team2MiyaCount = team2Projects.مية;
        const totalMiyaCount = team1MiyaCount + team2MiyaCount;
        
        if (totalMiyaCount > 0) {
          const miyaBaseValue = 10; // قيمة المية في الحكم
          projectsAdjustment = totalMiyaCount * miyaBaseValue * (multiplierFactor - 2);
        }
      }
    }

    // النقاط النهائية = (بنط ÷ 10 × مضاعف الصن + مشاريع) × المضاعف + بلوت
    // البلوت لا يتضاعف
    let finalTeam1Points = Math.round((team1RawScore * sunFactor + team1FinalProjects) * multiplierFactor) + team1FinalBaloot;
    let finalTeam2Points = Math.round((team2RawScore * sunFactor + team2FinalProjects) * multiplierFactor) + team2FinalBaloot;

    // تطبيق تعديل المشاريع - نطرح الفرق من الفائز فقط
    if (projectsAdjustment > 0) {
      if (winningTeam === 1) {
        finalTeam1Points -= projectsAdjustment;
      } else {
        finalTeam2Points -= projectsAdjustment;
      }
    }

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
      createdAt: Date.now(),
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

    // إعلان النتيجة صوتياً
    announceScore(game.team1Name, game.team2Name, newTeam1Score, newTeam2Score);

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


  const resetGame = () => {
    setGame(null);
    setCalculatorMode(null);
    setSimpleHistory([]);
    localStorage.removeItem('baloot_game');
    localStorage.removeItem('baloot_mode');
    localStorage.removeItem('baloot_simple_history');
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

  return (
    <GameContext.Provider value={{ 
      game, 
      calculatorMode, 
      simpleHistory,
      startGame, 
      startSimpleMode, 
      switchToAdvanced,
      switchToSimple,
      goToSelection,
      addRound, 
      deleteRound,
      deleteSimpleEntry,
      undoLast,
      resetGame, 
      canDoubleSun, 
      previewRoundResult, 
      setScores,
      addSimpleHistoryEntry,
      getUnifiedHistory,
    }}>
      {children}
    </GameContext.Provider>
  );
};
