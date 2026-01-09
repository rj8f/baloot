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
  // في الصن: نقرب البنط لأقرب 10 قبل إضافة المشاريع
  // الآحاد = 5: لا تقريب، نضرب على طول
  // الآحاد > 5 (6,7,8,9): نقرب للأعلى (نأخذ من الخصم)
  // الآحاد < 5 (1,2,3,4): نقرب للأسفل (نعطي الخصم)
  if (gameType === 'صن') {
    const team1Ones = team1RawPoints % 10;
    
    if (team1Ones > 5) {
      // الفريق 1 يقرب للأعلى - يأخذ من الفريق 2
      const toAdd = 10 - team1Ones;
      team1AdjustedRaw = team1RawPoints + toAdd;
      team2AdjustedRaw = team2RawPoints - toAdd;
    } else if (team1Ones > 0 && team1Ones < 5) {
      // الفريق 1 يقرب للأسفل - يعطي الفريق 2
      team1AdjustedRaw = team1RawPoints - team1Ones;
      team2AdjustedRaw = team2RawPoints + team1Ones;
    }
    // إذا team1Ones === 0 أو === 5، لا حاجة للتقريب
  }

  // تحويل المشاريع لمكافئها الخام (×10)
  const team1ProjectsRawEq = team1ProjectsWithoutBaloot * 10;
  const team2ProjectsRawEq = team2ProjectsWithoutBaloot * 10;
  const team1BalootRawEq = team1Baloot * 10;
  const team2BalootRawEq = team2Baloot * 10;

  // ======== حساب نجاح المشتري ========
  let buyingTeamRaw = buyingTeam === 1 ? team1AdjustedRaw : team2AdjustedRaw;
  let otherTeamRaw = buyingTeam === 1 ? team2AdjustedRaw : team1AdjustedRaw;

  const buyingTeamProjectsRawEq = buyingTeam === 1 ? team1ProjectsRawEq : team2ProjectsRawEq;
  const buyingTeamBalootRawEq = buyingTeam === 1 ? team1BalootRawEq : team2BalootRawEq;

  // ======== وضع حكم بدون أبناط ========
  // إذا آحاد مجموع المشتري (مع المشاريع والبلوت) 0/6/7/8/9، ننقل 5 أبناط من الخصم للمشتري
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

  // ======== التحقق من نجاح المشتري ========
  const buyingTeamTotalRawForSuccess = buyingTeamRaw + buyingTeamProjectsRawEq + buyingTeamBalootRawEq;
  const otherTeamProjectsRawEq = buyingTeam === 1 ? team2ProjectsRawEq : team1ProjectsRawEq;
  const otherTeamBalootRawEq = buyingTeam === 1 ? team2BalootRawEq : team1BalootRawEq;
  const otherTeamTotalRawForSuccess = otherTeamRaw + otherTeamProjectsRawEq + otherTeamBalootRawEq;
  const grandTotalRawForSuccess = buyingTeamTotalRawForSuccess + otherTeamTotalRawForSuccess;
  const halfTotalRawForSuccess = grandTotalRawForSuccess / 2;

  const buyingTeamSucceeded = buyingTeamTotalRawForSuccess >= halfTotalRawForSuccess;

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
