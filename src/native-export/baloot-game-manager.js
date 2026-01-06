/**
 * ملف إدارة اللعبة
 * Baloot Game Manager
 * للاستخدام في React Native / Expo
 */

import { WINNING_SCORE, createEmptyProjects } from './baloot-types.js';
import { calculateRoundResult } from './baloot-round-calculator.js';

/**
 * إنشاء لعبة جديدة
 * @param {string} team1Name - اسم الفريق 1
 * @param {string} team2Name - اسم الفريق 2
 * @param {number} winningScore - نقطة الفوز (الافتراضي 152)
 * @returns {Object} اللعبة الجديدة
 */
export const createNewGame = (team1Name = 'لنا', team2Name = 'لهم', winningScore = WINNING_SCORE) => ({
  id: generateId(),
  team1Name,
  team2Name,
  team1Score: 0,
  team2Score: 0,
  winningScore,
  rounds: [],
  winner: null,
  createdAt: Date.now(),
});

/**
 * إضافة جولة للعبة
 * @param {Object} game - اللعبة الحالية
 * @param {Object} roundData - بيانات الجولة
 * @returns {Object} اللعبة المحدثة
 */
export const addRoundToGame = (game, roundData) => {
  const result = calculateRoundResult(roundData);
  
  const newRound = {
    id: generateId(),
    roundNumber: game.rounds.length + 1,
    ...roundData,
    winningTeam: result.winningTeam,
    finalTeam1Points: result.finalTeam1Points,
    finalTeam2Points: result.finalTeam2Points,
    createdAt: Date.now(),
    // للتوافق
    team1Points: result.finalTeam1Points,
    team2Points: result.finalTeam2Points,
  };

  const newTeam1Score = game.team1Score + result.finalTeam1Points;
  const newTeam2Score = game.team2Score + result.finalTeam2Points;

  // التحقق من الفوز
  let winner = null;
  if (newTeam1Score >= game.winningScore && newTeam1Score > newTeam2Score) {
    winner = 1;
  } else if (newTeam2Score >= game.winningScore && newTeam2Score > newTeam1Score) {
    winner = 2;
  }

  return {
    ...game,
    team1Score: newTeam1Score,
    team2Score: newTeam2Score,
    rounds: [...game.rounds, newRound],
    winner,
  };
};

/**
 * حذف جولة من اللعبة
 * @param {Object} game - اللعبة الحالية
 * @param {string} roundId - معرف الجولة
 * @returns {Object} اللعبة المحدثة
 */
export const deleteRoundFromGame = (game, roundId) => {
  const round = game.rounds.find(r => r.id === roundId);
  if (!round) return game;

  const newTeam1Score = game.team1Score - round.finalTeam1Points;
  const newTeam2Score = game.team2Score - round.finalTeam2Points;

  return {
    ...game,
    team1Score: Math.max(0, newTeam1Score),
    team2Score: Math.max(0, newTeam2Score),
    rounds: game.rounds.filter(r => r.id !== roundId),
    winner: null, // إعادة فتح اللعبة
  };
};

/**
 * التراجع عن آخر جولة
 * @param {Object} game - اللعبة الحالية
 * @returns {Object} اللعبة المحدثة
 */
export const undoLastRound = (game) => {
  if (game.rounds.length === 0) return game;
  const lastRound = game.rounds[game.rounds.length - 1];
  return deleteRoundFromGame(game, lastRound.id);
};

/**
 * إعادة تعيين اللعبة
 * @param {Object} game - اللعبة الحالية
 * @returns {Object} اللعبة المُعاد تعيينها
 */
export const resetGame = (game) => ({
  ...game,
  team1Score: 0,
  team2Score: 0,
  rounds: [],
  winner: null,
});

/**
 * التحقق من انتهاء اللعبة
 * @param {Object} game - اللعبة
 * @returns {boolean} هل انتهت اللعبة
 */
export const isGameOver = (game) => game.winner !== null;

/**
 * الحصول على الفائز
 * @param {Object} game - اللعبة
 * @returns {string|null} اسم الفريق الفائز أو null
 */
export const getWinnerName = (game) => {
  if (!game.winner) return null;
  return game.winner === 1 ? game.team1Name : game.team2Name;
};

// ======== دوال مساعدة ========

/**
 * توليد معرف فريد
 * @returns {string} معرف فريد
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * تحويل الأرقام العربية للإنجليزية
 * @param {string} str - النص
 * @returns {string} النص بأرقام إنجليزية
 */
export const arabicToWestern = (str) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), index.toString());
  });
  return result;
};

/**
 * تحويل الأرقام الإنجليزية للعربية
 * @param {number} num - الرقم
 * @returns {string} الرقم بأرقام عربية
 */
export const westernToArabic = (num) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, d => arabicNumerals[d]);
};
