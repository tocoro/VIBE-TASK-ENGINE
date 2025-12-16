import React, { useState } from 'react';
import { Language, translations } from '../i18n';
import { GameState } from '../types';

interface MethodologyPanelProps {
  lang: Language;
  gameState?: GameState;
  onHardReset: () => void;
}

const MethodologyPanel: React.FC<MethodologyPanelProps> = ({ lang, gameState, onHardReset }) => {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(t.shareText);
    alert(t.copied);
  };

  const confirmReset = () => {
    if (window.confirm(t.hardResetConfirm)) {
      onHardReset();
    }
  };

  // Safe defaults if no state provided
  const level = gameState?.level || 1;
  const currentXp = gameState?.currentXp || 0;
  const neededXp = gameState?.totalXpNeeded || 1000;
  const progress = Math.min(100, (currentXp / neededXp) * 100);
  const achievements = gameState?.achievements || [];

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col w-full md:w-96 hidden md:flex shrink-0">
      
      {/* 1. PLAYER PROFILE SECTION (Fixed Top) */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-bold text-slate-500 tracking-widest mb-4 font-mono">
          {t.playerProfile}
        </h2>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center relative shadow-lg">
            <span className="text-3xl font-black text-white font-mono">{level}</span>
            <div className="absolute -bottom-2 bg-slate-800 text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-400">LVL</div>
          </div>
          <div className="flex-1">
             <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
               <span>XP</span>
               <span>{currentXp} / {neededXp}</span>
             </div>
             <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
             </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-600 mb-2 uppercase">{t.badges}</h3>
          <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-950/50 p-2 rounded border border-slate-800/50">
             {achievements.length === 0 && <span className="text-xs text-slate-700 italic px-2 py-1">No data...</span>}
             {achievements.map((a, i) => (
               <div key={i} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-lg shadow-sm" title={a.id}>
                 {a.icon}
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* 2. METHODOLOGY ACCORDION (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-sm font-bold text-white font-mono border-b border-slate-700 pb-2 mb-4 hover:text-cyan-400 transition-colors"
        >
          <span>{t.methodologyTitle}</span>
          <span>{isOpen ? '−' : '+'}</span>
        </button>
        
        {isOpen ? (
          <div className="space-y-6 text-sm leading-relaxed animate-fade-in text-slate-400">
            <section>
              <h3 className="text-slate-200 font-semibold mb-2">{t.methodologyHeader}</h3>
              <p className="mb-2" dangerouslySetInnerHTML={{ __html: t.methodologyBody1 }} />
              <ul className="list-disc pl-4 space-y-2 text-slate-500">
                <li dangerouslySetInnerHTML={{ __html: t.methodologyList1 }} />
                <li dangerouslySetInnerHTML={{ __html: t.methodologyList2 }} />
                <li dangerouslySetInnerHTML={{ __html: t.methodologyList3 }} />
              </ul>
            </section>

            <section className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <p className="text-xs font-mono text-cyan-400 mb-2">{t.methodologyShortForm}</p>
              <div className="italic text-slate-300 mb-4 whitespace-pre-wrap font-serif text-xs">
                {t.shareText}
              </div>
              <button 
                onClick={copyToClipboard}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                {t.copyClipboard}
              </button>
            </section>

            <section>
              <p className="text-xs text-slate-600" dangerouslySetInnerHTML={{ __html: t.methodologyFooter }} />
            </section>
          </div>
        ) : (
           <div className="text-xs text-slate-600 italic cursor-pointer" onClick={() => setIsOpen(true)}>
             {t.methodologyExpand}
           </div>
        )}
      </div>

      {/* 3. FOOTER ACTIONS */}
      <div className="p-4 border-t border-slate-800">
         <button 
           onClick={confirmReset}
           className="w-full py-2 text-xs font-mono text-red-900 hover:text-red-500 border border-transparent hover:border-red-900/30 rounded transition-colors text-center opacity-50 hover:opacity-100"
         >
           [{t.hardReset}]
         </button>
      </div>

    </div>
  );
};

export default MethodologyPanel;