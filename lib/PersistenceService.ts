import { SavedSession, GameTask, GameState, HistoryLogEntry } from '../types';

/**
 * PersistenceRepository Interface
 * 
 * Defines the contract for any storage adapter (LocalStorage, Firebase, SQL, etc).
 * This allows the app to be loosely coupled from the storage mechanism.
 */
interface PersistenceRepository {
  saveSession(session: SavedSession): Promise<void>;
  loadSession(): Promise<SavedSession | null>;
  clearSession(): Promise<void>;
}

/**
 * LocalStorageAdapter
 * 
 * Default implementation using Browser LocalStorage.
 * Can be replaced with CloudStorageAdapter later.
 */
class LocalStorageAdapter implements PersistenceRepository {
  private readonly STORAGE_KEY = 'vibe_task_engine_session_v1';

  async saveSession(session: SavedSession): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error("Save Failed:", e);
    }
  }

  async loadSession(): Promise<SavedSession | null> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Load Failed:", e);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * PersistenceService
 * 
 * The main entry point for the application to interact with stored data.
 * It manages the repository and handles logic like log appending.
 */
export class PersistenceService {
  private static repo: PersistenceRepository = new LocalStorageAdapter();

  private static createSession(
    themeId: string, 
    tasks: GameTask[], 
    gameState: GameState,
    logs: HistoryLogEntry[]
  ): SavedSession {
    return {
      lastUpdated: Date.now(),
      themeId,
      tasks,
      gameState,
      logs
    };
  }

  /**
   * Saves the current complete state of the application.
   */
  static async saveState(
    themeId: string, 
    tasks: GameTask[], 
    gameState: GameState,
    logs: HistoryLogEntry[]
  ): Promise<void> {
    const session = this.createSession(themeId, tasks, gameState, logs);
    await this.repo.saveSession(session);
  }

  /**
   * Loads the active session if one exists.
   */
  static async loadState(): Promise<SavedSession | null> {
    return await this.repo.loadSession();
  }

  /**
   * Wipes the current session (e.g., upon full completion or user reset).
   */
  static async resetState(): Promise<void> {
    await this.repo.clearSession();
  }

  /**
   * EXPORT: Triggers a browser download of the current state as JSON.
   */
  static exportStateJSON(
    themeId: string, 
    tasks: GameTask[], 
    gameState: GameState,
    logs: HistoryLogEntry[]
  ): void {
    const session = this.createSession(themeId, tasks, gameState, logs);
    const jsonString = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibe_mission_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * IMPORT: Parses a user-uploaded file into a SavedSession.
   */
  static async importStateJSON(file: File): Promise<SavedSession> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // Simple validation check
          if (!json.themeId || !json.tasks || !json.gameState) {
             throw new Error("Invalid save file format");
          }
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Helper to create a standardized log entry.
   */
  static createLogEntry(
    type: HistoryLogEntry['type'], 
    message: string, 
    details?: any
  ): HistoryLogEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      message,
      details
    };
  }
}