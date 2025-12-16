import React, { useEffect, useState } from 'react';
import { Language, translations } from '../i18n';

interface LoadingScreenProps {
  lang: Language;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ lang }) => {
  const [log, setLog] = useState<string[]>([]);
  const t = translations[lang];
  
  // Use messages from translation
  const messages = t.loadingMessages;

  useEffect(() => {
    let delay = 0;
    messages.forEach((msg, index) => {
      delay += Math.random() * 500 + 300;
      setTimeout(() => {
        setLog(prev => [...prev, `> ${msg}`]);
      }, delay);
    });
  }, [messages]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 font-mono bg-slate-950">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-6 h-6 border-2 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-cyan-500 tracking-widest animate-pulse">
            {t.constructing}
          </h2>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 shadow-inner">
          {log.map((l, i) => (
            <div key={i} className="mb-1">{l}</div>
          ))}
          <div className="animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;