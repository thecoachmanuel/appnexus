"use client";

import { useCallback, useRef } from "react";

type SoundType = "success" | "error" | "info" | "step" | "celebrate";

export const useNotificationSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioContext]);

  const playSuccess = useCallback(() => {
    // Pleasant ascending chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, "sine", 0.2), i * 100);
    });
  }, [playTone]);

  const playError = useCallback(() => {
    // Descending alert tone
    [400, 300].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "square", 0.15), i * 150);
    });
  }, [playTone]);

  const playInfo = useCallback(() => {
    playTone(600, 0.15, "sine", 0.2);
  }, [playTone]);

  const playStep = useCallback(() => {
    // Quick satisfying "pop" sound for step completion
    playTone(880, 0.08, "sine", 0.25);
    setTimeout(() => playTone(1100, 0.1, "sine", 0.15), 50);
  }, [playTone]);

  const playCelebrate = useCallback(() => {
    // Celebratory fanfare for final completion
    const notes = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 80 },   // E5
      { freq: 783.99, delay: 160 },  // G5
      { freq: 1046.5, delay: 240 },  // C6
      { freq: 783.99, delay: 400 },  // G5
      { freq: 1046.5, delay: 480 },  // C6
    ];
    
    notes.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 0.25, "sine", 0.2), delay);
    });
  }, [playTone]);

  const playSound = useCallback((type: SoundType) => {
    switch (type) {
      case "success":
        playSuccess();
        break;
      case "error":
        playError();
        break;
      case "info":
        playInfo();
        break;
      case "step":
        playStep();
        break;
      case "celebrate":
        playCelebrate();
        break;
    }
  }, [playSuccess, playError, playInfo, playStep, playCelebrate]);

  return { playSound, playSuccess, playError, playInfo, playStep, playCelebrate };
};
