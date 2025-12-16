import { GoogleGenAI, Type } from "@google/genai";
import { RawTask, GameTask, VibeTheme } from "../types";
import { Language } from "../i18n";

const SYSTEM_INSTRUCTION = `
You are an advanced Gamification Engine designed to implement the "Vibe Coding" methodology. 
Your goal is to separate the *generation of incentive* from the *execution of tasks*.

CORE DIRECTIVE:
1. DO NOT RENAME THE TASKS. The user must know exactly what to do. The 'questTitle' must be identical to the input text.
2. DO NOT FICTIONALIZE THE TITLE. "Wash dishes" stays "Wash dishes".
3. USE 'flavorText' TO GAMIFY. All the creativity, wit, and immersion goes into the description (flavorText), not the title.
`;

export const generateGameTasks = async (tasks: RawTask[], theme: VibeTheme, lang: Language): Promise<GameTask[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Target Language: ${lang === 'ja' ? 'Japanese' : 'English'}
    Theme: ${theme.name[lang]}
    Context: ${theme.promptContext[lang]}
    
    Tasks to Gamify:
    ${tasks.map(t => `- ${t.text} (ID: ${t.id})`).join('\n')}
    
    Please process these tasks.
    RULES:
    1. 'questTitle' MUST be IDENTICAL to the original task text.
    2. 'flavorText' MUST be a creative, immersive description in the Target Language (${lang === 'ja' ? 'Japanese' : 'English'}) based on the Theme.
    3. Assign a difficulty (S, A, B, C) and XP value (100-500) based on perceived effort.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "The original ID of the task" },
              questTitle: { type: Type.STRING, description: "MUST MATCH INPUT TEXT EXACTLY" },
              flavorText: { type: Type.STRING, description: "A short, immersive description of the mission in the theme's style" },
              difficulty: { type: Type.STRING, enum: ["S", "A", "B", "C"] },
              xp: { type: Type.INTEGER, description: "Experience points reward" }
            },
            required: ["id", "questTitle", "flavorText", "difficulty", "xp"]
          }
        }
      }
    });

    const generatedData = JSON.parse(response.text || "[]");
    
    // Merge generated data with original data to ensure integrity
    return generatedData.map((g: any) => {
      const original = tasks.find(t => t.id === g.id);
      return {
        id: g.id,
        originalText: original ? original.text : "Unknown Task",
        questTitle: g.questTitle, // Should be same as original now
        flavorText: g.flavorText,
        difficulty: g.difficulty,
        xp: g.xp,
        completed: false
      };
    });

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback if API fails, just to keep app running in demo mode
    return tasks.map(t => ({
      id: t.id,
      originalText: t.text,
      questTitle: t.text, // Keep original
      flavorText: lang === 'ja' ? "システムオフライン。手動オーバーライド起動。" : "System offline. Manual override engaged.",
      difficulty: 'B',
      xp: 100,
      completed: false
    }));
  }
};