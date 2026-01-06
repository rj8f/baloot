/**
 * ملف النطق الصوتي
 * Baloot Speech (for Expo)
 * للاستخدام مع expo-speech في React Native
 * 
 * تثبيت: npx expo install expo-speech
 */

/**
 * نطق النتيجة (لـ React Native مع expo-speech)
 * 
 * الاستخدام:
 * import * as Speech from 'expo-speech';
 * 
 * announceScore(Speech, 'لنا', 'لهم', 50, 30, false);
 * 
 * @param {Object} Speech - مكتبة expo-speech
 * @param {string} team1Name - اسم الفريق 1
 * @param {string} team2Name - اسم الفريق 2
 * @param {number} team1Score - نقاط الفريق 1
 * @param {number} team2Score - نقاط الفريق 2
 * @param {boolean} isMuted - هل الصوت مكتوم
 */
export const announceScore = async (Speech, team1Name, team2Name, team1Score, team2Score, isMuted = false) => {
  if (isMuted) return;

  try {
    // إيقاف أي نطق سابق
    await Speech.stop();
    
    const announcement = `${team1Name} ${team1Score}، ${team2Name} ${team2Score}`;
    
    await Speech.speak(announcement, {
      language: 'ar-SA',
      rate: 1.2,
      pitch: 1.0,
    });
  } catch (error) {
    console.log('Speech error:', error);
  }
};

/**
 * نطق الفائز
 * @param {Object} Speech - مكتبة expo-speech
 * @param {string} winnerName - اسم الفائز
 * @param {boolean} isMuted - هل الصوت مكتوم
 */
export const announceWinner = async (Speech, winnerName, isMuted = false) => {
  if (isMuted) return;

  try {
    await Speech.stop();
    
    const announcement = `مبروك! فاز فريق ${winnerName}`;
    
    await Speech.speak(announcement, {
      language: 'ar-SA',
      rate: 1.0,
      pitch: 1.1,
    });
  } catch (error) {
    console.log('Speech error:', error);
  }
};

/**
 * نطق الكبوت
 * @param {Object} Speech - مكتبة expo-speech
 * @param {string} teamName - اسم الفريق
 * @param {boolean} isMuted - هل الصوت مكتوم
 */
export const announceKaboot = async (Speech, teamName, isMuted = false) => {
  if (isMuted) return;

  try {
    await Speech.stop();
    
    const announcement = `كبوت لفريق ${teamName}`;
    
    await Speech.speak(announcement, {
      language: 'ar-SA',
      rate: 1.0,
      pitch: 1.2,
    });
  } catch (error) {
    console.log('Speech error:', error);
  }
};
