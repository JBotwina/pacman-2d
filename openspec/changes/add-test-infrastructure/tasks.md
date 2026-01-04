## 1. Core Setup
- [ ] 1.1 Install test dependencies (vitest, @vitest/ui, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @playwright/test)
- [ ] 1.2 Create `vitest.config.js` with jsdom environment and coverage settings
- [ ] 1.3 Create `playwright.config.js` with multi-browser and dev server config
- [ ] 1.4 Create `src/test/setup.js` with mocks (canvas, localStorage, requestAnimationFrame)
- [ ] 1.5 Create `src/test/test-utils.jsx` with custom render helpers
- [ ] 1.6 Add npm scripts to `package.json` (test, test:ui, test:run, test:coverage, test:e2e, test:all)

## 2. Unit Tests - Game Logic
- [ ] 2.1 Create `src/game/__tests__/GameState.test.js` (game lifecycle, state transitions)
- [ ] 2.2 Create `src/game/__tests__/Collision.test.js` (coordinate conversion, wall detection)
- [ ] 2.3 Create `src/game/__tests__/Dots.test.js` (dot creation, collection, completion)
- [ ] 2.4 Create `src/game/__tests__/Fruit.test.js` (spawn logic, collection)
- [ ] 2.5 Create `src/game/__tests__/GhostAI.test.js` (targeting, mode transitions)

## 3. Store and Hook Tests
- [ ] 3.1 Create `src/store/__tests__/gameStore.test.js` (Zustand actions, state updates)
- [ ] 3.2 Create `src/hooks/__tests__/useGameLoop.test.js` (RAF behavior)
- [ ] 3.3 Create `src/hooks/__tests__/usePlayerMovement.test.js` (grid movement)

## 4. Component Tests
- [ ] 4.1 Create `src/components/__tests__/ScoreDisplay.test.jsx`
- [ ] 4.2 Create `src/components/__tests__/GameOverScreen.test.jsx`
- [ ] 4.3 Create `src/components/__tests__/ModeSelectScreen.test.jsx`
- [ ] 4.4 Create `src/components/__tests__/StartScreen.test.jsx`

## 5. E2E Tests
- [ ] 5.1 Install Playwright browsers (`npx playwright install`)
- [ ] 5.2 Create `e2e/mode-selection.spec.js` (1P/2P selection)
- [ ] 5.3 Create `e2e/game-flow.spec.js` (start, pause, game over)
- [ ] 5.4 Create `e2e/keyboard-controls.spec.js` (SDFE and IJKL inputs)

## 6. Verification
- [ ] 6.1 Run `npm run test:run` and verify all unit/component tests pass
- [ ] 6.2 Run `npm run test:e2e` and verify E2E tests pass
- [ ] 6.3 Run `npm run test:coverage` and review coverage report
