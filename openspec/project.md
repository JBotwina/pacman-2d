# Project Context

## Purpose
A browser-based Pac-Man clone with single-player and two-player cooperative modes. Features classic arcade gameplay with ghosts, power pellets, bonus fruit, and neon-glow visual styling.

## Tech Stack
- React 19 (functional components, hooks)
- Vite 7 (dev server, build tooling)
- Canvas API (game rendering)
- ESLint (code quality)
- Vanilla CSS (styling)

## Project Conventions

### Code Style
- Functional React components only (no class components)
- Custom hooks for reusable logic (`useGameLoop`, `usePlayerMovement`)
- Pure functions for game state updates (immutable state pattern)
- SDFE keys for Player 1, IJKL for Player 2 movement
- Constants defined at module level with SCREAMING_SNAKE_CASE

### Architecture Patterns
- **State management**: React useState with immutable updates
- **Game loop**: Custom `useGameLoop` hook with `requestAnimationFrame`
- **Rendering**: Canvas-based rendering in useEffect, not React DOM
- **Game logic**: Pure functions in `src/game/` (GameState, GhostAI, Dots, Fruit, Collision)
- **Data**: Maze defined as 2D array in `src/data/maze.js`

### File Structure
```
src/
├── components/     # React UI components (overlays, screens)
├── data/           # Static game data (maze layout)
├── game/           # Pure game logic (state, AI, collision)
├── hooks/          # Custom React hooks
├── App.jsx         # Main game component with canvas rendering
└── main.jsx        # Entry point
```

### Testing Strategy
No test framework currently configured. Manual testing via browser.

### Git Workflow
- Feature branches for new work
- Conventional commit messages (feat:, fix:, etc.)

## Domain Context

### Game States
- `MODE_SELECT` - Choose 1P or 2P mode
- `IDLE` - Ready to start (press Enter)
- `RUNNING` - Active gameplay
- `PAUSED` - Game paused (ESC toggle)
- `DYING` - Death animation playing
- `GAME_OVER` - No lives remaining
- `LEVEL_COMPLETE` - All dots collected

### Ghost AI
Four ghosts with distinct behaviors (Blinky, Pinky, Inky, Clyde). Modes: SCATTER, CHASE, FRIGHTENED, EATEN. Ghosts reverse direction on mode changes.

### Scoring
- Regular dot: 10 points
- Power pellet: 50 points
- Ghosts (frightened): 200, 400, 800, 1600 (doubles each)
- Bonus fruit: varies by level

## Important Constraints
- Tile-based movement (TILE_SIZE = 20px)
- Grid-aligned collision detection
- localStorage for high score persistence
- No external game frameworks (pure Canvas API)

## External Dependencies
None - fully client-side with no backend or external APIs.
