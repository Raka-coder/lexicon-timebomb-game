class SFXManager {
  private ctx: AudioContext | null = null;
  private _muted = false;
  private initialized = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new AudioCtx();
      console.log('[SFX] AudioContext created, state:', this.ctx.state);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log('[SFX] AudioContext resumed');
      }).catch((e) => {
        console.warn('[SFX] Failed to resume:', e);
      });
    }
    
    return this.ctx;
  }

  initOnInteraction() {
    if (this.initialized) return;
    this.getContext();
    this.initialized = true;
    console.log('[SFX] Initialized on user interaction');
  }

  playPing() {
    if (this._muted) return;
    console.log('[SFX] playPing called');
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        console.log('[SFX] Context suspended, resuming...');
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      console.log('[SFX] Ping played successfully');
    } catch (e) {
      console.error('[SFX] ping failed', e);
    }
  }

  playTick() {
    if (this._muted) return;
    console.log('[SFX] playTick called');
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 600;
      osc.type = 'square';

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error('[SFX] tick failed', e);
    }
  }

  playBoom() {
    if (this._muted) return;
    console.log('[SFX] playBoom called');
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      source.start();
    } catch (e) {
      console.error('[SFX] boom failed', e);
    }
  }

  playSuccess() {
    if (this._muted) return;
    console.log('[SFX] playSuccess called');
    try {
      const ctx = this.getContext();
      
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        const startTime = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (e) {
      console.error('[SFX] success failed', e);
    }
  }

  playError() {
    if (this._muted) return;
    console.log('[SFX] playError called');
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      osc.type = 'sawtooth';

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error('[SFX] error failed', e);
    }
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    return this._muted;
  }

  isMuted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
  }
}

export const sfx = new SFXManager();