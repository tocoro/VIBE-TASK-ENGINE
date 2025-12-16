import React, { useState } from 'react';
import { IncentiveEngine } from '../lib/IncentiveEngine';
import { GameState, GameTask } from '../types';

interface LogEntry {
  time: number;
  message: string;
  details?: any;
}

const LibraryTestBench: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // --- Simulation State ---
  const [virtualTime, setVirtualTime] = useState(1000000); // Start at arbitrary time
  const [gameState, setGameState] = useState<GameState>(IncentiveEngine.createInitialState());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Dummy Tasks Generator
  const createDummyTask = (id: string, diff: 'S'|'A'|'B'|'C', xp: number): GameTask => ({
    id,
    originalText: `Test Task ${diff}`,
    questTitle: `Operation ${diff}`,
    flavorText: "Simulation running...",
    difficulty: diff,
    xp,
    completed: false
  });

  const [testTasks] = useState<GameTask[]>([
    createDummyTask('t1', 'B', 100),
    createDummyTask('t2', 'B', 100),
    createDummyTask('t3', 'A', 300),
    createDummyTask('t4', 'S', 500),
    createDummyTask('t5', 'C', 50),
    createDummyTask('t6', 'B', 100),
    createDummyTask('t7', 'B', 100),
    createDummyTask('t8', 'S', 500),
  ]);

  // --- Actions ---

  const addLog = (msg: string, details?: any) => {
    setLogs(prev => [{ time: virtualTime, message: msg, details }, ...prev]);
  };

  const advanceTime = (ms: number) => {
    setVirtualTime(prev => prev + ms);
    addLog(`⏳ Time advanced by ${ms/1000}s`);
  };

  const executeTask = (diff: 'S'|'A'|'B'|'C', xp: number) => {
    // Generate a temporary task on the fly to allow infinite testing
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const task = createDummyTask(tempId, diff, xp);
    
    // We need to pass a list that includes this task
    const currentTasks = [...testTasks, task]; 

    const result = IncentiveEngine.processTaskCompletion(
      tempId, 
      currentTasks, 
      gameState, 
      virtualTime // Inject Virtual Time
    );

    if (result) {
      setGameState(result.newState);
      
      let msg = `✅ Completed [${diff}] (+${result.xpGained} XP)`;
      if (result.comboTriggered) msg += ` 🔥 ${result.newState.combo.count}x Combo!`;
      if (result.leveledUp) msg += ` 🆙 LEVEL UP!`;
      
      addLog(msg);
      
      if (result.achievementsUnlocked.length > 0) {
        result.achievementsUnlocked.forEach(a => {
          addLog(`🏆 UNLOCKED: ${a.id} ${a.icon}`);
        });
      }
      
      // Auto-advance time slightly (e.g. 5 seconds to perform task)
      advanceTime(5000); 
    }
  };

  const resetEngine = () => {
    setGameState(IncentiveEngine.createInitialState());
    setVirtualTime(1000000);
    setLogs([]);
    addLog("🔄 Engine Reset");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <div>
             <h1 className="text-2xl font-bold text-yellow-400">⚡ INCENTIVE ENGINE TESTBENCH</h1>
             <p className="text-slate-500 text-sm">Direct Logic Verification Lab</p>
          </div>
          <button onClick={onBack} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800">
            Exit Lab
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="space-y-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Time Control</h3>
              <div className="flex gap-2 mb-4">
                 <div className="text-4xl font-mono text-cyan-400">
                    T+{Math.floor((virtualTime - 1000000)/1000)}s
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => advanceTime(1000)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs">+1 sec</button>
                <button onClick={() => advanceTime(10000)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs">+10 sec</button>
                <button onClick={() => advanceTime(31000)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs text-orange-400 border border-orange-900/50">+31s (Break Combo)</button>
                <button onClick={() => advanceTime(60000)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs">+60 sec</button>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Task Simulation</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => executeTask('B', 100)}
                  className="w-full flex justify-between items-center bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 p-3 rounded group"
                >
                  <span>Small Task (Rank B)</span>
                  <span className="font-bold text-blue-400">100 XP</span>
                </button>
                
                <button 
                  onClick={() => executeTask('A', 300)}
                  className="w-full flex justify-between items-center bg-green-900/30 hover:bg-green-900/50 border border-green-800 p-3 rounded group"
                >
                  <span>Medium Task (Rank A)</span>
                  <span className="font-bold text-green-400">300 XP</span>
                </button>

                <button 
                  onClick={() => executeTask('S', 500)}
                  className="w-full flex justify-between items-center bg-red-900/30 hover:bg-red-900/50 border border-red-800 p-3 rounded group"
                >
                  <span>BOSS Task (Rank S)</span>
                  <span className="font-bold text-red-400">500 XP</span>
                </button>
              </div>
            </div>

            <button onClick={resetEngine} className="w-full py-4 border border-slate-700 rounded hover:bg-red-900/20 text-red-400 transition-colors">
              Reset Engine State
            </button>
          </div>

          {/* State Visualization Column */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 lg:col-span-2 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Engine State (Read-Only)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <div className="text-xs text-slate-500">LEVEL</div>
                <div className="text-3xl font-bold text-white">{gameState.level}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <div className="text-xs text-slate-500">XP</div>
                <div className="text-3xl font-bold text-white">{gameState.currentXp} <span className="text-sm text-slate-600">/ {gameState.totalXpNeeded}</span></div>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                 <div className="text-xs text-slate-500">COMBO</div>
                 <div className={`text-3xl font-bold ${gameState.combo.count > 1 ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`}>
                   {gameState.combo.count}x
                 </div>
                 <div className="text-xs text-slate-500 mt-1">Mult: {gameState.combo.multiplier.toFixed(1)}x</div>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                 <div className="text-xs text-slate-500">TASKS DONE</div>
                 <div className="text-3xl font-bold text-white">{gameState.completedTasks}</div>
              </div>
            </div>

            <div className="mb-6">
               <div className="text-xs text-slate-500 mb-2">ACHIEVEMENTS</div>
               <div className="flex gap-2 flex-wrap min-h-[50px] bg-slate-950 p-3 rounded border border-slate-800">
                 {gameState.achievements.length === 0 && <span className="text-slate-700 italic">None yet...</span>}
                 {gameState.achievements.map(a => (
                   <div key={a.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded border border-slate-700" title={a.id}>
                     <span>{a.icon}</span>
                     <span className="text-xs font-bold">{a.id}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="flex-1 bg-black rounded border border-slate-800 p-4 overflow-y-auto font-mono text-xs h-64 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-slate-900 pb-1 last:border-0">
                  <span className="text-slate-600 mr-2">[{Math.floor((log.time - 1000000)/1000)}s]</span>
                  <span className={log.message.includes('XP') ? 'text-green-400' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-700 text-center mt-10">Waiting for input...</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LibraryTestBench;