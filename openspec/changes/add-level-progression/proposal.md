# Proposal: Add Level Progression System

## Summary
Add a level progression system (levels 1-5) with a "Game Complete" screen after level 5. Currently, the game resets to level 1 when completing a level instead of advancing.

## Problem
When a player collects all dots and the `LevelCompleteScreen` appears, clicking "NEXT LEVEL" calls `resetGame()` which always returns to level 1, losing all progress. The game has a `level` field in state but no mechanism to increment it.

## Solution
1. Add a `nextLevel()` function that increments the level while preserving score, lives, and high score
2. Define `MAX_LEVEL = 5` constant
3. Add a `GAME_COMPLETE` status for when level 5 is finished
4. Create a `GameCompleteScreen` component for the victory state
5. Update `LevelCompleteScreen` to call `nextLevel()` instead of `resetGame()`

## Scope
- **In scope**: Level advancement, game complete state, UI for victory
- **Out of scope**: Difficulty scaling (separate change), maze variations, new ghost behaviors

## Files Affected
| File | Change |
|------|--------|
| `src/game/GameState.js` | Add `nextLevel()`, `MAX_LEVEL`, `GAME_COMPLETE` status |
| `src/store/gameStore.js` | Add `nextLevel` action |
| `src/components/LevelCompleteScreen.jsx` | Use `nextLevel()` instead of `resetGame()` |
| `src/components/GameCompleteScreen.jsx` | New component for victory screen |
| `src/App.jsx` | Render `GameCompleteScreen` when status is `GAME_COMPLETE` |

## Risks
- Low risk: Changes are additive, existing behavior preserved for levels 1-4
- Testing: Manual verification of level transitions needed
