/**
 * Minimal test to verify setup.js mocks are working.
 */
import { describe, it, expect, vi } from 'vitest';
import { localStorageMock, mockCanvasContext } from './setup.js';

describe('Test Setup', () => {
  it('provides localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  it('provides requestAnimationFrame mock', () => {
    expect(typeof requestAnimationFrame).toBe('function');
    expect(typeof cancelAnimationFrame).toBe('function');
  });

  it('provides canvas context mock', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(typeof ctx.fillRect).toBe('function');
  });

  it('provides matchMedia mock', () => {
    expect(typeof matchMedia).toBe('function');
    const result = matchMedia('(min-width: 600px)');
    expect(result.matches).toBe(false);
  });

  it('provides ResizeObserver mock', () => {
    expect(typeof ResizeObserver).toBe('function');
    const observer = new ResizeObserver(() => {});
    expect(typeof observer.observe).toBe('function');
  });

  it('clears localStorage between tests', () => {
    // Previous test set 'test' key, but beforeEach should have cleared it
    expect(localStorage.getItem('test')).toBe(null);
  });
});
