import { useEffect, useRef } from 'react';
import { mazeLayout, TILE_SIZE, TILE_TYPES, MAZE_WIDTH, MAZE_HEIGHT } from '../data/maze';
import './Maze.css';

const WALL_COLOR = '#2121de';
const WALL_GLOW_COLOR = '#4a4aff';
const DOT_COLOR = '#ffb8ae';
const POWER_PELLET_COLOR = '#ffb8ae';
const GHOST_HOUSE_COLOR = '#ffb8ff';

function Maze() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = MAZE_WIDTH * TILE_SIZE;
    const height = MAZE_HEIGHT * TILE_SIZE;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw maze
    for (let row = 0; row < MAZE_HEIGHT; row++) {
      for (let col = 0; col < MAZE_WIDTH; col++) {
        const tile = mazeLayout[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        switch (tile) {
          case TILE_TYPES.WALL:
            drawWall(ctx, x, y, row, col);
            break;
          case TILE_TYPES.DOT:
            drawDot(ctx, x, y);
            break;
          case TILE_TYPES.POWER_PELLET:
            drawPowerPellet(ctx, x, y);
            break;
          case TILE_TYPES.GHOST_HOUSE:
            drawGhostHouse(ctx, x, y);
            break;
          default:
            // Empty space - do nothing
            break;
        }
      }
    }
  }, []);

  return (
    <div className="maze-container">
      <canvas
        ref={canvasRef}
        width={MAZE_WIDTH * TILE_SIZE}
        height={MAZE_HEIGHT * TILE_SIZE}
        className="maze-canvas"
      />
    </div>
  );
}

function drawWall(ctx, x, y, row, col) {
  // Set neon glow effect
  ctx.shadowColor = WALL_GLOW_COLOR;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 2;

  const halfTile = TILE_SIZE / 2;
  const centerX = x + halfTile;
  const centerY = y + halfTile;

  // Check adjacent tiles to determine wall shape
  const top = row > 0 && mazeLayout[row - 1][col] === TILE_TYPES.WALL;
  const bottom = row < MAZE_HEIGHT - 1 && mazeLayout[row + 1][col] === TILE_TYPES.WALL;
  const left = col > 0 && mazeLayout[row][col - 1] === TILE_TYPES.WALL;
  const right = col < MAZE_WIDTH - 1 && mazeLayout[row][col + 1] === TILE_TYPES.WALL;

  ctx.beginPath();

  // Draw connecting lines based on adjacent walls
  if (top) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, y);
  }
  if (bottom) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, y + TILE_SIZE);
  }
  if (left) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, centerY);
  }
  if (right) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x + TILE_SIZE, centerY);
  }

  // If isolated wall or intersection, draw a small square
  if (!top && !bottom && !left && !right) {
    ctx.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;
}

function drawDot(ctx, x, y) {
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;

  ctx.fillStyle = DOT_COLOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerPellet(ctx, x, y) {
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;

  // Neon glow for power pellet
  ctx.shadowColor = POWER_PELLET_COLOR;
  ctx.shadowBlur = 10;
  ctx.fillStyle = POWER_PELLET_COLOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawGhostHouse(ctx, x, y) {
  // Ghost house area - draw subtle boundary
  ctx.strokeStyle = GHOST_HOUSE_COLOR;
  ctx.lineWidth = 1;
  ctx.shadowColor = GHOST_HOUSE_COLOR;
  ctx.shadowBlur = 4;

  // Just draw a subtle indicator
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export default Maze;
