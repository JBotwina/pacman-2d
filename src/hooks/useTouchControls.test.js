import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTouchControls, isTouchDevice, isMobileDevice } from './useTouchControls';

describe('useTouchControls', () => {
  let containerRef;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    containerRef = { current: container };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize with null direction', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      expect(result.current.direction).toBeNull();
      expect(result.current.isTouching).toBe(false);
    });

    it('should provide handleDpadPress and handleDpadRelease functions', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      expect(typeof result.current.handleDpadPress).toBe('function');
      expect(typeof result.current.handleDpadRelease).toBe('function');
      expect(typeof result.current.clearDirection).toBe('function');
    });
  });

  describe('D-pad controls', () => {
    it('should set direction when handleDpadPress is called', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      act(() => {
        result.current.handleDpadPress('up');
      });

      expect(result.current.direction).toBe('up');
    });

    it('should handle all four directions', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      const directions = ['up', 'down', 'left', 'right'];
      directions.forEach((dir) => {
        act(() => {
          result.current.handleDpadPress(dir);
        });
        expect(result.current.direction).toBe(dir);
      });
    });

    it('should not set direction when disabled', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: false })
      );

      act(() => {
        result.current.handleDpadPress('up');
      });

      expect(result.current.direction).toBeNull();
    });

    it('should clear direction when clearDirection is called', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      act(() => {
        result.current.handleDpadPress('right');
      });
      expect(result.current.direction).toBe('right');

      act(() => {
        result.current.clearDirection();
      });
      expect(result.current.direction).toBeNull();
    });
  });

  describe('touch events', () => {
    const createTouchEvent = (type, clientX, clientY) => {
      return new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: [{ clientX, clientY, identifier: 0 }],
      });
    };

    it('should set isTouching to true on touchstart', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      act(() => {
        container.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      });

      expect(result.current.isTouching).toBe(true);
    });

    it('should set isTouching to false on touchend', () => {
      const { result } = renderHook(() =>
        useTouchControls({ containerRef, enabled: true })
      );

      act(() => {
        container.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      });
      expect(result.current.isTouching).toBe(true);

      act(() => {
        container.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      });
      expect(result.current.isTouching).toBe(false);
    });
  });

  describe('enabled state changes', () => {
    it('should respect enabled prop changes', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useTouchControls({ containerRef, enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.handleDpadPress('up');
      });
      expect(result.current.direction).toBe('up');

      rerender({ enabled: false });

      act(() => {
        result.current.handleDpadPress('down');
      });
      // Direction should remain 'up' since controls are disabled
      expect(result.current.direction).toBe('up');
    });
  });
});

describe('isTouchDevice', () => {
  it('should return boolean', () => {
    const result = isTouchDevice();
    expect(typeof result).toBe('boolean');
  });
});

describe('isMobileDevice', () => {
  it('should return boolean', () => {
    const result = isMobileDevice();
    expect(typeof result).toBe('boolean');
  });

  it('should return false for non-touch devices', () => {
    // In test environment, there's no touch support
    const result = isMobileDevice();
    expect(result).toBe(false);
  });
});
