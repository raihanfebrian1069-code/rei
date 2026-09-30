/**
 * High-performance Web Audio API synthesizer for Nuclear Lab
 * Pure procedural audio - zero external audio assets required.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private geigerIntervalId: number | null = null;
  private reactorOsc: OscillatorNode | null = null;
  private reactorSubOsc: OscillatorNode | null = null;
  private reactorGain: GainNode | null = null;
  private currentCpm: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopGeiger();
      this.stopReactorHum();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Single Geiger-Müller counter click:
   * Short burst of bandpass filtered noise mimicking ionization discharge
   */
  public playGeigerClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.004; // 4ms pulse
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High frequency impulse noise with sharp decay
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2800 + (Math.random() * 800 - 400); // realistic slight jitter
      filter.Q.value = 3.5;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.28;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // AudioContext could be blocked until user gesture
    }
  }

  /**
   * Continuous Geiger stream proportional to simulated CPM
   */
  public updateGeigerStream(cpm: number) {
    if (this.isMuted) return;
    this.currentCpm = cpm;
    if (this.geigerIntervalId) {
      window.clearInterval(this.geigerIntervalId);
      this.geigerIntervalId = null;
    }

    if (cpm <= 15) return;

    // Convert CPM to average interval in ms with Poisson-like random jitter
    const avgIntervalMs = Math.max(25, 60000 / cpm);

    const scheduleNext = () => {
      if (this.isMuted || this.currentCpm <= 15) return;
      this.playGeigerClick();
      // Poisson jitter: exponential distribution around mean
      const jitteredDelay = -Math.log(Math.random() + 0.001) * avgIntervalMs;
      const clampedDelay = Math.min(Math.max(12, jitteredDelay), 2500);
      this.geigerIntervalId = window.setTimeout(scheduleNext, clampedDelay);
    };

    scheduleNext();
  }

  public stopGeiger() {
    if (this.geigerIntervalId) {
      window.clearTimeout(this.geigerIntervalId);
      this.geigerIntervalId = null;
    }
  }

  /**
   * Reactor Turbine & Core Drone:
   * Dynamic hum reflecting reactor power level (0% to 100%)
   */
  public updateReactorHum(powerNormalized: number) {
    if (this.isMuted) {
      this.stopReactorHum();
      return;
    }

    try {
      this.initContext();
      if (!this.ctx) return;

      if (!this.reactorOsc) {
        this.reactorOsc = this.ctx.createOscillator();
        this.reactorOsc.type = 'sawtooth';
        this.reactorOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

        this.reactorSubOsc = this.ctx.createOscillator();
        this.reactorSubOsc.type = 'sine';
        this.reactorSubOsc.frequency.setValueAtTime(30, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        this.reactorGain = this.ctx.createGain();
        this.reactorGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

        this.reactorOsc.connect(filter);
        this.reactorSubOsc.connect(filter);
        filter.connect(this.reactorGain);
        this.reactorGain.connect(this.ctx.destination);

        this.reactorOsc.start();
        this.reactorSubOsc.start();
      }

      // Modulate frequency & amplitude based on reactor power
      const baseFreq = 42 + powerNormalized * 40; // 42Hz to 82Hz
      const targetGain = Math.min(0.08, 0.01 + powerNormalized * 0.07);

      if (this.reactorOsc) {
        this.reactorOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.4);
      }
      if (this.reactorSubOsc) {
        this.reactorSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.4);
      }
      if (this.reactorGain) {
        this.reactorGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.3);
      }
    } catch {
      // Audio not initialized yet
    }
  }

  public stopReactorHum() {
    if (this.reactorGain && this.ctx) {
      this.reactorGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
    setTimeout(() => {
      try {
        if (this.reactorOsc) {
          this.reactorOsc.stop();
          this.reactorOsc.disconnect();
          this.reactorOsc = null;
        }
        if (this.reactorSubOsc) {
          this.reactorSubOsc.stop();
          this.reactorSubOsc.disconnect();
          this.reactorSubOsc = null;
        }
      } catch {
        // ignore
      }
    }, 250);
  }

  /**
   * Nuclear Fission explosion / pop sound
   */
  public playFissionPop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // ignore
    }
  }

  /**
   * Futuristic UI interaction beep
   */
  public playUiClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  }

  /**
   * Mission accomplished fanfare
   */
  public playMissionFanfare() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = this.ctx.currentTime + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.3);
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
