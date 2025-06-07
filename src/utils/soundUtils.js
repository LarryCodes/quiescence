// Sound manager for chess game effects
export const SoundManager = {
  audioContext: null,
  bufferSources: new Set(),
  
  // Sound presets
  presets: {
    move: {
      type: 'wood',
      duration: 0.18,
      volume: 0.5,
      frequency: 180,
      noiseAmount: 0.8,
      attack: 0.002,
      decay: 0.15,
      damping: 0.8
    },
    capture: {
      type: 'wood',
      duration: 0.25,
      volume: 0.6,
      frequency: 220,
      noiseAmount: 0.9,
      attack: 0.001,
      decay: 0.2,
      damping: 0.7
    },
    check: {
      type: 'wood',
      duration: 0.3,
      volume: 0.7,
      frequency: 260,
      noiseAmount: 0.7,
      attack: 0.001,
      decay: 0.25,
      damping: 0.6
    },
    castling: {
      type: 'wood',
      duration: 0.4,
      volume: 0.6,
      frequency: 150,
      noiseAmount: 0.6,
      attack: 0.005,
      decay: 0.35,
      damping: 0.75
    },
    gameEnd: {
      type: 'wood',
      duration: 0.8,
      volume: 0.5,
      frequency: 120,
      noiseAmount: 0.5,
      attack: 0.01,
      decay: 0.7,
      damping: 0.9
    }
  },
  
  init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize on first user interaction
      const initOnInteraction = () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        // Play a silent buffer to unlock audio on mobile devices
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
      };
      
      document.addEventListener('click', initOnInteraction, { once: true });
      document.addEventListener('keydown', initOnInteraction, { once: true });
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  },
  
  createWoodenImpactSound(params) {
    if (!this.audioContext) return null;
    
    const now = this.audioContext.currentTime;
    const {
      frequency = 180,      // Base frequency in Hz
      duration = 0.2,       // Total duration in seconds
      volume = 0.5,         // Max volume (0 to 1)
      noiseAmount = 0.7,    // Amount of noise (0 to 1)
      attack = 0.002,       // Attack time in seconds
      decay = 0.15,         // Decay time in seconds
      damping = 0.8         // Damping factor (0 to 1, higher = more damping)
    } = params;
    
    // Create noise buffer
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    // Fill buffer with noise
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1; // Generate white noise
    }
    
    // Create noise source
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    
    // Create noise filter
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 0.5;
    
    // Create noise gain
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volume * noiseAmount, now + attack);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Create oscillator for the tonal part
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    
    // Create filter for the oscillator
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 4, now);
    filter.frequency.exponentialRampToValueAtTime(frequency * 0.8, now + duration * 0.8);
    
    // Create gain for the oscillator
    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(volume * (1 - noiseAmount), now + attack);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * damping);
    
    // Create output gain
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;
    
    // Connect nodes
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(outputGain);
    
    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(outputGain);
    
    // Start oscillators
    const startTime = now;
    const stopTime = startTime + duration;
    
    osc.start(startTime);
    noise.start(startTime);
    
    // Stop and clean up
    osc.stop(stopTime);
    noise.stop(stopTime);
    
    // Add to buffer sources for cleanup
    this.bufferSources.add(osc);
    this.bufferSources.add(noise);
    
    const onEnded = () => {
      this.bufferSources.delete(osc);
      this.bufferSources.delete(noise);
      outputGain.disconnect();
    };
    
    osc.onended = onEnded;
    noise.onended = onEnded;
    
    return {
      output: outputGain,
      stop: (when = 0) => {
        const stopAt = this.audioContext.currentTime + when;
        outputGain.gain.cancelScheduledValues(stopAt);
        outputGain.gain.setValueAtTime(outputGain.gain.value, stopAt);
        outputGain.gain.exponentialRampToValueAtTime(0.001, stopAt + 0.02);
        osc.stop(stopAt + 0.02);
        noise.stop(stopAt + 0.02);
      },
      connect: (destination) => outputGain.connect(destination)
    };
  },
  
  // Play sound methods
  playMove() {
    this.playSound(this.presets.move);
  },
  
  playCapture() {
    this.playSound(this.presets.capture);
  },
  
  playCheck() {
    this.playSound(this.presets.check);
  },
  
  playCastling() {
    this.playSound(this.presets.castling);
  },
  
  playGameEnd() {
    this.playSound(this.presets.gameEnd);
  },
  
  playSound(params) {
    if (!this.audioContext) return;
    
    try {
      let sound;
      
      switch (params.type) {
        case 'wood':
        default:
          sound = this.createWoodenImpactSound(params);
          break;
      }
      
      if (sound) {
        sound.connect(this.audioContext.destination);
      }
      
      return sound;
    } catch (e) {
      console.warn('Error playing sound:', e);
      return null;
    }
  },
  
  // Clean up all sounds
  cleanup() {
    this.bufferSources.forEach(source => {
      try {
        if (source.stop) source.stop(0);
        if (source.disconnect) source.disconnect();
      } catch (e) {
        console.warn('Error cleaning up sound source:', e);
      }
    });
    this.bufferSources.clear();
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  SoundManager.init();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    SoundManager.cleanup();
  });
}
