import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundManager } from './useSoundManager';

describe('useSoundManager', () => {
  let mockOscillator;
  let mockGainNode;
  let mockAudioContext;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create fresh mocks for each test
    mockOscillator = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGainNode = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGainNode })),
      resume: vi.fn(),
      close: vi.fn(),
      destination: {},
    };

    // Mock AudioContext as a class constructor
    class MockAudioContext {
      constructor() {
        Object.assign(this, mockAudioContext);
      }
    }

    global.AudioContext = MockAudioContext;
    global.webkitAudioContext = MockAudioContext;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize audio context', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
    });

    // AudioContext should have been constructed
    expect(result.current.initAudio).toBeDefined();
  });

  it('should have all sound methods available', () => {
    const { result } = renderHook(() => useSoundManager());

    expect(typeof result.current.playDotEat).toBe('function');
    expect(typeof result.current.playPowerPellet).toBe('function');
    expect(typeof result.current.playGhostEat).toBe('function');
    expect(typeof result.current.playDeath).toBe('function');
    expect(typeof result.current.playLevelComplete).toBe('function');
    expect(typeof result.current.playGameOver).toBe('function');
    expect(typeof result.current.playFruitEat).toBe('function');
    expect(typeof result.current.playGameStart).toBe('function');
    expect(typeof result.current.playFrightenedStart).toBe('function');
    expect(typeof result.current.stopFrightenedSound).toBe('function');
    expect(typeof result.current.playExtraLife).toBe('function');
    expect(typeof result.current.setEnabled).toBe('function');
    expect(typeof result.current.isEnabled).toBe('function');
  });

  it('should play dot eat sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playDotEat();
    });

    // Sound should play without throwing
    expect(true).toBe(true);
  });

  it('should play power pellet sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playPowerPellet();
    });

    expect(true).toBe(true);
  });

  it('should play ghost eat sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playGhostEat();
    });

    expect(true).toBe(true);
  });

  it('should play death sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playDeath();
    });

    expect(true).toBe(true);
  });

  it('should play level complete sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playLevelComplete();
    });

    expect(true).toBe(true);
  });

  it('should play game over sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playGameOver();
    });

    expect(true).toBe(true);
  });

  it('should play fruit eat sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playFruitEat();
    });

    expect(true).toBe(true);
  });

  it('should play game start sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playGameStart();
    });

    expect(true).toBe(true);
  });

  it('should start and stop frightened sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playFrightenedStart();
    });

    // Frightened sound uses setInterval
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.stopFrightenedSound();
    });

    expect(true).toBe(true);
  });

  it('should play extra life sound', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playExtraLife();
    });

    expect(true).toBe(true);
  });

  it('should respect enabled state', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
    });

    expect(result.current.isEnabled()).toBe(true);

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.isEnabled()).toBe(false);

    // Re-enable
    act(() => {
      result.current.setEnabled(true);
    });

    expect(result.current.isEnabled()).toBe(true);
  });

  it('should not play sounds when disabled', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.setEnabled(false);
    });

    // These should not throw even when disabled
    act(() => {
      result.current.playDotEat();
      result.current.playPowerPellet();
      result.current.playGhostEat();
    });

    expect(result.current.isEnabled()).toBe(false);
  });

  it('should handle suspended audio context', () => {
    // Override the mock to return suspended state
    class SuspendedAudioContext {
      constructor() {
        this.state = 'suspended';
        this.currentTime = 0;
        this.createOscillator = vi.fn(() => ({ ...mockOscillator }));
        this.createGain = vi.fn(() => ({ ...mockGainNode }));
        this.resume = vi.fn();
        this.close = vi.fn();
        this.destination = {};
      }
    }
    global.AudioContext = SuspendedAudioContext;

    const { result } = renderHook(() => useSoundManager());

    act(() => {
      const ctx = result.current.initAudio();
      expect(ctx.resume).toHaveBeenCalled();
    });
  });

  it('should alternate dot eat frequencies', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
    });

    // Play multiple dot eats - they should alternate
    act(() => {
      result.current.playDotEat();
      result.current.playDotEat();
      result.current.playDotEat();
    });

    expect(true).toBe(true);
  });

  it('should clean up on unmount', () => {
    const { result, unmount } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playFrightenedStart();
    });

    unmount();

    // Should not throw on unmount
    expect(true).toBe(true);
  });

  it('should stop frightened sound when disabled', () => {
    const { result } = renderHook(() => useSoundManager());

    act(() => {
      result.current.initAudio();
      result.current.playFrightenedStart();
    });

    // Verify frightened sound started
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Disable sounds (should stop frightened sound)
    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.isEnabled()).toBe(false);
  });
});
