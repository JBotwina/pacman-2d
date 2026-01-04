/**
 * Vitest global test setup file.
 * Provides mocks for browser APIs used by the Pacman game.
 */

import '@testing-library/jest-dom';

// ============================================
// requestAnimationFrame / cancelAnimationFrame
// ============================================
// Used by useGameLoop for the game loop

let rafId = 0;
const rafCallbacks = new Map();

global.requestAnimationFrame = vi.fn((callback) => {
  const id = ++rafId;
  rafCallbacks.set(id, callback);
  // Schedule callback with a fake timestamp
  setTimeout(() => {
    if (rafCallbacks.has(id)) {
      rafCallbacks.delete(id);
      callback(performance.now());
    }
  }, 16); // ~60fps
  return id;
});

global.cancelAnimationFrame = vi.fn((id) => {
  rafCallbacks.delete(id);
});

// ============================================
// localStorage
// ============================================
// Used by gameStore for high score persistence

const localStorageStore = new Map();

const localStorageMock = {
  getItem: vi.fn((key) => localStorageStore.get(key) ?? null),
  setItem: vi.fn((key, value) => localStorageStore.set(key, String(value))),
  removeItem: vi.fn((key) => localStorageStore.delete(key)),
  clear: vi.fn(() => localStorageStore.clear()),
  get length() {
    return localStorageStore.size;
  },
  key: vi.fn((index) => {
    const keys = Array.from(localStorageStore.keys());
    return keys[index] ?? null;
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================
// matchMedia
// ============================================
// May be used for responsive design queries

global.matchMedia = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// ============================================
// ResizeObserver
// ============================================
// May be used for canvas sizing

class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock;

// ============================================
// Canvas 2D Context
// ============================================
// Used by App.jsx for game rendering

const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  // Drawing methods
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  rect: vi.fn(),
  // Text methods
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  // Transform methods
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  // Image methods
  drawImage: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  putImageData: vi.fn(),
  // Path methods
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  isPointInStroke: vi.fn(() => false),
  // Gradient/Pattern
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createPattern: vi.fn(() => null),
};

HTMLCanvasElement.prototype.getContext = vi.fn(function (contextType) {
  if (contextType === '2d') {
    return mockCanvasContext;
  }
  return null;
});

// ============================================
// Performance API
// ============================================
// Ensure performance.now() is available for timestamps

if (typeof global.performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
  };
}

// ============================================
// Test Lifecycle Hooks
// ============================================

beforeEach(() => {
  // Clear localStorage between tests
  localStorageStore.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();

  // Clear RAF callbacks
  rafCallbacks.clear();
  rafId = 0;

  // Reset canvas context mocks
  Object.values(mockCanvasContext).forEach((value) => {
    if (typeof value?.mockClear === 'function') {
      value.mockClear();
    }
  });
});

// ============================================
// Exports for test utilities
// ============================================

export { localStorageMock, mockCanvasContext };
