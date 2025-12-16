import { useState, useCallback, useEffect } from 'react';
import { GameTask, GameState, Achievement, HistoryLogEntry, VibeTheme } from '../types';
import { IncentiveEngine } from '../lib/IncentiveEngine';
import { PersistenceService } from '../lib/PersistenceService';

type GameEvent = 
  | { type: 'COMPLETE'; taskId: string; xp: number; combo?: number }
  | { type: 'LEVEL_UP'; level: number }
  | { type: 'ACHIEVEMENT'; achievement: Achievement };

/**
 * useVibeGame Hook
 * 
 * Now integrated with PersistenceService to automatically save progress.
 */
export const useVibeGame = (
  initialTasks: GameTask[], 
  theme: VibeTheme,
  initialGameState?: GameState,
  initialLogs: HistoryLogEntry[] = []
) => {
  const [tasks, setTasks] = useState<GameTask[]>(initialTasks);
  const [gameState, setGameState] = useState<GameState>(initialGameState || IncentiveEngine.createInitialState());
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [logs, setLogs] = useState<HistoryLogEntry[]>(initialLogs);

  // Auto-save effect: Whenever critical state changes, persist it.
  useEffect(() => {
    // Debounce slightly to avoid thrashing storage on rapid changes if we had them
    const timer = setTimeout(() => {
      PersistenceService.saveState(theme.id, tasks, gameState, logs);
    }, 500);
    return () => clearTimeout(timer);
  }, [tasks, gameState, logs, theme.id]);

  const completeTask = useCallback((taskId: string) => {
    const result = IncentiveEngine.processTaskCompletion(taskId, tasks, gameState);
    
    if (result) {
      setTasks(result.newTasks);
      setGameState(result.newState);
      
      const newEvents: GameEvent[] = [];
      const newLogs: HistoryLogEntry[] = [];
      const timestamp = Date.now();
      
      // 1. Task Complete Logic
      newEvents.push({ 
        type: 'COMPLETE', 
        taskId, 
        xp: result.xpGained,
        combo: result.comboTriggered ? result.newState.combo.count : undefined
      });

      const completedTask = tasks.find(t => t.id === taskId);
      newLogs.push(PersistenceService.createLogEntry(
        'TASK_COMPLETE',
        `Completed: ${completedTask?.questTitle || 'Unknown Mission'}`,
        { xp: result.xpGained, combo: result.comboTriggered }
      ));

      // 2. Level Up Logic
      if (result.leveledUp) {
        newEvents.push({ type: 'LEVEL_UP', level: result.newState.level });
        newLogs.push(PersistenceService.createLogEntry(
          'LEVEL_UP',
          `Promoted to Level ${result.newState.level}`,
          { level: result.newState.level }
        ));
      }

      // 3. Achievement Logic
      result.achievementsUnlocked.forEach(ach => {
        newEvents.push({ type: 'ACHIEVEMENT', achievement: ach });
        newLogs.push(PersistenceService.createLogEntry(
          'ACHIEVEMENT_UNLOCK',
          `Unlocked: ${ach.id}`,
          { id: ach.id, icon: ach.icon }
        ));
      });

      // Update State
      setEvents(prev => [...prev, ...newEvents]);
      setLogs(prev => [...newLogs, ...prev]); // Newest first

      // Cleanup events
      setTimeout(() => {
        setEvents(prev => prev.slice(newEvents.length));
      }, 3000);
      
      return true;
    }
    return false;
  }, [tasks, gameState]);

  // Ability to add new tasks mid-game
  const addNewTasks = useCallback((newTasks: GameTask[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    setLogs(prev => [
      PersistenceService.createLogEntry('SESSION_START', `Received ${newTasks.length} new orders.`),
      ...prev
    ]);
  }, []);

  return {
    tasks,
    gameState,
    logs,
    completeTask,
    addNewTasks,
    events
  };
};