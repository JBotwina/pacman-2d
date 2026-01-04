# Design: Refactor State to Zustand

## Context
The Pac-Man game currently manages all state in `App.jsx` using React's `useState` hook. The state object is large (~25 properties) and updates flow through callback chains. Components receive state and callbacks as props.

Zustand 5.0.9 is the target version (latest stable as of January 2025).

## Goals / Non-Goals
**Goals:**
- Centralize game state in a single Zustand store
- Simplify component APIs by removing prop drilling
- Maintain all existing game functionality
- Keep pure game logic functions in `src/game/` unchanged

**Non-Goals:**
- Adding new game features
- Changing game mechanics or timing
- Adding persistence middleware (beyond existing localStorage high score)
- TypeScript migration

## Decisions

### Store Structure
Single store with flat state matching current `createInitialState()` shape:

```javascript
// src/store/gameStore.js
import { create } from 'zustand';
import { createInitialState, updateGameState, ... } from '../game/GameState';

const useGameStore = create((set, get) => ({
  // State (spread from createInitialState)
  ...createInitialState(),

  // Actions
  startGame: () => set(state => startGame(state)),
  pauseGame: () => set(state => pauseGame(state)),
  resetGame: () => set(() => createInitialState(get().highScore)),
  tick: (deltaTime) => set(state => updateGameState(state, deltaTime)),
  // ... other actions
}));
```

**Rationale:** Flat structure maintains compatibility with existing pure functions in `GameState.js`. No need for nested slices given the game's scope.

### Reuse Existing Pure Functions
Keep `src/game/GameState.js` pure functions unchanged. Store actions wrap these functions:

```javascript
// Store action wraps pure function
startGame: () => set(state => startGame(state))
```

**Rationale:** Preserves testability and separation of concerns. Pure functions can still be unit tested without store.

### Component Access Pattern
Components use selector hooks for targeted subscriptions:

```javascript
// In component
const score = useGameStore(state => state.score);
const startGame = useGameStore(state => state.startGame);
```

**Rationale:** Zustand's selector pattern prevents unnecessary re-renders.

### High Score Persistence
Keep existing `localStorage` approach in `App.jsx`. Can later migrate to Zustand's `persist` middleware if desired.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking game loop timing | Test thoroughly; keep `useGameLoop` logic intact |
| Re-render performance regression | Use selectors to limit subscriptions |
| Player movement desync | Ensure movement hooks update store atomically |

## Migration Plan

1. **Install Zustand** - Add dependency, no code changes
2. **Create store** - New file, parallel to existing state
3. **Migrate App.jsx** - Replace useState with store
4. **Update components** - One at a time, test after each
5. **Remove dead code** - Clean up unused props/callbacks

**Rollback:** Git revert to pre-Zustand commit. No data migration needed.

## Open Questions
- Should `usePlayerMovement` hook manage its own state or use the store?
  - **Recommendation:** Keep local for now; player position syncs to store on each tick
