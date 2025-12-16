import React, { useState, useEffect } from 'react';
import { AppPhase, RawTask, GameTask, VibeTheme, GameState, THEMES, SavedSession, HistoryLogEntry } from './types';
import PhaseInput from './components/PhaseInput';
import PhaseExecution from './components/PhaseExecution';
import LoadingScreen from './components/LoadingScreen';
import MethodologyPanel from './components/MethodologyPanel';
import LibraryTestBench from './components/LibraryTestBench';
import { generateGameTasks } from './services/geminiService';
import { PersistenceService } from './lib/PersistenceService';
import { Language, translations } from './i18n';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.INPUT);
  const [tasks, setTasks] = useState<GameTask[]>([]);
  const [currentTheme, setCurrentTheme] = useState<VibeTheme | null>(null);
  const [lang, setLang] = useState<Language>('ja');
  
  // State for resuming and stats
  const [resumableSession, setResumableSession] = useState<SavedSession | null>(null);
  const [initialGameState, setInitialGameState] = useState<GameState | undefined>(undefined);
  const [initialLogs, setInitialLogs] = useState<HistoryLogEntry[]>([]);
  
  // Lifted state to show in Panel during execution
  const [viewGameState, setViewGameState] = useState<GameState | undefined>(undefined);

  // Check for saved session on mount
  useEffect(() => {
    const checkSave = async () => {
      const saved = await PersistenceService.loadState();
      if (saved) {
        setResumableSession(saved);
        // Ensure panel shows saved state immediately
        setViewGameState(saved.gameState); 
      }
    };
    checkSave();
  }, []);

  const handleStartGeneration = async (rawTasks: RawTask[], theme: VibeTheme) => {
    // CRITICAL: If we have a previous session (even if not resumed via button), 
    // inherit its GameState (stats/levels) unless it was a Hard Reset.
    const baseState = resumableSession?.gameState || undefined;
    const baseLogs = resumableSession?.logs || [];

    setPhase(AppPhase.GENERATING);
    setCurrentTheme(theme);
    setInitialGameState(baseState); 
    setInitialLogs(baseLogs);
    
    // Min delay for UX effect
    const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      const [generatedTasks] = await Promise.all([
        generateGameTasks(rawTasks, theme, lang),
        minDelay
      ]);
      
      setTasks(generatedTasks);
      setPhase(AppPhase.EXECUTION);
      
      // Save initial state with new tasks but OLD stats
      if (baseState) {
        PersistenceService.saveState(theme.id, generatedTasks, baseState, baseLogs);
      }
    } catch (error) {
      console.error("Failed to generate", error);
      setPhase(AppPhase.INPUT);
      alert("System Overload. Please try again or check API Key.");
    }
  };

  // Helper function to generate more tasks without resetting state
  const handleGenerateMore = async (text: string): Promise<GameTask[]> => {
    if (!currentTheme) return [];
    
    const newRawTasks: RawTask[] = text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, index) => ({
        id: `task-add-${Date.now()}-${index}`,
        text: line.trim()
      }));

    if (newRawTasks.length === 0) return [];

    return await generateGameTasks(newRawTasks, currentTheme, lang);
  };

  const handleResume = () => {
    if (resumableSession) {
      const theme = THEMES.find(t => t.id === resumableSession.themeId) || THEMES[0];
      setCurrentTheme(theme);
      setTasks(resumableSession.tasks);
      setInitialGameState(resumableSession.gameState);
      setInitialLogs(resumableSession.logs);
      setViewGameState(resumableSession.gameState);
      setPhase(AppPhase.EXECUTION);
      setResumableSession(null); // Clear overlay
    }
  };

  const handleImportSession = (session: SavedSession) => {
    const theme = THEMES.find(t => t.id === session.themeId) || THEMES[0];
    setCurrentTheme(theme);
    setTasks(session.tasks);
    setInitialGameState(session.gameState);
    setInitialLogs(session.logs);
    setViewGameState(session.gameState);
    
    // Update resumable session reference so next "Start Generation" uses this imported state
    setResumableSession(session); 
    
    setPhase(AppPhase.EXECUTION);
  };

  // Soft Reset: Go back to Input, but KEEP progression (Level/XP) in background
  // IMPORTANT: We must clear the tasks in persistence so the Resume Overlay doesn't immediately reappear.
  const handleSoftReset = async () => {
    const saved = await PersistenceService.loadState();
    if (saved) {
      // Save "Clean" state (Stats kept, Tasks cleared)
      // This persists the Level/XP but marks the mission as "no active tasks"
      await PersistenceService.saveState(
        saved.themeId,
        [], // Clear tasks
        saved.gameState,
        saved.logs
      );
      
      // Update memory to reflect this (hides overlay)
      setResumableSession({
        ...saved,
        tasks: []
      });
      setViewGameState(saved.gameState);
    } else {
      setResumableSession(null);
      setViewGameState(undefined);
    }

    setPhase(AppPhase.INPUT);
    setTasks([]);
  };

  // Hard Reset: Wipe everything
  const handleHardReset = async () => {
    await PersistenceService.resetState();
    setPhase(AppPhase.INPUT);
    setTasks([]);
    setCurrentTheme(null);
    setInitialGameState(undefined);
    setInitialLogs([]);
    setViewGameState(undefined);
    setResumableSession(null);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ja' ? 'en' : 'ja');
  };

  if (phase === AppPhase.TEST_BENCH) {
    return <LibraryTestBench onBack={() => setPhase(AppPhase.INPUT)} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      <div className="flex-1 flex flex-col h-full relative">
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
           {/* Test Bench Button (Dev Tool) */}
          {phase === AppPhase.INPUT && (
            <button 
              onClick={() => setPhase(AppPhase.TEST_BENCH)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-yellow-600 hover:text-yellow-400 hover:border-yellow-900 transition-colors"
              title="Open Logic Testbench"
            >
              LAB
            </button>
          )}

          <button 
            onClick={toggleLang}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            {lang === 'ja' ? 'EN' : 'JP'}
          </button>
        </div>

        {phase === AppPhase.INPUT && (
          <div className="h-full overflow-y-auto flex items-center justify-center relative">
            <PhaseInput 
              onStartGeneration={handleStartGeneration} 
              onImportSession={handleImportSession}
              lang={lang} 
            />
            
            {/* Resume Overlay */}
            {resumableSession && resumableSession.tasks.length > 0 && (
              <div className="absolute inset-0 bg-slate-950/90 z-40 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-900 border border-cyan-500/50 p-8 rounded-xl max-w-md w-full shadow-2xl shadow-cyan-900/20">
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">SESSION INTERRUPTED</h3>
                  <p className="text-slate-400 mb-6 text-sm">
                    Existing mission data found from {new Date(resumableSession.lastUpdated).toLocaleString()}.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleResume}
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors font-mono"
                    >
                      RESUME MISSION
                    </button>
                    <button 
                      onClick={handleSoftReset}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-colors font-mono border border-slate-700"
                    >
                      ABORT & NEW
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {phase === AppPhase.GENERATING && (
          <LoadingScreen lang={lang} />
        )}

        {phase === AppPhase.EXECUTION && currentTheme && (
          <PhaseExecution 
            initialTasks={tasks} 
            theme={currentTheme} 
            initialGameState={initialGameState}
            initialLogs={initialLogs}
            onReset={handleSoftReset} // Use Soft Reset (keep stats)
            lang={lang} 
            onStateUpdate={(state) => setViewGameState(state)} // Keep panel updated
            onGenerateMore={handleGenerateMore} // Pass the generator
          />
        )}
      </div>
      
      {/* Methodology Panel / Player Profile */}
      <MethodologyPanel 
        lang={lang} 
        gameState={viewGameState}
        onHardReset={handleHardReset}
      />
    </div>
  );
};

export default App;