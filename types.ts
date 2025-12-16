export enum AppPhase {
  INPUT = 'INPUT',
  GENERATING = 'GENERATING',
  EXECUTION = 'EXECUTION',
  TEST_BENCH = 'TEST_BENCH',
}

export interface RawTask {
  id: string;
  text: string;
}

export interface GameTask {
  id: string;
  originalText: string;
  questTitle: string;
  flavorText: string;
  difficulty: 'S' | 'A' | 'B' | 'C';
  xp: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  icon: string;
  unlockedAt?: number; // timestamp
}

export interface GameState {
  level: number;
  currentXp: number;
  totalXpNeeded: number;
  completedTasks: number;
  momentum: number[]; // History of XP gain for chart
  combo: {
    count: number;
    multiplier: number;
    lastCompletionTime: number;
  };
  achievements: Achievement[];
}

export interface VibeTheme {
  id: string;
  name: { ja: string; en: string };
  description: { ja: string; en: string };
  promptContext: { ja: string; en: string };
  color: string;
}

// --- Persistence Types ---

export interface HistoryLogEntry {
  id: string;
  timestamp: number;
  type: 'TASK_COMPLETE' | 'LEVEL_UP' | 'ACHIEVEMENT_UNLOCK' | 'SESSION_START';
  message: string;
  details?: any;
}

export interface SavedSession {
  lastUpdated: number;
  themeId: string;
  tasks: GameTask[];
  gameState: GameState;
  logs: HistoryLogEntry[];
}

export const THEMES: VibeTheme[] = [
  {
    id: 'cyberpunk',
    name: { 
      ja: 'サイバーパンク・ランナー', 
      en: 'Cyberpunk Runner' 
    },
    description: { 
      ja: 'ハイテク・ローライフ。システムをハックし、運び屋任務を遂行せよ。', 
      en: 'High-tech, low-life. Hacking systems and running courier missions.' 
    },
    promptContext: {
      ja: 'タスク名は変更せずそのまま維持してください。その代わり、説明文（flavorText）で「サイバーパンク2077」風の演出を行ってください。「チューム」「エディ」「ギグ」のようなスラングを使用し、日常作業を緊迫した裏社会の任務のように描写します。',
      en: 'Keep the task name exactly as provided. Instead, use the flavor text to create a Cyberpunk 2077 atmosphere. Use slang like "choom", "eddies", "gig" to describe the daily chore as a high-stakes runner mission.'
    },
    color: 'text-neon-cyan border-neon-cyan shadow-[0_0_10px_#00ffff]'
  },
  {
    id: 'fantasy',
    name: { 
      ja: 'ダンジョン・クローラー', 
      en: 'Dungeon Crawler' 
    },
    description: { 
      ja: '魔獣を討伐し、ギルドを運営せよ。', 
      en: 'Slaying beasts and managing the guild.' 
    },
    promptContext: {
      ja: 'タスク名は変更せずそのまま維持してください。その代わり、説明文（flavorText）でハイファンタジーRPG風の演出を行ってください。日常作業を、古風な言葉遣い、魔法、ドラゴン、ダンジョン探索の比喩を用いて壮大に描写します。',
      en: 'Keep the task name exactly as provided. Instead, use the flavor text to create a High Fantasy RPG atmosphere. Describe the daily chore using archaic language, magic, dragons, and dungeon delving metaphors.'
    },
    color: 'text-yellow-400 border-yellow-400 shadow-[0_0_10px_#facc15]'
  },
  {
    id: 'corporate',
    name: { 
      ja: '企業戦士サティラ', 
      en: 'Corporate Satire' 
    },
    description: { 
      ja: '魂なきディストピアで梯子を登れ。', 
      en: 'Climbing the ladder in a soulless dystopia.' 
    },
    promptContext: {
      ja: 'タスク名は変更せずそのまま維持してください。その代わり、説明文（flavorText）で過剰に企業的な官僚主義的悪夢を演出してください。「シナジー」「パラダイムシフト」「アジェンダ」などのビジネス用語を多用し、単純作業を重大プロジェクトのように描写します。',
      en: 'Keep the task name exactly as provided. Instead, use the flavor text to create a hyper-corporate bureaucratic nightmare atmosphere. Use buzzwords like "synergy", "paradigm shift", "circle back" to describe the task.'
    },
    color: 'text-blue-400 border-blue-400 shadow-[0_0_10px_#60a5fa]'
  },
  {
    id: 'eldritch',
    name: { 
      ja: 'エルドリッチ・ホラー', 
      en: 'Eldritch Horror' 
    },
    description: { 
      ja: '狂気を食い止めろ。', 
      en: 'Holding back the madness.' 
    },
    promptContext: {
      ja: 'タスク名は変更せずそのまま維持してください。その代わり、説明文（flavorText）でラヴクラフト的恐怖を演出してください。日常作業を、古のものの目覚めを防ぐための重要な儀式や探索として描写します。',
      en: 'Keep the task name exactly as provided. Instead, use the flavor text to create a Lovecraftian horror atmosphere. Describe the daily chore as a ritual or investigation to prevent the awakening of ancient ones.'
    },
    color: 'text-purple-500 border-purple-500 shadow-[0_0_10px_#a855f7]'
  }
];