# ملفات منطق البلوت للـ React Native

## 🎮 الملفات

| الملف | الوصف |
|-------|-------|
| `baloot-types.js` | الثوابت والأنواع (أنواع اللعب، المضاعفات، قيم المشاريع) |
| `baloot-calculations.js` | الحسابات الأساسية (تحويل البنط، حساب المشاريع) |
| `baloot-round-calculator.js` | حساب نتيجة الجولة الكاملة (الدالة الرئيسية) |
| `baloot-game-manager.js` | إدارة اللعبة (إضافة/حذف جولات، التراجع) |
| `baloot-speech.js` | النطق الصوتي (يحتاج expo-speech) |

## 📱 التثبيت في Expo

```bash
# إنشاء مشروع جديد
npx create-expo-app baloot-native
cd baloot-native

# تثبيت expo-speech للنطق الصوتي
npx expo install expo-speech

# نسخ ملفات المنطق
# ضع جميع ملفات .js في مجلد src/logic/
```

## 🚀 مثال الاستخدام

```javascript
// App.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

import { GAME_TYPES, MULTIPLIERS, createEmptyProjects } from './src/logic/baloot-types';
import { calculateOtherTeamRaw } from './src/logic/baloot-calculations';
import { calculateRoundResult } from './src/logic/baloot-round-calculator';
import { createNewGame, addRoundToGame, getWinnerName } from './src/logic/baloot-game-manager';
import { announceScore, announceWinner } from './src/logic/baloot-speech';

export default function App() {
  const [game, setGame] = useState(() => createNewGame('لنا', 'لهم'));
  const [gameType, setGameType] = useState(GAME_TYPES.HOKM);
  const [buyingTeam, setBuyingTeam] = useState(1);
  const [points, setPoints] = useState('');

  const handleAddRound = () => {
    const enteredPoints = parseInt(points) || 0;
    const otherPoints = calculateOtherTeamRaw(enteredPoints, gameType);

    const roundData = {
      gameType,
      buyingTeam,
      team1RawPoints: enteredPoints,
      team2RawPoints: otherPoints,
      team1Projects: createEmptyProjects(),
      team2Projects: createEmptyProjects(),
      multiplier: MULTIPLIERS.NORMAL,
    };

    const updatedGame = addRoundToGame(game, roundData);
    setGame(updatedGame);
    setPoints('');

    // نطق النتيجة
    announceScore(
      Speech,
      updatedGame.team1Name,
      updatedGame.team2Name,
      updatedGame.team1Score,
      updatedGame.team2Score
    );

    // التحقق من الفوز
    const winner = getWinnerName(updatedGame);
    if (winner) {
      setTimeout(() => announceWinner(Speech, winner), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حاسبة البلوت</Text>
      
      {/* النتيجة */}
      <View style={styles.scoreBoard}>
        <Text style={styles.score}>{game.team1Name}: {game.team1Score}</Text>
        <Text style={styles.score}>{game.team2Name}: {game.team2Score}</Text>
      </View>

      {/* نوع اللعب */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, gameType === GAME_TYPES.HOKM && styles.active]}
          onPress={() => setGameType(GAME_TYPES.HOKM)}
        >
          <Text style={styles.buttonText}>حكم</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, gameType === GAME_TYPES.SUN && styles.active]}
          onPress={() => setGameType(GAME_TYPES.SUN)}
        >
          <Text style={styles.buttonText}>صن</Text>
        </TouchableOpacity>
      </View>

      {/* المشتري */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, buyingTeam === 1 && styles.active]}
          onPress={() => setBuyingTeam(1)}
        >
          <Text style={styles.buttonText}>{game.team1Name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, buyingTeam === 2 && styles.active]}
          onPress={() => setBuyingTeam(2)}
        >
          <Text style={styles.buttonText}>{game.team2Name}</Text>
        </TouchableOpacity>
      </View>

      {/* إدخال النقاط */}
      <TextInput
        style={styles.input}
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
        placeholder="عدد الأبناط"
        placeholderTextColor="#999"
      />

      {/* زر الحساب */}
      <TouchableOpacity style={styles.submitButton} onPress={handleAddRound}>
        <Text style={styles.submitText}>احسب</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  score: {
    fontSize: 24,
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  active: {
    backgroundColor: '#4f46e5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    width: '80%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
```

## 📋 خطوات البناء والنشر

### 1. إعداد EAS Build
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 2. البناء لـ iOS
```bash
eas build --platform ios
```

### 3. الرفع لـ TestFlight
```bash
eas submit --platform ios
```

## ⚙️ app.json المطلوب

```json
{
  "expo": {
    "name": "حاسبة البلوت",
    "slug": "baloot-calculator",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "ios": {
      "bundleIdentifier": "com.yourname.baloot",
      "supportsTablet": true
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## 📌 ملاحظات مهمة

1. **التوافق**: جميع الملفات JavaScript خالصة، لا تحتاج React أو أي framework
2. **العمل بدون إنترنت**: لا تعتمد على أي API خارجي
3. **الإعدادات**: يمكنك حفظها باستخدام `@react-native-async-storage/async-storage`
4. **RTL**: أضف `"supportsRTL": true` في app.json لدعم الاتجاه من اليمين لليسار
