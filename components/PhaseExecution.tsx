import React, { useEffect, useState } from 'react';
import { GameTask, VibeTheme, GameState, HistoryLogEntry } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Language, translations } from '../i18n';
import { useVibeGame } from '../hooks/useVibeGame';
import { VibeFXEngine, FXRequest } from '../lib/VibeFXEngine';
import VibeFXOverlay from './VibeFXOverlay';
import { PersistenceService } from '../lib/PersistenceService';

interface PhaseExecutionProps {
  initialTasks: GameTask[];
  theme: VibeTheme;
  initialGameState?: GameState;
  initialLogs?: HistoryLogEntry[];
  onReset: () => void;
  lang: Language;
  onStateUpdate?: (state: GameState) => void;
  onGenerateMore?: (text: string) => Promise<GameTask[]>;
}

const PhaseExecution: React.FC<PhaseExecutionProps> = ({ 
  initialTasks, 
  theme, 
  initialGameState, 
  initialLogs,
  onReset, 
  lang,
  onStateUpdate,
  onGenerateMore
}) => {
  const { tasks, gameState, logs, completeTask, addNewTasks, events } = useVibeGame(
    initialTasks, 
    theme, 
    initialGameState,
    initialLogs
  );
  
  // Propagate state up to App so MethodologyPanel can see it
  useEffect(() => {
    if (onStateUpdate) {
      onStateUpdate(gameState);
    }
  }, [gameState, onStateUpdate]);
  
  const t = translations[lang];
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [fxQueue, setFxQueue] = useState<FXRequest[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Add Task Modal State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // --- FX Pipeline ---
  useEffect(() => {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;

    let newEffects: FXRequest[] = [];

    switch (lastEvent.type) {
      case 'COMPLETE':
        setLastCompletedId(lastEvent.taskId);
        const timer = setTimeout(() => setLastCompletedId(null), 1000);
        const intensity = Math.min(1.0, lastEvent.xp / 500);
        newEffects = VibeFXEngine.generateEffectsForEvent('COMPLETE', theme, intensity);
        if (lastEvent.combo && lastEvent.combo > 1) {
           const comboFx = VibeFXEngine.generateEffectsForEvent('COMBO', theme, Math.min(1.0, lastEvent.combo / 5));
           newEffects = [...newEffects, ...comboFx];
        }
        return () => clearTimeout(timer);
      case 'LEVEL_UP':
        newEffects = VibeFXEngine.generateEffectsForEvent('LEVEL_UP', theme, 1.0);
        break;
      case 'ACHIEVEMENT':
        newEffects = VibeFXEngine.generateEffectsForEvent('ACHIEVEMENT', theme, 1.0);
        break;
    }

    if (newEffects.length > 0) {
      setFxQueue(newEffects);
    }
  }, [events, theme]);

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
  };

  const handleBackup = () => {
    PersistenceService.exportStateJSON(theme.id, tasks, gameState, logs);
  };

  const handleAddTaskSubmit = async () => {
    if (!newTaskInput.trim() || !onGenerateMore) return;
    
    setIsGeneratingMore(true);
    try {
      const newGameTasks = await onGenerateMore(newTaskInput);
      addNewTasks(newGameTasks);
      setNewTaskInput('');
      setIsAddingTask(false);
    } catch (e) {
      alert("Failed to decrypt new orders. Check comms link.");
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const chartData = gameState.momentum.map((val, idx) => ({ time: idx, val }));
  const progressPercent = Math.min(100, (gameState.currentXp / gameState.totalXpNeeded) * 100);

  const achievementEvents = events.filter(e => e.type === 'ACHIEVEMENT');
  // Replaced findLast with slice().reverse().find() to support older TS/JS targets
  const comboEvent = events.slice().reverse().find(e => e.type === 'COMPLETE' && e.combo && e.combo > 1);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900 relative">
      
      <VibeFXOverlay requests={fxQueue} />

      {/* Toast Notifications */}
      <div className="absolute top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {achievementEvents.map((evt: any, i) => {
           const achInfo = t.achievements[evt.achievement.id as keyof typeof t.achievements];
           return (
            <div key={`${evt.achievement.id}-${i}`} className="animate-fade-in-right bg-slate-800 border-l-4 border-yellow-400 p-4 rounded shadow-2xl flex items-center gap-3 w-64">
              <div className="text-2xl">{evt.achievement.icon}</div>
              <div>
                <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">{t.achievementUnlocked}</div>
                <div className="text-sm font-bold text-white">{achInfo.title}</div>
                <div className="text-xs text-slate-400">{achInfo.desc}</div>
              </div>
            </div>
           );
        })}
      </div>

      {/* Combo Overlay */}
      {comboEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-bounce">
          <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] font-sans transform -rotate-6">
            {comboEvent.combo} {t.combo}
          </div>
        </div>
      )}

      {/* HUD Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-10">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <div className={`w-12 h-12 rounded bg-slate-900 border-2 flex items-center justify-center font-bold text-xl ${theme.color.split(' ')[0]} ${theme.color.split(' ')[1]}`}>
                  {gameState.level}
                </div>
                <div className="absolute -bottom-2 -right-2 text-[10px] bg-slate-700 px-1 rounded text-white font-mono">LVL</div>
             </div>
             <div>
               <h2 className="text-white font-mono text-sm tracking-wider">{t.systemOnline}</h2>
               <div className="w-32 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                 />
               </div>
               <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                 XP: {gameState.currentXp} / {gameState.totalXpNeeded}
               </div>
             </div>
          </div>

          <div className="hidden sm:block w-48 h-12">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
             </ResponsiveContainer>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleBackup}
              title={t.backupDesc}
              className="text-xs font-mono text-cyan-500 hover:text-cyan-400 border border-slate-700 px-3 py-1 rounded hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              {t.backup}
            </button>
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={`text-xs font-mono border border-slate-700 px-3 py-1 rounded transition-colors ${showLogs ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              LOGS
            </button>
            <button 
              onClick={onReset}
              className="text-xs font-mono text-red-500 hover:text-red-400 border border-slate-700 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              {t.abort}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View if Logs Open */}
      <main className="flex-1 overflow-hidden flex relative">
        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4 pb-20">
            <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-4">
               <h3 className={`font-mono text-sm tracking-widest opacity-70 ${theme.color.split(' ')[0]}`}>
                {t.activeQuests}
              </h3>
            </div>
            
            {tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => handleCompleteTask(task.id)}
                className={`
                  relative group cursor-pointer border rounded-lg p-4 transition-all duration-300
                  ${task.completed 
                    ? 'bg-slate-900/50 border-slate-800 opacity-50 grayscale' 
                    : `bg-slate-800/80 border-slate-700 hover:bg-slate-800 ${theme.color.split(' ')[1]} hover:shadow-lg hover:scale-[1.01]`
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`
                        text-xs font-bold px-2 py-0.5 rounded border
                        ${task.difficulty === 'S' ? 'border-red-500 text-red-400 bg-red-900/20' : 
                          task.difficulty === 'A' ? 'border-orange-500 text-orange-400 bg-orange-900/20' :
                          task.difficulty === 'B' ? 'border-blue-500 text-blue-400 bg-blue-900/20' :
                          'border-green-500 text-green-400 bg-green-900/20'}
                      `}>
                        {t.rank} {task.difficulty}
                      </span>
                      {/* Quest Title is now the original text */}
                      <h4 className={`font-bold font-mono text-lg ${task.completed ? 'line-through text-slate-600' : 'text-white'}`}>
                        {task.questTitle}
                      </h4>
                    </div>
                    {/* Flavor Text adds the style/atmosphere */}
                    <p className="text-sm text-slate-400 mb-1 italic opacity-90 border-l-2 border-slate-700 pl-3">
                      {task.flavorText}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-mono text-cyan-400 font-bold">+{task.xp} XP</span>
                    <div className={`mt-2 w-6 h-6 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-cyan-500 border-cyan-500 text-slate-900' : 'border-slate-600'}`}>
                      {task.completed && (
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </div>
                  </div>
                </div>
                {lastCompletedId === task.id && (
                   <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none animate-pulse-fast rounded-lg" />
                )}
              </div>
            ))}

            {/* ADD TASK BUTTON */}
            {onGenerateMore && (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full p-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all font-mono text-sm tracking-widest flex items-center justify-center gap-2 group"
              >
                <span className="group-hover:animate-pulse">+</span> {t.addTasks}
              </button>
            )}
            
            {tasks.every(t => t.completed) && tasks.length > 0 && (
              <div className="mt-8 text-center p-8 border-2 border-dashed border-slate-700 rounded-xl animate-fade-in">
                <h3 className="text-2xl font-bold text-white mb-2">{t.allSystemsOperational}</h3>
                <p className="text-slate-400">{t.objectivesCleared}</p>
                <button onClick={onReset} className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-mono text-sm">
                  {t.initializeNew}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LOG PANEL */}
        <div className={`
          absolute top-0 right-0 h-full bg-slate-950 border-l border-slate-800 w-80 shadow-2xl transition-transform duration-300 z-20 flex flex-col
          ${showLogs ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-mono text-sm font-bold text-slate-400">OPERATION LOGS</h3>
            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar">
            {logs.length === 0 && <p className="text-slate-600 italic text-center py-4">No records found.</p>}
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-slate-700 pl-3 py-1">
                <div className="text-slate-500 text-[10px] mb-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className={`font-bold mb-0.5 ${
                  log.type === 'TASK_COMPLETE' ? 'text-green-400' :
                  log.type === 'LEVEL_UP' ? 'text-yellow-400' :
                  log.type === 'ACHIEVEMENT_UNLOCK' ? 'text-purple-400' : 'text-slate-300'
                }`}>
                  {log.message}
                </div>
                {log.details && (
                  <div className="text-slate-600">
                    {JSON.stringify(log.details).slice(0, 50)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ADD TASK MODAL Overlay */}
        {isAddingTask && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 w-full max-w-md shadow-2xl animate-fade-in">
                <h3 className="text-cyan-400 font-mono font-bold text-lg mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"/>
                   {t.addTasks}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{t.addTasksDesc}</p>
                
                <textarea 
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-sm focus:border-cyan-500 outline-none resize-none mb-4"
                  placeholder={t.addTasksPlaceholder}
                  disabled={isGeneratingMore}
                />
                
                <div className="flex gap-2 justify-end">
                   <button 
                     onClick={() => setIsAddingTask(false)}
                     disabled={isGeneratingMore}
                     className="px-4 py-2 text-slate-400 hover:text-white font-mono text-xs"
                   >
                     {t.cancel}
                   </button>
                   <button 
                     onClick={handleAddTaskSubmit}
                     disabled={!newTaskInput.trim() || isGeneratingMore}
                     className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded font-mono text-xs font-bold flex items-center gap-2"
                   >
                     {isGeneratingMore && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                     {t.receive}
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PhaseExecution;