import { useEffect, useRef } from 'react';
import { TimerMode } from '../types';

interface UseMediaSessionProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  subjectName?: string;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
}

export function useMediaSession({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  subjectName,
  onPlay,
  onPause,
  onSkip,
}: UseMediaSessionProps) {
  // Silent audio element to keep media session active in lock screens
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize silent loop audio element for Android Lock Screen presence
  useEffect(() => {
    // 1-second silent WAV base64
    const silentWav =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    const audio = new Audio(silentWav);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Control silent audio playback when timer runs
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isRunning) {
      audio.play().catch(() => {
        // User gesture required before first play
      });
    } else {
      audio.pause();
    }
  }, [isRunning]);

  // Update MediaSession API metadata & action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const titlePrefix = mode === 'focus' ? 'Deep Work' : 'Break Time';
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${formatted} - ${titlePrefix}`,
      artist: subjectName ? `Subject: ${subjectName}` : 'PomoStudy Tracker',
      album: isRunning ? 'Timer Running' : 'Timer Paused',
      artwork: [
        { src: '/pomo-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/pomo-icon.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    });

    navigator.mediaSession.playbackState = isRunning ? 'playing' : 'paused';

    if ('setPositionState' in navigator.mediaSession && totalDuration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: totalDuration,
          playbackRate: isRunning ? 1 : 0,
          position: Math.min(totalDuration, Math.max(0, totalDuration - timeLeft)),
        });
      } catch {
        // Position state edge cases
      }
    }

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => onPlay());
    navigator.mediaSession.setActionHandler('pause', () => onPause());
    navigator.mediaSession.setActionHandler('nexttrack', () => onSkip());
    navigator.mediaSession.setActionHandler('previoustrack', () => onSkip());

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
    };
  }, [mode, timeLeft, totalDuration, isRunning, subjectName, onPlay, onPause, onSkip]);
}
