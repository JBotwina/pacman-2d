# Tasks: Refactor State to Zustand

## 1. Setup
- [ ] 1.1 Install Zustand 5.0.9 (`npm install zustand@5.0.9`)
- [ ] 1.2 Create store directory structure (`src/store/`)

## 2. Create Game Store
- [ ] 2.1 Create `src/store/gameStore.js` with initial state shape
- [ ] 2.2 Migrate state properties from `createInitialState()` to store
- [ ] 2.3 Implement store actions: `startGame`, `pauseGame`, `resumeGame`, `resetGame`
- [ ] 2.4 Implement store actions: `setGameMode`, `updatePlayerPosition`, `updatePlayer2Position`
- [ ] 2.5 Implement `tick` action for game loop state updates

## 3. Migrate Components
- [ ] 3.1 Update `App.jsx` to use `useGameStore` instead of `useState`
- [ ] 3.2 Update `ScoreDisplay.jsx` to read from store directly
- [ ] 3.3 Update `ModeSelectScreen.jsx` to dispatch store actions
- [ ] 3.4 Update `StartScreen.jsx` to dispatch store actions
- [ ] 3.5 Update `PauseOverlay.jsx` to dispatch store actions
- [ ] 3.6 Update `GameOverScreen.jsx` to dispatch store actions
- [ ] 3.7 Update `LevelCompleteScreen.jsx` to dispatch store actions

## 4. Integrate Game Loop
- [ ] 4.1 Update `useGameLoop.js` to work with store actions
- [ ] 4.2 Ensure player movement hooks integrate with store

## 5. Cleanup
- [ ] 5.1 Remove unused state props and callbacks from components
- [ ] 5.2 Remove redundant state management code from App.jsx
- [ ] 5.3 Verify all game functionality works correctly

## 6. Validation
- [ ] 6.1 Test single-player mode end-to-end
- [ ] 6.2 Test two-player mode end-to-end
- [ ] 6.3 Test pause/resume functionality
- [ ] 6.4 Test game over and restart flow
- [ ] 6.5 Test high score persistence
