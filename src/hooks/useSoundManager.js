import { useCallback, useEffect, useRef } from 'react';

/**
 * Sound manager hook using Web Audio API
 * Generates procedural 8-bit style sounds for Pacman
 */
export function useSoundManager() {
  const audioContextRef = useRef(null);
  const enabledRef = useRef(true);
  const gainNodeRef = useRef(null);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0.3; // Master volume
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play a tone with given frequency and duration
  const playTone = useCallback((frequency, duration, type = 'square', startTime = 0) => {
    if (!enabledRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(gainNodeRef.current);

    oscillator.start(ctx.currentTime + startTime);
    oscillator.stop(ctx.currentTime + startTime + duration);
  }, [initAudio]);

  // Sound: Dot eating (quick chirp, alternating pitches)
  const dotEatCountRef = useRef(0);
  const playDotEat = useCallback(() => {
    if (!enabledRef.current) return;
    // Alternate between two pitches for classic waka-waka sound
    const freq = dotEatCountRef.current % 2 === 0 ? 440 : 493.88; // A4 and B4
    dotEatCountRef.current++;
    playTone(freq, 0.05, 'square');
  }, [playTone]);

  // Sound: Power pellet (ascending sweep)
  const playPowerPellet = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(gainNodeRef.current);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }, [initAudio]);

  // Sound: Eating ghost (rising triumphant notes)
  const playGhostEat = useCallback(() => {
    if (!enabledRef.current) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      playTone(freq, 0.1, 'square', i * 0.08);
    });
  }, [playTone]);

  // Sound: Death (descending sad tone)
  const playDeath = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

    oscillator.connect(gainNode);
    gainNode.connect(gainNodeRef.current);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.0);
  }, [initAudio]);

  // Sound: Level complete (victory jingle)
  const playLevelComplete = useCallback(() => {
    if (!enabledRef.current) return;
    // Classic victory fanfare
    const melody = [
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 659.25, dur: 0.15 }, // E5
      { freq: 783.99, dur: 0.15 }, // G5
      { freq: 1046.5, dur: 0.3 },  // C6
      { freq: 783.99, dur: 0.15 }, // G5
      { freq: 1046.5, dur: 0.4 },  // C6
    ];
    let time = 0;
    melody.forEach(note => {
      playTone(note.freq, note.dur, 'square', time);
      time += note.dur;
    });
  }, [playTone]);

  // Sound: Game over (sad descending)
  const playGameOver = useCallback(() => {
    if (!enabledRef.current) return;
    const notes = [
      { freq: 392, dur: 0.3 },   // G4
      { freq: 349.23, dur: 0.3 }, // F4
      { freq: 329.63, dur: 0.3 }, // E4
      { freq: 261.63, dur: 0.6 }, // C4
    ];
    let time = 0;
    notes.forEach(note => {
      playTone(note.freq, note.dur, 'triangle', time);
      time += note.dur * 0.9;
    });
  }, [playTone]);

  // Sound: Fruit collected (pleasant chime)
  const playFruitEat = useCallback(() => {
    if (!enabledRef.current) return;
    const notes = [784, 988, 1175]; // G5, B5, D6 - major chord arpeggio
    notes.forEach((freq, i) => {
      playTone(freq, 0.15, 'sine', i * 0.05);
    });
  }, [playTone]);

  // Sound: Game start (ready jingle)
  const playGameStart = useCallback(() => {
    if (!enabledRef.current) return;
    const melody = [
      { freq: 261.63, dur: 0.1 }, // C4
      { freq: 329.63, dur: 0.1 }, // E4
      { freq: 392, dur: 0.1 },    // G4
      { freq: 523.25, dur: 0.2 }, // C5
    ];
    let time = 0;
    melody.forEach(note => {
      playTone(note.freq, note.dur, 'square', time);
      time += note.dur;
    });
  }, [playTone]);

  // Sound: Frightened mode siren (looping wobble)
  const frightenedIntervalRef = useRef(null);
  const playFrightenedStart = useCallback(() => {
    if (!enabledRef.current) return;
    // Stop any existing frightened sound
    if (frightenedIntervalRef.current) {
      clearInterval(frightenedIntervalRef.current);
    }

    let toggle = false;
    frightenedIntervalRef.current = setInterval(() => {
      if (!enabledRef.current) return;
      const freq = toggle ? 220 : 277.18; // A3 and C#4
      playTone(freq, 0.15, 'square');
      toggle = !toggle;
    }, 200);
  }, [playTone]);

  const stopFrightenedSound = useCallback(() => {
    if (frightenedIntervalRef.current) {
      clearInterval(frightenedIntervalRef.current);
      frightenedIntervalRef.current = null;
    }
  }, []);

  // Sound: Extra life
  const playExtraLife = useCallback(() => {
    if (!enabledRef.current) return;
    const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6
    notes.forEach((freq, i) => {
      playTone(freq, 0.12, 'square', i * 0.1);
    });
  }, [playTone]);

  // Toggle sound on/off
  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled;
    if (!enabled) {
      stopFrightenedSound();
    }
  }, [stopFrightenedSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFrightenedSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopFrightenedSound]);

  return {
    initAudio,
    playDotEat,
    playPowerPellet,
    playGhostEat,
    playDeath,
    playLevelComplete,
    playGameOver,
    playFruitEat,
    playGameStart,
    playFrightenedStart,
    stopFrightenedSound,
    playExtraLife,
    setEnabled,
    isEnabled: () => enabledRef.current,
  };
}

export default useSoundManager;
