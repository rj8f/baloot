/**
 * ملف حساب نتيجة الجولة
 * Baloot Round Calculator
 * للاستخدام في React Native / Expo
 */

import { KABOOT_POINTS, TOTAL_RAW_POINTS } from './baloot-types.js';
import {
  calculateProjectsWithoutBaloot,
  calculateBalootPoints,
  rawToScore,
  getMultiplierFactor,
} from './baloot-calculations.js';

/**
 * حساب نتيجة جولة كاملة
 * 
 * @param {Object} roundData - بيانات الجولة
 * @param {string} roundData.gameType - نوع اللعب (صن/حكم)
 * @param {1|2} roundData.buyingTeam - الفريق المشتري
 * @param {number} roundData.team1RawPoints - بنط الفريق 1 (أكلات + أرض)
 * @param {number} roundData.team2RawPoints - بنط الفريق 2
 * @param {Object} roundData.team1Projects - مشاريع الفريق 1
 * @param {Object} roundData.team2Projects - مشاريع الفريق 2
 * @param {string} roundData.multiplier - المضاعف (عادي/دبل/×3/×4/قهوة)
 * @param {1|2|null} roundData.kabootTeam - فريق الكبوت (إن وجد)
 * @param {boolean} roundData.miyaDoubleOnly - المية أقصاها ×2
 * @param {boolean} roundData.hokmWithoutPointsMode - وضع حكم بدون أبناط
 * 
 * @returns {Object} { winningTeam, finalTeam1Points, finalTeam2Points }
 */
export const calculateRoundResult = (roundData) => {
  const {
    gameType,
    buyingTeam,
    team1RawPoints,
    team2RawPoints,
    team1Projects,
    team2Projects,
    multiplier,
    kabootTeam = null,
    miyaDoubleOnly = false,
    hokmWithoutPointsMode = false,
  } = roundData;

  const otherTeam = buyingTeam === 1 ? 2 : 1;

  // ======== حالة الكبوت ========
  if (kabootTeam) {
    const kabootPoints = KABOOT_POINTS[gameType];
    const kabootTeamProjects = kabootTeam === 1 ? team1Projects : team2Projects;
    const projectPoints = calculateProjectsWithoutBaloot(kabootTeamProjects, gameType);
    const balootPoints = calculateBalootPoints(kabootTeamProjects, gameType);
    
    const finalPoints = kabootPoints + projectPoints + balootPoints;
    
    return {
      winningTeam: kabootTeam,
      finalTeam1Points: kabootTeam === 1 ? finalPoints : 0,
      finalTeam2Points: kabootTeam === 2 ? finalPoints : 0,
    };
  }

  // ======== حالة القهوة ========
  if (multiplier === 'قهوة') {
    return {
      winningTeam: buyingTeam,
      finalTeam1Points: buyingTeam === 1 ? 152 : 0,
      finalTeam2Points: buyingTeam === 2 ? 152 : 0,
    };
  }

  // ======== حساب المشاريع ========
  const team1ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team1Projects, gameType);
  const team2ProjectsWithoutBaloot = calculateProjectsWithoutBaloot(team2Projects, gameType);
  const team1Baloot = calculateBalootPoints(team1Projects, gameType);
  const team2Baloot = calculateBalootPoints(team2Projects, gameType);

  // ======== البنط الخام ========
  let team1AdjustedRaw = team1RawPoints;
  let team2AdjustedRaw = team2RawPoints;
  const totalRaw = team1RawPoints + team2RawPoints;

  // ======== تقريب البنط في الصن (قبل المشاريع) ========
  if (gameType === 'صن') {
    // التحقق من وجود مشروع خمسين
    const has50Project = team1Projects.خمسين > 0 || team2Projects.خمسين > 0;
    const buyingTeamRawPoints = buyingTeam === 1 ? team1RawPoints : team2RawPoints;

    // ==================== قواعد الخمسين في الصن ====================
    if (has50Project) {
      // وضع "بالأبناط": يُحدد الفائز أولاً قبل التقريب
      // 91+ = فوز، 90 = تعادل، <90 = خسارة
      if (!hokmWithoutPointsMode) {
        if (buyingTeamRawPoints >= 91) {
          // المشتري فاز - نكمل الحساب الطبيعي أدناه
        } else if (buyingTeamRawPoints === 90) {
          // تعادل - كل فريق يأخذ نصف النقاط
          const team1ProjectsRaw = (team1Projects.سرا * 20) + (team1Projects.خمسين * 50) + (team1Projects.مية * 100) + (team1Projects.أربعمية * 200);
          const team2ProjectsRaw = (team2Projects.سرا * 20) + (team2Projects.خمسين * 50) + (team2Projects.مية * 100) + (team2Projects.أربعمية * 200);
          
          const team1TotalRaw = (team1RawPoints + team1ProjectsRaw) * 2;
          const team2TotalRaw = (team2RawPoints + team2ProjectsRaw) * 2;
          
          let finalTeam1Points = Math.round(team1TotalRaw / 10);
          let finalTeam2Points = Math.round(team2TotalRaw / 10);

          const multiplierFactor = getMultiplierFactor(multiplier);
          if (multiplierFactor > 1) {
            finalTeam1Points = finalTeam1Points * multiplierFactor;
            finalTeam2Points = finalTeam2Points * multiplierFactor;
          }

          return {
            winningTeam: buyingTeam,
            finalTeam1Points,
            finalTeam2Points,
          };
        } else {
          // المشتري خسر (<90) - الخصم يأخذ كل النقاط فوراً
          const team1ProjectsRaw = (team1Projects.سرا * 20) + (team1Projects.خمسين * 50) + (team1Projects.مية * 100) + (team1Projects.أربعمية * 200);
          const team2ProjectsRaw = (team2Projects.سرا * 20) + (team2Projects.خمسين * 50) + (team2Projects.مية * 100) + (team2Projects.أربعمية * 200);
          const totalProjectsRaw = team1ProjectsRaw + team2ProjectsRaw;
          const grandTotal = (TOTAL_RAW_POINTS.صن + totalProjectsRaw) * 2;
          
          let finalTeam1Points = Math.round((otherTeam === 1 ? grandTotal : 0) / 10);
          let finalTeam2Points = Math.round((otherTeam === 2 ? grandTotal : 0) / 10);

          const multiplierFactor = getMultiplierFactor(multiplier);
          if (multiplierFactor > 1) {
            finalTeam1Points = finalTeam1Points * multiplierFactor;
            finalTeam2Points = finalTeam2Points * multiplierFactor;
          }

          return {
            winningTeam: otherTeam,
            finalTeam1Points,
            finalTeam2Points,
          };
        }
      } else {
        // وضع "بدون أبناط": المشتري يحتاج 83+ للنجاح
        if (buyingTeamRawPoints < 83) {
          const team1ProjectsRaw = (team1Projects.سرا * 20) + (team1Projects.خمسين * 50) + (team1Projects.مية * 100) + (team1Projects.أربعمية * 200);
          const team2ProjectsRaw = (team2Projects.سرا * 20) + (team2Projects.خمسين * 50) + (team2Projects.مية * 100) + (team2Projects.أربعمية * 200);
          const totalProjectsRaw = team1ProjectsRaw + team2ProjectsRaw;
          const grandTotal = (TOTAL_RAW_POINTS.صن + totalProjectsRaw) * 2;
          
          let finalTeam1Points = Math.round((otherTeam === 1 ? grandTotal : 0) / 10);
          let finalTeam2Points = Math.round((otherTeam === 2 ? grandTotal : 0) / 10);

          const multiplierFactor = getMultiplierFactor(multiplier);
          if (multiplierFactor > 1) {
            finalTeam1Points = finalTeam1Points * multiplierFactor;
            finalTeam2Points = finalTeam2Points * multiplierFactor;
          }

          return {
            winningTeam: otherTeam,
            finalTeam1Points,
            finalTeam2Points,
          };
        }
        // المشتري نجح (83+) - نكمل الحساب الطبيعي
      }
    }

    // الحساب الطبيعي للصن
    const team1Ones = team1RawPoints % 10;
    
    if (team1Ones > 5) {
      const toAdd = 10 - team1Ones;
      team1AdjustedRaw = team1RawPoints + toAdd;
      team2AdjustedRaw = team2RawPoints - toAdd;
    } else if (team1Ones > 0 && team1Ones < 5) {
      team1AdjustedRaw = team1RawPoints - team1Ones;
      team2AdjustedRaw = team2RawPoints + team1Ones;
    }
  }

  // تحويل المشاريع لمكافئها الخام (×10)

  // ======== تحديد الفائز وتوزيع النقاط ========
  let winningTeam;
  let team1FinalRaw, team2FinalRaw;
  let team1FinalProjects, team2FinalProjects;
  let team1FinalBaloot, team2FinalBaloot;

  const hasMultiplier = multiplier !== 'عادي';

  if (buyingTeamSucceeded) {
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
      // في الصن: نستخدم القيم المقربة
      // في الحكم: نستخدم القيم المعدلة فقط إذا كان وضع بدون أبناط مفعل
      const useAdjusted = gameType === 'صن' || (hokmWithoutPointsMode && gameType === 'حكم');
      team1FinalRaw = useAdjusted ? team1AdjustedRaw : team1RawPoints;
      team2FinalRaw = useAdjusted ? team2AdjustedRaw : team2RawPoints;
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

  // ======== تحويل البنط للنقاط ========
  let team1RawScore = rawToScore(team1FinalRaw, gameType);
  let team2RawScore = rawToScore(team2FinalRaw, gameType);

  // ======== تطبيق المضاعفة ========
  const multiplierFactor = getMultiplierFactor(multiplier);

  // في الصن: البنط يُضرب في 2 (قبل أي مضاعفات أخرى)
  if (gameType === 'صن') {
    team1RawScore *= 2;
    team2RawScore *= 2;
  }

  // تطبيق المضاعف
  team1RawScore *= multiplierFactor;
  team2RawScore *= multiplierFactor;
  team1FinalProjects *= multiplierFactor;
  team2FinalProjects *= multiplierFactor;

  // ======== معالجة المية أقصاها ×2 ========
  // في حكم مع ×3 أو ×4، إذا الإعداد مُغلق، نخصم الفرق من الفائز
  if (miyaDoubleOnly && gameType === 'حكم' && (multiplier === '×3' || multiplier === '×4')) {
    const originalMiyaPoints = (team1Projects.مية + team2Projects.مية) * 10;
    const miyaAtDouble = originalMiyaPoints * 2;
    const miyaAtFull = originalMiyaPoints * multiplierFactor;
    const difference = miyaAtFull - miyaAtDouble;
    
    if (winningTeam === 1) {
      team1FinalProjects -= difference;
    } else {
      team2FinalProjects -= difference;
    }
  }

  // ======== النقاط النهائية ========
  // البلوت لا يتضاعف مع المضاعف، فقط يتضاعف في الصن (قيمته أصلاً 0 في الصن)
  const finalTeam1Points = team1RawScore + team1FinalProjects + team1FinalBaloot;
  const finalTeam2Points = team2RawScore + team2FinalProjects + team2FinalBaloot;

  return {
    winningTeam,
    finalTeam1Points,
    finalTeam2Points,
  };
};

/**
 * معاينة نتيجة الجولة قبل الحفظ
 * نفس calculateRoundResult لكن للاستخدام في الـ UI
 */
export const previewRoundResult = calculateRoundResult;
