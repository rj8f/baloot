/**
 * ملف أنواع وثوابت البلوت
 * Baloot Types and Constants
 * للاستخدام في React Native / Expo
 */

// أنواع اللعب
export const GAME_TYPES = {
  HOKM: 'حكم',
  SUN: 'صن',
};

// المضاعفات
export const MULTIPLIERS = {
  NORMAL: 'عادي',
  DOUBLE: 'دبل',
  TRIPLE: '×3',
  QUADRUPLE: '×4',
  QAHWA: 'قهوة',
};

// قيم المشاريع حسب نوع اللعب
export const PROJECT_VALUES = {
  صن: {
    سرا: 4,      // 3 أوراق متتالية
    خمسين: 10,  // 4 أوراق متتالية
    مية: 20,    // 5 أوراق متتالية أو 4 من نوع
    أربعمية: 40, // 4 إكك في الصن
    بلوت: 0,    // لا يوجد بلوت في الصن
  },
  حكم: {
    سرا: 2,
    خمسين: 5,
    مية: 10,
    أربعمية: 0, // في الحكم تصبح مية
    بلوت: 2,    // شايب وبنت الحكم
  },
};

// مجموع البنط الكلي
export const TOTAL_RAW_POINTS = {
  صن: 130,
  حكم: 162,
};

// نقاط الكبوت
export const KABOOT_POINTS = {
  صن: 44,
  حكم: 25,
};

// نقطة الفوز
export const WINNING_SCORE = 152;

/**
 * إنشاء مشاريع فارغة
 * @returns {Object} مشاريع فارغة
 */
export const createEmptyProjects = () => ({
  سرا: 0,
  خمسين: 0,
  مية: 0,
  أربعمية: 0,
  بلوت: 0,
});

/**
 * الحدود القصوى للمشاريع
 * @param {string} projectKey - اسم المشروع
 * @param {string} gameType - نوع اللعب (صن/حكم)
 * @returns {number} الحد الأقصى
 */
export const getProjectMaxCount = (projectKey, gameType) => {
  if (projectKey === 'بلوت') return 1;
  if (projectKey === 'مية') return 2;
  if (projectKey === 'أربعمية' && gameType === 'صن') return 1;
  return 4; // سرا وخمسين
};
