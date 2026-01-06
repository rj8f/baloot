export type GameType = 'حكم' | 'صن';
export type Multiplier = 'عادي' | 'دبل' | '×3' | '×4' | 'قهوة';

// أنواع المشاريع
export type ProjectType = 'سرا' | 'خمسين' | 'مية' | 'أربعمية' | 'بلوت';

export interface TeamProjects {
  سرا: number;      // عدد مشاريع السرا (3 أوراق متتالية)
  خمسين: number;   // عدد مشاريع الخمسين (4 أوراق متتالية)
  مية: number;     // عدد مشاريع المية (5 أوراق متتالية أو 4 من نوع)
  أربعمية: number; // عدد مشاريع الأربعمية (4 إكك في الصن)
  بلوت: number;    // عدد مشاريع البلوت (شايب وبنت الحكم)
}

// قيم المشاريع كنقاط نهائية حسب نوع اللعب
export const PROJECT_VALUES = {
  صن: {
    سرا: 4,      // 20 بنط × 2 ÷ 10 = 4 نقاط
    خمسين: 10,   // 50 بنط × 2 ÷ 10 = 10 نقاط
    مية: 20,     // 100 بنط × 2 ÷ 10 = 20 نقاط
    أربعمية: 40, // 200 بنط × 2 ÷ 10 = 40 نقاط
    بلوت: 0,     // لا يوجد بلوت في الصن
  },
  حكم: {
    سرا: 2,
    خمسين: 5,
    مية: 10,
    أربعمية: 0, // في الحكم تصبح مية
    بلوت: 2,
  },
} as const;

// قيم المشاريع كأبناط في الصن (للحسابات الداخلية)
export const SUN_PROJECT_RAW_VALUES = {
  سرا: 20,
  خمسين: 50,
  مية: 100,
  أربعمية: 200,
  بلوت: 0,
} as const;

// حساب أبناط المشاريع في الصن
export const calculateSunProjectsRaw = (projects: TeamProjects): number => {
  return (
    projects.سرا * SUN_PROJECT_RAW_VALUES.سرا +
    projects.خمسين * SUN_PROJECT_RAW_VALUES.خمسين +
    projects.مية * SUN_PROJECT_RAW_VALUES.مية +
    projects.أربعمية * SUN_PROJECT_RAW_VALUES.أربعمية
  );
};

export interface Round {
  id: string;
  roundNumber: number;
  gameType: GameType;
  buyingTeam: 1 | 2;
  team1RawPoints: number;    // بنط الأكلات للفريق 1
  team2RawPoints: number;    // بنط الأكلات للفريق 2
  team1Projects: TeamProjects;
  team2Projects: TeamProjects;
  multiplier: Multiplier;
  winningTeam: 1 | 2;
  finalTeam1Points: number;
  finalTeam2Points: number;
  createdAt: number;  // timestamp للترتيب الزمني
  // للتوافق مع الكود القديم
  team1Points: number;
  team2Points: number;
}

export interface Game {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  winningScore: number;
  rounds: Round[];
  winner: 1 | 2 | null;
  createdAt: Date;
}

// دالة مساعدة لإنشاء مشاريع فارغة
export const createEmptyProjects = (): TeamProjects => ({
  سرا: 0,
  خمسين: 0,
  مية: 0,
  أربعمية: 0,
  بلوت: 0,
});

// حساب مجموع نقاط المشاريع
export const calculateProjectsPoints = (
  projects: TeamProjects,
  gameType: GameType
): number => {
  const values = PROJECT_VALUES[gameType];
  return (
    projects.سرا * values.سرا +
    projects.خمسين * values.خمسين +
    projects.مية * values.مية +
    projects.أربعمية * values.أربعمية +
    projects.بلوت * values.بلوت
  );
};

// حساب نقاط البلوت فقط (لأنها لا تتضاعف)
export const calculateBalootPoints = (
  projects: TeamProjects,
  gameType: GameType
): number => {
  if (gameType === 'صن') return 0;
  return projects.بلوت * PROJECT_VALUES.حكم.بلوت;
};

// حساب نقاط المشاريع بدون البلوت (للمضاعفة)
export const calculateProjectsWithoutBaloot = (
  projects: TeamProjects,
  gameType: GameType
): number => {
  const values = PROJECT_VALUES[gameType];
  return (
    projects.سرا * values.سرا +
    projects.خمسين * values.خمسين +
    projects.مية * values.مية +
    projects.أربعمية * values.أربعمية
  );
};
