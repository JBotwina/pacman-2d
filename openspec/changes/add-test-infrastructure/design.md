## Context
Adding automated testing to a Pac-Man game built with React 19 + Vite 7 + Zustand. The codebase has clear separation: pure game logic in `src/game/`, React components in `src/components/`, and state management in `src/store/`.

## Goals / Non-Goals
- Goals:
  - Unit test coverage for pure game logic functions
  - Component test coverage for React UI screens
  - E2E test coverage for critical user flows
  - CI-ready test commands
- Non-Goals:
  - 100% coverage target (focus on high-value tests first)
  - Visual regression testing
  - Performance benchmarking

## Decisions

### Test Framework: Vitest
- **Decision**: Use Vitest over Jest
- **Rationale**: Native Vite integration, faster startup, Jest-compatible API, no additional bundler config needed

### Component Testing: React Testing Library
- **Decision**: Use @testing-library/react
- **Rationale**: Industry standard, encourages testing user behavior over implementation details

### E2E Framework: Playwright
- **Decision**: Use Playwright over Cypress
- **Rationale**: Multi-browser support out of box, better performance, modern async API, built-in dev server support

### Test Location: Co-located `__tests__` folders
- **Decision**: Place tests in `__tests__/` subdirectories next to source
- **Rationale**: Easy to find related tests, follows React ecosystem conventions

## Risks / Trade-offs

### Canvas Mocking
- **Risk**: JSDOM doesn't support Canvas API; rendering tests may be limited
- **Mitigation**: Mock canvas context in setup.js, test game logic separately from rendering

### Game Loop Testing
- **Risk**: requestAnimationFrame timing is non-deterministic
- **Mitigation**: Mock RAF as setTimeout(cb, 16) for predictable test execution

### State Leakage
- **Risk**: Zustand store persists between tests
- **Mitigation**: Reset store in beforeEach using createInitialState()

## Open Questions
None - straightforward test infrastructure setup.
