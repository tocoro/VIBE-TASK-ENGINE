import { GameState, GameTask, Achievement } from '../types';

/**
 * IncentiveEngine
 * 
 * The core logic library for the VibeTask methodology.
 * Features:
 * - XP & Leveling system
 * - Momentum tracking
 * - Combo system (Time-based multipliers)
 * - Achievement system (Unlocking badges)
 */
export class IncentiveEngine {
  private static readonly XP_MULTIPLIER = 1.5;
  private static readonly MOMENTUM_HISTORY_LIMIT = 20;
  private static readonly COMBO_WINDOW_MS = 30000; // 30 seconds to chain combo

  /**
   * Calculates the next XP threshold required for leveling up.
   */
  static getNextLevelThreshold(currentThreshold: number): number {
    return Math.floor(currentThreshold * this.XP_MULTIPLIER);
  }

  /**
   * Updates the momentum history array based on new XP gain.
   */
  static calculateMomentum(history: number[], xpGain: number): number[] {
    const lastValue = history.length > 0 ? history[history.length - 1] : 0;
    const newValue = lastValue + (xpGain * 0.5);
    const newMomentum = [...history, newValue];
    if (newMomentum.length > this.MOMENTUM_HISTORY_LIMIT) {
      newMomentum.shift();
    }
    return newMomentum;
  }

  /**
   * Checks for achievement unlocks based on the new state and the task just completed.
   */
  static checkAchievements(
    state: GameState, 
    task: GameTask, 
    isFirstTask: boolean,
    timestamp: number
  ): Achievement[] {
    const newUnlocks: Achievement[] = [];
    const currentIds = new Set(state.achievements.map(a => a.id));

    // 1. FIRST BLOOD
    if (isFirstTask && !currentIds.has('FIRST_BLOOD')) {
      newUnlocks.push({ id: 'FIRST_BLOOD', icon: '⚔️', unlockedAt: timestamp });
    }

    // 2. COMBO MASTER (3+ Combo)
    if (state.combo.count >= 3 && !currentIds.has('COMBO_MASTER')) {
      newUnlocks.push({ id: 'COMBO_MASTER', icon: '🔥', unlockedAt: timestamp });
    }

    // 3. LEGENDARY (S Rank)
    if (task.difficulty === 'S' && !currentIds.has('LEGENDARY')) {
      newUnlocks.push({ id: 'LEGENDARY', icon: '👑', unlockedAt: timestamp });
    }

    // 4. VETERAN (Level 3)
    if (state.level >= 3 && !currentIds.has('VETERAN')) {
      newUnlocks.push({ id: 'VETERAN', icon: '🎖️', unlockedAt: timestamp });
    }

    return newUnlocks;
  }

  /**
   * Processes a task completion event.
   * @param timestampOverride Optional timestamp for testing
   */
  static processTaskCompletion(
    taskId: string, 
    currentTasks: GameTask[], 
    currentState: GameState,
    timestampOverride?: number
  ): { 
    newState: GameState; 
    newTasks: GameTask[]; 
    leveledUp: boolean;
    xpGained: number;
    achievementsUnlocked: Achievement[];
    comboTriggered: boolean;
  } | null {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task || task.completed) return null;

    // 1. Update Task List
    const newTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, completed: true } : t
    );
    const isFirstTask = currentState.completedTasks === 0;

    // 2. Combo Calculation
    const now = timestampOverride ?? Date.now();
    const timeDiff = now - currentState.combo.lastCompletionTime;
    let comboCount = 1;
    let comboMultiplier = 1.0;

    if (timeDiff < this.COMBO_WINDOW_MS && currentState.combo.lastCompletionTime > 0) {
      comboCount = currentState.combo.count + 1;
      comboMultiplier = 1.0 + (comboCount * 0.1); // +10% per combo stack
    }

    // 3. XP Calculation
    const baseXp = task.xp;
    const finalXp = Math.floor(baseXp * comboMultiplier);

    // 4. Level Calculation
    let newXp = currentState.currentXp + finalXp;
    let newLevel = currentState.level;
    let newTotalNeeded = currentState.totalXpNeeded;
    let leveledUp = false;

    if (newXp >= currentState.totalXpNeeded) {
      newXp = newXp - currentState.totalXpNeeded;
      newLevel += 1;
      newTotalNeeded = this.getNextLevelThreshold(currentState.totalXpNeeded);
      leveledUp = true;
    }

    // 5. Momentum
    const newMomentum = this.calculateMomentum(currentState.momentum, finalXp);

    // 6. Intermediate State for Achievement Check
    const intermediateState: GameState = {
      ...currentState,
      level: newLevel,
      currentXp: newXp,
      totalXpNeeded: newTotalNeeded,
      completedTasks: currentState.completedTasks + 1,
      momentum: newMomentum,
      combo: {
        count: comboCount,
        multiplier: comboMultiplier,
        lastCompletionTime: now
      }
    };

    // 7. Achievements
    const newAchievements = this.checkAchievements(intermediateState, task, isFirstTask, now);
    const finalAchievements = [...currentState.achievements, ...newAchievements];
    
    // Final State
    const finalState: GameState = {
      ...intermediateState,
      achievements: finalAchievements
    };

    return { 
      newState: finalState, 
      newTasks, 
      leveledUp,
      xpGained: finalXp,
      achievementsUnlocked: newAchievements,
      comboTriggered: comboCount > 1
    };
  }

  /**
   * Creates the initial game state.
   */
  static createInitialState(): GameState {
    return {
      level: 1,
      currentXp: 0,
      totalXpNeeded: 1000,
      completedTasks: 0,
      momentum: [0, 100, 150, 120, 200],
      combo: {
        count: 0,
        multiplier: 1.0,
        lastCompletionTime: 0
      },
      achievements: []
    };
  }
}