/**
 * Tests for usePlayerMovement hook.
 * Covers grid-based movement, wall collision, tunnel wrapping, and direction queuing.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerMovement } from './usePlayerMovement.js';
import { TILE_SIZE } from '../game/Dots.js';

/**
 * Creates a simple test maze.
 * 0 = walkable, 1 = wall
 *
 * Layout (5x5):
 * 1 1 1 1 1
 * 1 0 0 0 1
 * 1 0 1 0 1
 * 1 0 0 0 1
 * 1 1 1 1 1
 */
function createTestMaze() {
  return [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];
}

/**
 * Creates a maze with horizontal tunnel.
 * Row 2 has open edges for left/right wrapping.
 *
 * Layout (5x5):
 * 1 1 1 1 1
 * 1 0 0 0 1
 * 0 0 1 0 0   <- tunnel row
 * 1 0 0 0 1
 * 1 1 1 1 1
 */
function createHorizontalTunnelMaze() {
  return [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 0, 1, 0, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];
}

/**
 * Creates a maze with vertical tunnel.
 * Column 2 has open edges for up/down wrapping.
 *
 * Layout (5x5):
 * 1 1 0 1 1   <- tunnel top
 * 1 0 0 0 1
 * 1 0 1 0 1
 * 1 0 0 0 1
 * 1 1 0 1 1   <- tunnel bottom
 */
function createVerticalTunnelMaze() {
  return [
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
  ];
}

describe('usePlayerMovement', () => {
  describe('initialization', () => {
    it('initializes with default speed of 5', () => {
      const { result } = renderHook(() => usePlayerMovement());
      expect(result.current.update).toBeDefined();
      expect(result.current.setPosition).toBeDefined();
      expect(result.current.getPosition).toBeDefined();
      expect(result.current.setDirection).toBeDefined();
    });

    it('accepts custom speed option', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 10 }));
      expect(result.current.update).toBeDefined();
    });

    it('initializes at tile (1,1) by default', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const position = result.current.getPosition();
      expect(position.tileX).toBe(1);
      expect(position.tileY).toBe(1);
    });

    it('initializes with right direction', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const position = result.current.getPosition();
      expect(position.direction).toBe('right');
    });

    it('initializes at center of tile (1,1)', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const position = result.current.getPosition();
      expect(position.x).toBe(TILE_SIZE * 1.5);
      expect(position.y).toBe(TILE_SIZE * 1.5);
    });
  });

  describe('setPosition', () => {
    it('sets pixel position', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setPosition(100, 150);
      });
      const position = result.current.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(150);
    });

    it('updates tile coordinates based on pixel position', () => {
      const { result } = renderHook(() => usePlayerMovement());
      // Set position to center of tile (2, 3)
      const x = TILE_SIZE * 2 + TILE_SIZE / 2;
      const y = TILE_SIZE * 3 + TILE_SIZE / 2;
      act(() => {
        result.current.setPosition(x, y);
      });
      const position = result.current.getPosition();
      expect(position.tileX).toBe(2);
      expect(position.tileY).toBe(3);
    });

    it('resets movement state on setPosition', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      // Start moving
      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.update(maze, 50, 'right');
      });

      // Reset position
      act(() => {
        result.current.setPosition(TILE_SIZE * 3.5, TILE_SIZE * 3.5);
      });

      const position = result.current.getPosition();
      expect(position.tileX).toBe(3);
      expect(position.tileY).toBe(3);
    });
  });

  describe('getPosition', () => {
    it('returns x, y, direction, tileX, and tileY', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const position = result.current.getPosition();

      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('direction');
      expect(position).toHaveProperty('tileX');
      expect(position).toHaveProperty('tileY');
    });

    it('returns correct position after setPosition', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setPosition(200, 300);
      });

      const position = result.current.getPosition();
      expect(position.x).toBe(200);
      expect(position.y).toBe(300);
    });
  });

  describe('setDirection', () => {
    it('sets direction to up', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setDirection('up');
      });
      expect(result.current.getPosition().direction).toBe('up');
    });

    it('sets direction to down', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setDirection('down');
      });
      expect(result.current.getPosition().direction).toBe('down');
    });

    it('sets direction to left', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setDirection('left');
      });
      expect(result.current.getPosition().direction).toBe('left');
    });

    it('sets direction to right', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setDirection('right');
      });
      expect(result.current.getPosition().direction).toBe('right');
    });

    it('ignores invalid direction', () => {
      const { result } = renderHook(() => usePlayerMovement());
      act(() => {
        result.current.setDirection('invalid');
      });
      // Should keep default direction
      expect(result.current.getPosition().direction).toBe('right');
    });
  });

  describe('update - basic movement', () => {
    it('returns position state after update', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      let updateResult;
      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        updateResult = result.current.update(maze, 16, 'right');
      });

      expect(updateResult).toHaveProperty('x');
      expect(updateResult).toHaveProperty('y');
      expect(updateResult).toHaveProperty('direction');
      expect(updateResult).toHaveProperty('tileX');
      expect(updateResult).toHaveProperty('tileY');
      expect(updateResult).toHaveProperty('isMoving');
    });

    it('moves right when path is clear', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      let initialX;
      let afterX;
      act(() => {
        initialX = result.current.getPosition().x;
        result.current.update(maze, 100, 'right');
        afterX = result.current.getPosition().x;
      });

      expect(afterX).toBeGreaterThan(initialX);
    });

    it('moves left when path is clear', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at tile (2, 1) so there's room to move left
        result.current.setPosition(TILE_SIZE * 2.5, TILE_SIZE * 1.5);
        result.current.setDirection('left');
      });

      let initialX;
      let afterX;
      act(() => {
        initialX = result.current.getPosition().x;
        result.current.update(maze, 100, 'left');
        afterX = result.current.getPosition().x;
      });

      expect(afterX).toBeLessThan(initialX);
    });

    it('moves down when path is clear', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('down');
      });

      let initialY;
      let afterY;
      act(() => {
        initialY = result.current.getPosition().y;
        result.current.update(maze, 100, 'down');
        afterY = result.current.getPosition().y;
      });

      expect(afterY).toBeGreaterThan(initialY);
    });

    it('moves up when path is clear', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at tile (1, 2) so there's room to move up
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 2.5);
        result.current.setDirection('up');
      });

      let initialY;
      let afterY;
      act(() => {
        initialY = result.current.getPosition().y;
        result.current.update(maze, 100, 'up');
        afterY = result.current.getPosition().y;
      });

      expect(afterY).toBeLessThan(initialY);
    });

    it('sets isMoving to true when movement starts', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      let updateResult;
      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        updateResult = result.current.update(maze, 50, 'right');
      });

      expect(updateResult.isMoving).toBe(true);
    });

    it('completes movement to next tile after sufficient time', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      // Move for enough time to complete one tile (1 tile at 5 tiles/sec = 200ms)
      act(() => {
        result.current.update(maze, 250, 'right');
      });

      const position = result.current.getPosition();
      expect(position.tileX).toBe(2);
      expect(position.tileY).toBe(1);
    });
  });

  describe('update - wall collision', () => {
    it('does not move into wall', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      act(() => {
        // Start at tile (1, 1), wall is to the left at (0, 1)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('left');
      });

      let updateResult;
      act(() => {
        updateResult = result.current.update(maze, 100, 'left');
      });

      // Should not have moved into wall
      expect(updateResult.tileX).toBe(1);
      expect(updateResult.isMoving).toBe(false);
    });

    it('does not move up into wall', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      act(() => {
        // Start at tile (1, 1), wall is above at (1, 0)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('up');
      });

      let updateResult;
      act(() => {
        updateResult = result.current.update(maze, 100, 'up');
      });

      expect(updateResult.tileY).toBe(1);
      expect(updateResult.isMoving).toBe(false);
    });

    it('stops at wall in center of maze', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at tile (1, 2), wall is at (2, 2)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 2.5);
        result.current.setDirection('right');
      });

      // Move right, should stop before wall at (2, 2)
      act(() => {
        result.current.update(maze, 200, 'right');
      });

      const position = result.current.getPosition();
      expect(position.tileX).toBeLessThanOrEqual(1);
    });
  });

  describe('update - direction queuing', () => {
    it('queues direction input', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at (2, 1) moving right toward (3, 1)
        // From (3, 1), down to (3, 2) is walkable
        result.current.setPosition(TILE_SIZE * 2.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      // Move right and queue down - need enough time to reach next tile and turn
      // At speed 5 tiles/sec, 1 tile takes 200ms
      act(() => {
        result.current.update(maze, 50, 'right');
        result.current.update(maze, 50, 'down'); // Queue down
        result.current.update(maze, 200, 'down'); // Complete move to (3,1) and turn down
      });

      const position = result.current.getPosition();
      // After reaching tile (3,1), queued 'down' is applied since (3,2) is walkable
      expect(position.direction).toBe('down');
    });

    it('uses queued direction at tile boundary', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      // Queue a down turn while moving right
      act(() => {
        result.current.update(maze, 100, 'down');
        // Complete move to next tile
        result.current.update(maze, 200, 'down');
      });

      const position = result.current.getPosition();
      expect(position.direction).toBe('down');
    });

    it('ignores queued direction if path is blocked', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at (1, 1), try to queue up (blocked by wall at (1, 0))
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      act(() => {
        result.current.update(maze, 50, 'up');
      });

      // Should still be moving right since up is blocked
      const position = result.current.getPosition();
      expect(position.direction).toBe('right');
    });
  });

  describe('update - tunnel wrapping', () => {
    it('wraps from left edge to right edge', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createHorizontalTunnelMaze();

      act(() => {
        // Start at left edge tile (0, 2)
        result.current.setPosition(TILE_SIZE * 0.5, TILE_SIZE * 2.5);
        result.current.setDirection('left');
      });

      // Try to move left off the edge
      act(() => {
        result.current.update(maze, 300, 'left');
      });

      const position = result.current.getPosition();
      // Should wrap to right edge (tile 4, row 2)
      expect(position.tileX).toBe(4);
    });

    it('wraps from right edge to left edge', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createHorizontalTunnelMaze();

      act(() => {
        // Start at right edge tile (4, 2)
        result.current.setPosition(TILE_SIZE * 4.5, TILE_SIZE * 2.5);
        result.current.setDirection('right');
      });

      // Try to move right off the edge
      act(() => {
        result.current.update(maze, 300, 'right');
      });

      const position = result.current.getPosition();
      // Should wrap to left edge (tile 0, row 2)
      expect(position.tileX).toBe(0);
    });

    it('wraps from top edge to bottom edge', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createVerticalTunnelMaze();

      act(() => {
        // Start at top edge tile (2, 0)
        result.current.setPosition(TILE_SIZE * 2.5, TILE_SIZE * 0.5);
        result.current.setDirection('up');
      });

      // Try to move up off the edge
      act(() => {
        result.current.update(maze, 300, 'up');
      });

      const position = result.current.getPosition();
      // Should wrap to bottom edge (tile 2, row 4)
      expect(position.tileY).toBe(4);
    });

    it('wraps from bottom edge to top edge', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createVerticalTunnelMaze();

      act(() => {
        // Start at bottom edge tile (2, 4)
        result.current.setPosition(TILE_SIZE * 2.5, TILE_SIZE * 4.5);
        result.current.setDirection('down');
      });

      // Try to move down off the edge
      act(() => {
        result.current.update(maze, 300, 'down');
      });

      const position = result.current.getPosition();
      // Should wrap to top edge (tile 2, row 0)
      expect(position.tileY).toBe(0);
    });

    it('does not wrap if destination is a wall', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      // Use standard test maze where edges are walls
      const maze = createTestMaze();

      act(() => {
        // Start at tile (1, 1)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('left');
      });

      // Try to move left into wall
      act(() => {
        result.current.update(maze, 300, 'left');
      });

      const position = result.current.getPosition();
      // Should stay at tile 1 (wall blocks)
      expect(position.tileX).toBe(1);
    });
  });

  describe('update - movement speed', () => {
    it('moves faster with higher speed setting', () => {
      const { result: slowResult } = renderHook(() =>
        usePlayerMovement({ speed: 5 })
      );
      const { result: fastResult } = renderHook(() =>
        usePlayerMovement({ speed: 10 })
      );
      const maze = createTestMaze();

      act(() => {
        slowResult.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        fastResult.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      act(() => {
        slowResult.current.update(maze, 100, 'right');
        fastResult.current.update(maze, 100, 'right');
      });

      const slowPos = slowResult.current.getPosition();
      const fastPos = fastResult.current.getPosition();

      expect(fastPos.x).toBeGreaterThan(slowPos.x);
    });

    it('movement is proportional to delta time', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      let pos1, pos2;
      act(() => {
        result.current.update(maze, 50, 'right');
        pos1 = result.current.getPosition();
      });

      // Reset and try with double the time
      const { result: result2 } = renderHook(() => usePlayerMovement({ speed: 5 }));
      act(() => {
        result2.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result2.current.update(maze, 100, 'right');
        pos2 = result2.current.getPosition();
      });

      // Position difference should be roughly double (accounting for tile boundaries)
      const diff1 = pos1.x - TILE_SIZE * 1.5;
      const diff2 = pos2.x - TILE_SIZE * 1.5;
      expect(diff2).toBeGreaterThan(diff1);
    });
  });

  describe('update - perpendicular turns', () => {
    it('allows perpendicular turn past midpoint', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at (1, 1)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      // Move past midpoint
      act(() => {
        result.current.update(maze, 150, 'down');
      });

      const position = result.current.getPosition();
      // Should have turned down after passing midpoint
      expect(position.direction).toBe('down');
    });

    it('continues in current direction if perpendicular path is blocked', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at (1, 1) moving down toward (1, 2)
        // When past midpoint, trying to turn right would check (2, 2) which is a wall
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('down');
      });

      // Start moving down then try to turn right
      act(() => {
        result.current.update(maze, 50, 'down'); // Start moving
      });

      act(() => {
        result.current.update(maze, 100, 'right'); // Past midpoint, try turn right
      });

      // Should continue down since right is blocked by wall at (2, 2)
      const position = result.current.getPosition();
      expect(position.direction).toBe('down');
    });
  });

  describe('update - continuous movement', () => {
    it('continues moving in same direction after reaching tile', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      // Move right for enough time to pass multiple tiles
      act(() => {
        result.current.update(maze, 500, 'right');
      });

      const position = result.current.getPosition();
      // Should have continued right to tile (3, 1)
      expect(position.tileX).toBeGreaterThanOrEqual(2);
      expect(position.direction).toBe('right');
    });

    it('stops at wall when continuing in same direction', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        // Start at (1, 1), wall is at right edge (4, 1)
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      // Try to move right for a long time
      act(() => {
        result.current.update(maze, 1000, 'right');
      });

      const position = result.current.getPosition();
      // Should stop before wall at (4, 1) - max is tile 3
      expect(position.tileX).toBeLessThanOrEqual(3);
    });
  });

  describe('multiple update calls', () => {
    it('handles multiple small updates correctly', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      // Multiple small updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.update(maze, 20, 'right');
        }
      });

      const position = result.current.getPosition();
      // Should have moved approximately the same as one 200ms update
      expect(position.x).toBeGreaterThan(TILE_SIZE * 1.5);
    });

    it('maintains direction across updates without input', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      // Update without direction input
      act(() => {
        result.current.update(maze, 100, null);
        result.current.update(maze, 100, null);
      });

      const position = result.current.getPosition();
      expect(position.direction).toBe('right');
      expect(position.x).toBeGreaterThan(TILE_SIZE * 1.5);
    });
  });

  describe('edge cases', () => {
    it('handles zero delta time', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      const initialPos = result.current.getPosition();

      act(() => {
        result.current.update(maze, 0, 'right');
      });

      const afterPos = result.current.getPosition();
      expect(afterPos.x).toBe(initialPos.x);
    });

    it('handles very large delta time', () => {
      const { result } = renderHook(() => usePlayerMovement({ speed: 5 }));
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
      });

      act(() => {
        result.current.update(maze, 10000, 'right');
      });

      const position = result.current.getPosition();
      // Should stop at wall, not go through
      expect(position.tileX).toBeLessThanOrEqual(3);
    });

    it('handles invalid direction input gracefully', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      // Pass invalid direction
      act(() => {
        result.current.update(maze, 100, 'invalid');
      });

      // Should continue with current direction
      const position = result.current.getPosition();
      expect(position.direction).toBe('right');
    });

    it('handles undefined direction input', () => {
      const { result } = renderHook(() => usePlayerMovement());
      const maze = createTestMaze();

      act(() => {
        result.current.setPosition(TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        result.current.setDirection('right');
      });

      act(() => {
        result.current.update(maze, 100, undefined);
      });

      // Should continue moving right
      const position = result.current.getPosition();
      expect(position.direction).toBe('right');
    });
  });
});
