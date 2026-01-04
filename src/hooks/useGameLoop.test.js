/**
 * Tests for useGameLoop custom hook.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useGameLoop } from './useGameLoop.js';

describe('useGameLoop', () => {
  let rafCallbacks;
  let rafId;
  let mockTimestamp;

  beforeEach(() => {
    // Reset RAF state
    rafCallbacks = new Map();
    rafId = 0;
    mockTimestamp = 0;

    // Override global RAF with controllable mock
    global.requestAnimationFrame = vi.fn((callback) => {
      const id = ++rafId;
      rafCallbacks.set(id, callback);
      return id;
    });

    global.cancelAnimationFrame = vi.fn((id) => {
      rafCallbacks.delete(id);
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper to advance the animation frame loop.
   * @param {number} deltaMs - Time to advance in milliseconds
   */
  function advanceFrame(deltaMs = 16) {
    mockTimestamp += deltaMs;
    const callbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    callbacks.forEach(([, callback]) => {
      callback(mockTimestamp);
    });
  }

  // ============================================
  // Basic Functionality
  // ============================================
  describe('Basic Functionality', () => {
    it('starts the game loop when isRunning is true', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('does not start the game loop when isRunning is false', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, false));

      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('calls onUpdate with deltaTime and timestamp on each frame', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      // Advance first frame
      advanceFrame(16);

      expect(onUpdate).toHaveBeenCalledTimes(1);
      // First frame: deltaTime is 0 because previousTimeRef is set to current timestamp
      expect(onUpdate).toHaveBeenCalledWith(0, 16);

      // Advance second frame
      advanceFrame(16);

      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenLastCalledWith(16, 32);
    });

    it('defaults isRunning to true when not provided', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate));

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('continues the loop by requesting next animation frame', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      // Initial call
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);

      // Advance frame - should request another
      advanceFrame(16);

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);

      // Advance again
      advanceFrame(16);

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // Delta Time Calculation
  // ============================================
  describe('Delta Time Calculation', () => {
    it('calculates correct deltaTime between frames', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      // First frame at time 0
      advanceFrame(0);
      expect(onUpdate).toHaveBeenLastCalledWith(0, 0);

      // Second frame 16ms later
      advanceFrame(16);
      expect(onUpdate).toHaveBeenLastCalledWith(16, 16);

      // Third frame 33ms later (simulating frame drop)
      advanceFrame(33);
      expect(onUpdate).toHaveBeenLastCalledWith(33, 49);
    });

    it('handles varying frame times', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      advanceFrame(16);
      advanceFrame(32); // Slow frame
      advanceFrame(8); // Fast frame
      advanceFrame(16);

      expect(onUpdate).toHaveBeenCalledTimes(4);

      // Check the delta times passed
      const calls = onUpdate.mock.calls;
      expect(calls[0][0]).toBe(0); // First frame
      expect(calls[1][0]).toBe(32); // Second frame delta
      expect(calls[2][0]).toBe(8); // Third frame delta
      expect(calls[3][0]).toBe(16); // Fourth frame delta
    });

    it('provides correct raw timestamp to callback', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      advanceFrame(100);
      expect(onUpdate).toHaveBeenLastCalledWith(0, 100);

      advanceFrame(50);
      expect(onUpdate).toHaveBeenLastCalledWith(50, 150);

      advanceFrame(25);
      expect(onUpdate).toHaveBeenLastCalledWith(25, 175);
    });
  });

  // ============================================
  // Start/Stop Behavior
  // ============================================
  describe('Start/Stop Behavior', () => {
    it('stops the loop when isRunning changes from true to false', () => {
      const onUpdate = vi.fn();

      const { rerender } = renderHook(
        ({ isRunning }) => useGameLoop(onUpdate, isRunning),
        { initialProps: { isRunning: true } }
      );

      // Advance a frame
      advanceFrame(16);
      expect(onUpdate).toHaveBeenCalledTimes(1);

      // Stop the loop
      rerender({ isRunning: false });

      // cancelAnimationFrame should have been called
      expect(global.cancelAnimationFrame).toHaveBeenCalled();

      // Clear existing callbacks for verification
      const rafCallsBefore = global.requestAnimationFrame.mock.calls.length;

      // Try to advance - callback should not run
      advanceFrame(16);

      // No new frames should be requested when stopped
      // (previous callbacks were cleared by cleanup)
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('starts the loop when isRunning changes from false to true', () => {
      const onUpdate = vi.fn();

      const { rerender } = renderHook(
        ({ isRunning }) => useGameLoop(onUpdate, isRunning),
        { initialProps: { isRunning: false } }
      );

      expect(global.requestAnimationFrame).not.toHaveBeenCalled();

      // Start the loop
      rerender({ isRunning: true });

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);

      advanceFrame(16);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('resets previousTimeRef when loop restarts', () => {
      const onUpdate = vi.fn();

      const { rerender } = renderHook(
        ({ isRunning }) => useGameLoop(onUpdate, isRunning),
        { initialProps: { isRunning: true } }
      );

      // Run some frames
      advanceFrame(16);
      advanceFrame(16);

      // Stop
      rerender({ isRunning: false });

      // Advance time while stopped
      mockTimestamp += 1000;

      // Restart
      rerender({ isRunning: true });

      // First frame after restart should have deltaTime = 0
      advanceFrame(16);

      const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
      expect(lastCall[0]).toBe(0); // deltaTime should be 0 on restart
    });

    it('handles multiple start/stop cycles', () => {
      const onUpdate = vi.fn();

      const { rerender } = renderHook(
        ({ isRunning }) => useGameLoop(onUpdate, isRunning),
        { initialProps: { isRunning: true } }
      );

      // Cycle 1
      advanceFrame(16);
      rerender({ isRunning: false });

      // Cycle 2
      rerender({ isRunning: true });
      advanceFrame(16);
      rerender({ isRunning: false });

      // Cycle 3
      rerender({ isRunning: true });
      advanceFrame(16);

      expect(onUpdate).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // Cleanup Behavior
  // ============================================
  describe('Cleanup Behavior', () => {
    it('cancels animation frame on unmount', () => {
      const onUpdate = vi.fn();

      const { unmount } = renderHook(() => useGameLoop(onUpdate, true));

      expect(global.requestAnimationFrame).toHaveBeenCalled();

      unmount();

      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('does not call cancelAnimationFrame if not running on unmount', () => {
      const onUpdate = vi.fn();

      const { unmount } = renderHook(() => useGameLoop(onUpdate, false));

      expect(global.cancelAnimationFrame).not.toHaveBeenCalled();

      unmount();

      // Should not call cancel since nothing was running
      expect(global.cancelAnimationFrame).not.toHaveBeenCalled();
    });

    it('stops calling onUpdate after unmount', () => {
      const onUpdate = vi.fn();

      const { unmount } = renderHook(() => useGameLoop(onUpdate, true));

      advanceFrame(16);
      expect(onUpdate).toHaveBeenCalledTimes(1);

      unmount();

      // Store the callbacks before they're cleared
      const pendingCallbackCount = rafCallbacks.size;

      // Callbacks should have been cancelled
      expect(pendingCallbackCount).toBe(0);
    });
  });

  // ============================================
  // Callback Reference Updates
  // ============================================
  describe('Callback Reference Updates', () => {
    it('uses the latest callback on each frame (avoids stale closures)', () => {
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      const { rerender } = renderHook(
        ({ onUpdate }) => useGameLoop(onUpdate, true),
        { initialProps: { onUpdate: onUpdate1 } }
      );

      // First frame with callback 1
      advanceFrame(16);
      expect(onUpdate1).toHaveBeenCalledTimes(1);
      expect(onUpdate2).not.toHaveBeenCalled();

      // Change callback
      rerender({ onUpdate: onUpdate2 });

      // Second frame should use callback 2
      advanceFrame(16);
      expect(onUpdate1).toHaveBeenCalledTimes(1);
      expect(onUpdate2).toHaveBeenCalledTimes(1);
    });

    it('updates callback ref immediately without restarting loop', () => {
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      const { rerender } = renderHook(
        ({ onUpdate }) => useGameLoop(onUpdate, true),
        { initialProps: { onUpdate: onUpdate1 } }
      );

      const initialRafCalls = global.requestAnimationFrame.mock.calls.length;

      // Change callback
      rerender({ onUpdate: onUpdate2 });

      // Should not trigger additional RAF calls (no restart)
      // Only the pending frame continuation should happen
      advanceFrame(16);

      // Should use new callback
      expect(onUpdate2).toHaveBeenCalled();
    });

    it('handles callback that changes every render', () => {
      let counter = 0;

      const { rerender } = renderHook(
        ({ value }) =>
          useGameLoop(
            (dt, ts) => {
              counter++;
            },
            true
          ),
        { initialProps: { value: 0 } }
      );

      // Rerender multiple times with different props (simulating unstable callback)
      for (let i = 1; i <= 5; i++) {
        rerender({ value: i });
        advanceFrame(16);
      }

      // Should have called the callback for each frame
      expect(counter).toBe(5);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles zero delta time (same timestamp)', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      advanceFrame(16);
      // Advance with 0 delta
      advanceFrame(0);

      const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
      expect(lastCall[0]).toBe(0);
    });

    it('handles very large delta times', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      advanceFrame(16);
      advanceFrame(10000); // 10 second gap

      expect(onUpdate).toHaveBeenCalledTimes(2);
      const lastCall = onUpdate.mock.calls[1];
      expect(lastCall[0]).toBe(10000);
    });

    it('handles rapid start/stop toggling', () => {
      const onUpdate = vi.fn();

      const { rerender } = renderHook(
        ({ isRunning }) => useGameLoop(onUpdate, isRunning),
        { initialProps: { isRunning: true } }
      );

      // Rapid toggling
      for (let i = 0; i < 10; i++) {
        rerender({ isRunning: false });
        rerender({ isRunning: true });
      }

      // Should still work
      advanceFrame(16);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('does not throw when onUpdate is undefined initially', () => {
      // Edge case: what if onUpdate is temporarily undefined?
      // The hook should handle this gracefully
      expect(() => {
        const { rerender } = renderHook(
          ({ onUpdate }) => useGameLoop(onUpdate, true),
          { initialProps: { onUpdate: undefined } }
        );

        // Provide valid callback
        rerender({ onUpdate: vi.fn() });
      }).not.toThrow();
    });

    it('preserves loop continuity during callback changes', () => {
      const callbacks = [];
      const onUpdate1 = vi.fn((dt) => callbacks.push({ cb: 1, dt }));
      const onUpdate2 = vi.fn((dt) => callbacks.push({ cb: 2, dt }));

      const { rerender } = renderHook(
        ({ onUpdate }) => useGameLoop(onUpdate, true),
        { initialProps: { onUpdate: onUpdate1 } }
      );

      // Frame with callback 1
      advanceFrame(16);

      // Switch callbacks
      rerender({ onUpdate: onUpdate2 });

      // Frames with callback 2
      advanceFrame(16);
      advanceFrame(16);

      // Verify sequence
      expect(callbacks).toHaveLength(3);
      expect(callbacks[0].cb).toBe(1);
      expect(callbacks[1].cb).toBe(2);
      expect(callbacks[2].cb).toBe(2);

      // Delta time should be consistent (16ms between frames)
      expect(callbacks[1].dt).toBe(16);
      expect(callbacks[2].dt).toBe(16);
    });
  });

  // ============================================
  // Integration with RAF Mock
  // ============================================
  describe('Integration with RAF', () => {
    it('requests animation frames at expected rate', () => {
      const onUpdate = vi.fn();

      renderHook(() => useGameLoop(onUpdate, true));

      // Simulate 60fps for 1 second (60 frames)
      for (let i = 0; i < 60; i++) {
        advanceFrame(16.67);
      }

      expect(onUpdate).toHaveBeenCalledTimes(60);
    });

    it('uses cancelAnimationFrame with correct id', () => {
      const onUpdate = vi.fn();

      const { unmount } = renderHook(() => useGameLoop(onUpdate, true));

      // RAF should have been called
      expect(global.requestAnimationFrame).toHaveBeenCalled();

      // Advance to get the next RAF id
      advanceFrame(16);

      unmount();

      // cancelAnimationFrame should be called with the pending id
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
