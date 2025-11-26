
export type SoundType = 'click' | 'pop' | 'coin' | 'eat' | 'jump' | 'crash' | 'success' | 'loose' | 'powerup';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(type: SoundType) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'click':
        // Short high blip
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;

      case 'pop':
        // Gentle bubble pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;

      case 'coin':
        // High double ding
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.setValueAtTime(1600, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.setValueAtTime(0.05, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;

      case 'eat':
        // Crunch noise simulation (rapid frequency shift)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        
        // Second crunch
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(250, t + 0.15);
        osc2.frequency.linearRampToValueAtTime(50, t + 0.3);
        gain2.gain.setValueAtTime(0.1, t + 0.15);
        gain2.gain.linearRampToValueAtTime(0, t + 0.3);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.3);
        break;

      case 'jump':
        // Slide up
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(300, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;

      case 'crash':
        // Low discord
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;

      case 'success':
        // Major Arpeggio
        this.playNote(523.25, t, 0.1, 'square'); // C5
        this.playNote(659.25, t + 0.1, 0.1, 'square'); // E5
        this.playNote(783.99, t + 0.2, 0.2, 'square'); // G5
        this.playNote(1046.50, t + 0.3, 0.4, 'square'); // C6
        break;

      case 'loose':
        // Sad slide
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.5);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
        
      case 'powerup':
         this.playNote(600, t, 0.1, 'sine');
         this.playNote(1200, t + 0.1, 0.2, 'sine');
         break;
    }
  }

  private playNote(freq: number, time: number, duration: number, type: OscillatorType) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.start(time);
    osc.stop(time + duration);
  }
}

export const sounds = new SoundManager();
