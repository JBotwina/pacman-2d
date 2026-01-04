## ADDED Requirements

### Requirement: Unit Test Framework
The project SHALL provide a unit testing framework using Vitest.

#### Scenario: Run unit tests
- **WHEN** developer runs `npm run test`
- **THEN** Vitest executes all `*.test.js` and `*.test.jsx` files in `src/`

#### Scenario: Watch mode
- **WHEN** developer runs `npm run test` without arguments
- **THEN** Vitest runs in watch mode, re-running tests on file changes

#### Scenario: Single run
- **WHEN** developer runs `npm run test:run`
- **THEN** Vitest executes all tests once and exits with appropriate status code

### Requirement: Test Coverage Reporting
The project SHALL provide code coverage reporting.

#### Scenario: Generate coverage report
- **WHEN** developer runs `npm run test:coverage`
- **THEN** coverage report is generated in text, JSON, and HTML formats
- **AND** coverage excludes test files, setup files, and entry points

### Requirement: Component Testing
The project SHALL provide React component testing using React Testing Library.

#### Scenario: Render component
- **WHEN** a component test imports from `@testing-library/react`
- **THEN** components can be rendered with `render()`
- **AND** DOM queries are available (`screen.getByText`, etc.)

#### Scenario: DOM assertions
- **WHEN** a test uses jest-dom matchers
- **THEN** assertions like `toBeInTheDocument()`, `toHaveTextContent()` are available

### Requirement: Browser Mocking
The project SHALL mock browser APIs not available in jsdom.

#### Scenario: Canvas context mock
- **WHEN** code calls `canvas.getContext('2d')`
- **THEN** a mock context object is returned with standard drawing methods

#### Scenario: localStorage mock
- **WHEN** code accesses `localStorage.getItem()` or `localStorage.setItem()`
- **THEN** operations work with an in-memory store that resets between tests

#### Scenario: requestAnimationFrame mock
- **WHEN** code calls `requestAnimationFrame(callback)`
- **THEN** the callback is scheduled via setTimeout for predictable test timing

### Requirement: E2E Testing
The project SHALL provide end-to-end testing using Playwright.

#### Scenario: Run E2E tests
- **WHEN** developer runs `npm run test:e2e`
- **THEN** Playwright launches browsers and executes tests in `e2e/` directory

#### Scenario: Multi-browser testing
- **WHEN** E2E tests run in CI
- **THEN** tests execute in Chromium, Firefox, and WebKit

#### Scenario: Dev server integration
- **WHEN** E2E tests start
- **THEN** Playwright automatically starts the Vite dev server on localhost:5173

### Requirement: Game Logic Unit Tests
The project SHALL have unit tests for pure game logic functions.

#### Scenario: GameState tests
- **WHEN** running unit tests
- **THEN** `src/game/__tests__/GameState.test.js` verifies game lifecycle and state transitions

#### Scenario: Collision tests
- **WHEN** running unit tests
- **THEN** `src/game/__tests__/Collision.test.js` verifies coordinate conversion and wall detection

#### Scenario: GhostAI tests
- **WHEN** running unit tests
- **THEN** `src/game/__tests__/GhostAI.test.js` verifies ghost targeting and mode transitions

### Requirement: E2E User Flow Tests
The project SHALL have E2E tests for critical user flows.

#### Scenario: Mode selection test
- **WHEN** E2E tests run
- **THEN** `e2e/mode-selection.spec.js` verifies 1P and 2P mode selection works

#### Scenario: Game flow test
- **WHEN** E2E tests run
- **THEN** `e2e/game-flow.spec.js` verifies game start, pause, and navigation flows
