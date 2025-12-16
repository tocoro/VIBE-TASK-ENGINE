import { VibeTheme } from '../types';

export type FXType = 'PARTICLE_EXPLOSION' | 'SCREEN_SHAKE' | 'TEXT_GLITCH' | 'FLASH';

export interface FXRequest {
  id: string;
  type: FXType;
  color: string;
  count?: number;
  duration?: number;
  intensity?: number;
  x?: number; // 0-100% position
  y?: number; // 0-100% position
}

/**
 * VibeFXEngine
 * 
 * "Director" of the visual experience.
 * Translates abstract Game Events (Level Up, Combo) into concrete Visual Effects
 * based on the current Theme context.
 */
export class VibeFXEngine {
  
  /**
   * Generates a list of visual effects based on a specific event and theme.
   */
  static generateEffectsForEvent(
    eventType: 'COMPLETE' | 'LEVEL_UP' | 'COMBO' | 'ACHIEVEMENT',
    theme: VibeTheme,
    intensity: number = 1 // 0.0 to 1.0 (e.g. based on XP amount)
  ): FXRequest[] {
    const effects: FXRequest[] = [];
    const timestamp = Date.now();
    const primaryColor = this.extractColor(theme.color);

    switch (eventType) {
      case 'COMPLETE':
        // Basic gratification: Particles + Small Flash
        effects.push({
          id: `fx-${timestamp}-1`,
          type: 'PARTICLE_EXPLOSION',
          color: primaryColor,
          count: 10 + Math.floor(intensity * 20),
          duration: 800
        });
        break;

      case 'COMBO':
        // Increasing excitement: Screen Shake + Glitch
        effects.push({
          id: `fx-${timestamp}-combo`,
          type: 'SCREEN_SHAKE',
          color: primaryColor,
          intensity: 0.2 + (intensity * 0.5), // More combo = more shake
          duration: 300
        });
        if (theme.id === 'cyberpunk' || theme.id === 'eldritch') {
           effects.push({
            id: `fx-${timestamp}-glitch`,
            type: 'TEXT_GLITCH',
            color: primaryColor,
            duration: 500
          });
        }
        break;

      case 'LEVEL_UP':
        // Major dopamine hit: Massive Particles + Long Flash + Shake
        effects.push({
          id: `fx-${timestamp}-lvl-flash`,
          type: 'FLASH',
          color: 'white',
          duration: 1000
        });
        effects.push({
          id: `fx-${timestamp}-lvl-particles`,
          type: 'PARTICLE_EXPLOSION',
          color: theme.id === 'fantasy' ? '#fbbf24' : primaryColor, // Gold for fantasy
          count: 50,
          duration: 2000
        });
        effects.push({
          id: `fx-${timestamp}-lvl-shake`,
          type: 'SCREEN_SHAKE',
          color: primaryColor,
          intensity: 1.0,
          duration: 500
        });
        break;

      case 'ACHIEVEMENT':
        // Celebration
        effects.push({
          id: `fx-${timestamp}-ach`,
          type: 'PARTICLE_EXPLOSION',
          color: '#fbbf24', // Gold
          count: 30,
          duration: 1500
        });
        break;
    }

    return effects;
  }

  // Helper to extract a hex/rgb color from tailwind class string approximation
  // In a real app, themes would have explicit hex codes.
  private static extractColor(themeColorClass: string): string {
    if (themeColorClass.includes('cyan')) return '#06b6d4';
    if (themeColorClass.includes('yellow')) return '#fbbf24';
    if (themeColorClass.includes('blue')) return '#3b82f6';
    if (themeColorClass.includes('purple')) return '#a855f7';
    if (themeColorClass.includes('red')) return '#ef4444';
    return '#ffffff';
  }
}