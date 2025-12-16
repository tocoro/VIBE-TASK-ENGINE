import React, { useState, useRef } from 'react';
import { RawTask, THEMES, VibeTheme, SavedSession } from '../types';
import { Language, translations } from '../i18n';
import { PersistenceService } from '../lib/PersistenceService';

interface PhaseInputProps {
  onStartGeneration: (tasks: RawTask[], theme: VibeTheme) => void;
  onImportSession?: (session: SavedSession) => void;
  lang: Language;
}

const PhaseInput: React.FC<PhaseInputProps> = ({ onStartGeneration, onImportSession, lang }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(THEMES[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleSubmit = () => {
    if (!textInput.trim()) return;

    const tasks: RawTask[] = textInput
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, index) => ({
        id: `task-${Date.now()}-${index}`,
        text: line.trim()
      }));

    const theme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
    onStartGeneration(tasks, theme);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImportSession) {
      try {
        const session = await PersistenceService.importStateJSON(e.target.files[0]);
        onImportSession(session);
      } catch (err) {
        alert(t.importError);
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
          {t.title}
        </h1>
        <p className="text-slate-400">
          {t.subtitle}
        </p>
      </div>

      <div className="space-y-6">
        {/* Task Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 font-mono">
            {t.inputLabel}
          </label>
          <textarea
            className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none font-mono text-sm"
            placeholder={t.placeholder}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3 font-mono">
            {t.themeLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`p-4 rounded-lg border text-left transition-all duration-200 group relative overflow-hidden ${
                  selectedThemeId === theme.id
                    ? `bg-slate-800 ${theme.color}`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="relative z-10">
                  <div className="font-bold font-mono text-sm mb-1">{theme.name[lang]}</div>
                  <div className="text-xs opacity-70">{theme.description[lang]}</div>
                </div>
                {selectedThemeId === theme.id && (
                  <div className="absolute inset-0 bg-current opacity-5 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={!textInput.trim()}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-cyan-900/50 transition-all transform hover:scale-[1.01] active:scale-[0.99] font-mono tracking-wider flex items-center justify-center gap-3"
        >
          <span>{t.startButton}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>

        {/* Import Button */}
        <div className="pt-4 border-t border-slate-800">
           <input 
             type="file" 
             ref={fileInputRef}
             className="hidden" 
             accept=".json"
             onChange={handleFileChange}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full py-2 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-sm font-mono flex items-center justify-center gap-2 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
             {t.loadBackup}
           </button>
        </div>
      </div>
    </div>
  );
};

export default PhaseInput;