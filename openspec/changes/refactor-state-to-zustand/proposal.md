# Change: Refactor Game State to Zustand

## Why
The current game state management uses React's `useState` with a large monolithic state object passed through callback chains. This leads to:
- Complex callback prop drilling for state updates
- Difficult-to-trace state mutations across components
- No middleware support for debugging or persistence
- All state logic concentrated in `App.jsx`

Zustand provides a simpler, more scalable approach with direct store access, middleware support, and better separation of concerns.

## What Changes
- Add Zustand 5.0.9 as a dependency
- Create a centralized game store (`src/store/gameStore.js`)
- Migrate state from `useState` in App.jsx to Zustand store
- Replace callback props with direct store actions
- Move game state logic (start, pause, reset, etc.) into store actions
- Remove state-related prop drilling from components

## Impact
- Affected specs: game-state (new capability spec)
- Affected code:
  - `src/App.jsx` - Remove useState, use store hooks
  - `src/components/*.jsx` - Replace props with useGameStore
  - `src/game/GameState.js` - Keep pure functions, integrate with store
  - `src/hooks/useGameLoop.js` - May simplify with direct store access
  - `package.json` - Add zustand dependency
