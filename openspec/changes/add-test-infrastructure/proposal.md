# Change: Add Full-Stack Testing Infrastructure

## Why
The project currently has no automated testing. Manual browser testing is error-prone and doesn't catch regressions. The game logic in `src/game/` consists of pure functions that are ideal for unit testing, and the UI screens need component testing to ensure they render correctly.

## What Changes
- Install Vitest for unit and component testing (integrates with Vite)
- Install React Testing Library for component tests
- Install Playwright for E2E browser tests
- Add test configuration files (`vitest.config.js`, `playwright.config.js`)
- Create test setup with mocks for Canvas, localStorage, and requestAnimationFrame
- Add npm scripts for running tests
- Create initial test suites for game logic, components, and E2E flows

## Impact
- Affected specs: NEW `testing` capability
- Affected code:
  - `package.json` (new dependencies and scripts)
  - NEW `vitest.config.js`
  - NEW `playwright.config.js`
  - NEW `src/test/setup.js`
  - NEW `src/test/test-utils.jsx`
  - NEW `src/game/__tests__/*.test.js`
  - NEW `src/components/__tests__/*.test.jsx`
  - NEW `src/store/__tests__/*.test.js`
  - NEW `src/hooks/__tests__/*.test.js`
  - NEW `e2e/*.spec.js`
