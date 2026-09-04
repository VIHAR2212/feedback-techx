// Sound effects utility with safe playback and error handling for mobile/desktop browsers

class SoundManager {
  private cache: Record<string, HTMLAudioElement> = {};
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('techx_sound_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('techx_sound_muted', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public play(soundName: 'click' | 'achievement' | 'explosion' | 'labs' | 'portal' | 'minecraft', volume = 0.5) {
    if (typeof window === 'undefined' || this.isMuted) return;

    try {
      const pathMap: Record<string, string> = {
        click: '/sounds/click.mp3',
        achievement: '/sounds/achievement.mp3',
        explosion: '/sounds/explosion.mp3',
        labs: '/sounds/labs.mp3',
        portal: '/sounds/portail-du-nether.mp3',
        minecraft: '/sounds/minecraft-1.mp3',
      };

      const path = pathMap[soundName];
      if (!path) return;

      const audio = new Audio(path);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {
        // Autoplay policy or user hasn't interacted yet — safe ignore
      });
    } catch {
      // Audio playback failed or not supported in this environment
    }
  }
}

export const soundEffects = new SoundManager();

export const playClickSound = (volume = 0.4) => soundEffects.play('click', volume);
export const playAchievementSound = (volume = 0.6) => soundEffects.play('achievement', volume);
export const playExplosionSound = (volume = 0.5) => soundEffects.play('explosion', volume);
export const playLabsSound = (volume = 0.5) => soundEffects.play('labs', volume);
export const playPortalSound = (volume = 0.4) => soundEffects.play('portal', volume);
