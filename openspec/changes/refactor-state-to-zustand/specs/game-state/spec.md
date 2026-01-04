## ADDED Requirements

### Requirement: Centralized Game Store
The game SHALL use a Zustand store as the single source of truth for all game state.

#### Scenario: Store initialization
- **WHEN** the application loads
- **THEN** the game store SHALL be initialized with default state matching the current `createInitialState()` shape

#### Scenario: Store access from components
- **WHEN** a component needs game state
- **THEN** it SHALL access state via the `useGameStore` hook with selectors

### Requirement: Store Actions
The game store SHALL expose actions for all state mutations.

#### Scenario: Game lifecycle actions
- **WHEN** the game needs to start, pause, resume, or reset
- **THEN** components SHALL call the corresponding store action (`startGame`, `pauseGame`, `resumeGame`, `resetGame`)

#### Scenario: Game mode selection
- **WHEN** the player selects 1P or 2P mode
- **THEN** components SHALL call `setGameMode` store action

#### Scenario: Game loop tick
- **WHEN** the game loop fires
- **THEN** it SHALL call the `tick` action with deltaTime to update game state

### Requirement: Pure Function Integration
The store actions SHALL delegate to existing pure functions in `src/game/GameState.js`.

#### Scenario: State update delegation
- **WHEN** a store action is called
- **THEN** it SHALL call the corresponding pure function and update state with the result

#### Scenario: Pure function preservation
- **WHEN** refactoring to Zustand
- **THEN** pure functions in `GameState.js` SHALL remain unchanged and testable in isolation

### Requirement: Component Prop Elimination
Components SHALL NOT receive game state or callbacks as props for state managed by the store.

#### Scenario: Direct store access
- **WHEN** a component needs to read score, lives, or game status
- **THEN** it SHALL use `useGameStore` selectors instead of props

#### Scenario: Direct action dispatch
- **WHEN** a component needs to trigger a game action
- **THEN** it SHALL call the store action directly instead of receiving a callback prop
