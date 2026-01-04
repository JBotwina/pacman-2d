import { useMemo } from 'react'
import './Player.css'

/**
 * Player component - renders a Pac-Man character with mouth animation
 * @param {Object} props
 * @param {1|2} props.playerNumber - Player 1 or Player 2 (determines color)
 * @param {number} props.x - X position in pixels
 * @param {number} props.y - Y position in pixels
 * @param {'right'|'left'|'up'|'down'} props.direction - Facing direction
 * @param {number} props.size - Size in pixels (default 40)
 */
function Player({
  playerNumber = 1,
  x = 0,
  y = 0,
  direction = 'right',
  size = 40
}) {
  const rotation = useMemo(() => {
    switch (direction) {
      case 'right': return 0
      case 'down': return 90
      case 'left': return 180
      case 'up': return 270
      default: return 0
    }
  }, [direction])

  const playerClass = playerNumber === 1 ? 'player-1' : 'player-2'

  return (
    <div
      className={`player ${playerClass}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`
      }}
    >
      <div className="player-body">
        <div className="player-eye" />
      </div>
    </div>
  )
}

export default Player
