/**
 * ملف حسابات البلوت الأساسية
 * Baloot Core Calculations
 * للاستخدام في React Native / Expo
 */

import { PROJECT_VALUES, TOTAL_RAW_POINTS, KABOOT_POINTS } from './baloot-types.js';

/**
 * حساب نقاط المشاريع (بدون البلوت)
 * @param {Object} projects - المشاريع
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} مجموع النقاط
 */
export const calculateProjectsWithoutBaloot = (projects, gameType) => {
  const values = PROJECT_VALUES[gameType];
  return (
    projects.سرا * values.سرا +
    projects.خمسين * values.خمسين +
    projects.مية * values.مية +
    projects.أربعمية * values.أربعمية
  );
};

/**
 * حساب نقاط البلوت فقط
 * @param {Object} projects - المشاريع
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} نقاط البلوت
 */
export const calculateBalootPoints = (projects, gameType) => {
  if (gameType === 'صن') return 0;
  return projects.بلوت * PROJECT_VALUES.حكم.بلوت;
};

/**
 * حساب مجموع نقاط المشاريع الكاملة
 * @param {Object} projects - المشاريع
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} مجموع النقاط
 */
export const calculateProjectsPoints = (projects, gameType) => {
  return calculateProjectsWithoutBaloot(projects, gameType) + calculateBalootPoints(projects, gameType);
};

/**
 * تحويل البنط الخام إلى نقاط (القسمة على 10 مع التقريب)
 * @param {number} rawPoints - البنط الخام
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} النقاط بعد التقريب
 * 
 * قواعد التقريب:
 * - أقل من 0.5 = يكسر (floor)
 * - أكثر من 0.5 = يجبر (ceil)
 * - بالضبط 0.5:
 *   - في الصن: يضاعف (3.5 × 2 = 7)
 *   - في الحكم: يكسر (4.5 → 4)
 */
export const rawToScore = (rawPoints, gameType) => {
  const divided = rawPoints / 10;
  const floored = Math.floor(divided);
  const decimal = divided - floored;

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

/**
 * حساب البنط للفريق الآخر
 * @param {number} enteredPoints - البنط المدخل
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} بنط الفريق الآخر
 */
export const calculateOtherTeamRaw = (enteredPoints, gameType) => {
  const total = TOTAL_RAW_POINTS[gameType];
  return total - enteredPoints;
};

/**
 * التحقق من إمكانية الدبل في الصن
 * @param {number} team1Score - نقاط الفريق 1
 * @param {number} team2Score - نقاط الفريق 2
 * @returns {boolean} هل يمكن الدبل
 */
export const canDoubleSun = (team1Score, team2Score) => {
  return (team1Score <= 100 && team2Score >= 101) || (team2Score <= 100 && team1Score >= 101);
};

/**
 * الحصول على معامل المضاعفة
 * @param {string} multiplier - نوع المضاعفة
 * @returns {number} المعامل (1, 2, 3, 4)
 */
export const getMultiplierFactor = (multiplier) => {
  switch (multiplier) {
    case 'دبل': return 2;
    case '×3': return 3;
    case '×4': return 4;
    default: return 1;
  }
};
