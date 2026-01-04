import './Ghost.css'

const GHOST_COLORS = {
  blinky: '#ff0000',
  pinky: '#ffb8ff',
  inky: '#00ffff',
  clyde: '#ffb852',
}

const FRIGHTENED_COLOR = '#2121de'
const FRIGHTENED_FLASH_COLOR = '#ffffff'
const VULNERABLE_COLOR = '#2121de' // Alias for compatibility

function Ghost({ name = 'blinky', size = 40, frightened = false, frightenedFlashing = false, vulnerable = false }) {
  const normalColor = GHOST_COLORS[name.toLowerCase()] || GHOST_COLORS.blinky

  // Support both frightened and vulnerable props
  const isFrightened = frightened || vulnerable
  let color = normalColor
  if (isFrightened) {
    color = frightenedFlashing ? FRIGHTENED_FLASH_COLOR : FRIGHTENED_COLOR
  }

  const className = [
    'ghost',
    `ghost-${name.toLowerCase()}`,
    isFrightened && 'ghost-frightened',
    isFrightened && 'ghost-vulnerable',
    frightenedFlashing && 'ghost-flashing',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      style={{ '--ghost-color': color, '--ghost-size': `${size}px` }}
      title={frightened ? `${name} (frightened)` : name}
    >
      <svg
        viewBox="0 0 32 36"
        width={size}
        height={size * 1.125}
        className="ghost-body"
      >
        {/* Ghost body */}
        <path
          d="M16 0 C6 0 0 8 0 16 L0 32 L4 28 L8 32 L12 28 L16 32 L20 28 L24 32 L28 28 L32 32 L32 16 C32 8 26 0 16 0"
          fill={color}
        />
        {isFrightened ? (
          <>
            {/* Frightened face - wavy mouth and simple eyes */}
            <ellipse cx="10" cy="14" rx="3" ry="3" fill="white" />
            <ellipse cx="22" cy="14" rx="3" ry="3" fill="white" />
            {/* Wavy mouth */}
            <path
              d="M6 22 Q9 19 12 22 Q15 25 18 22 Q21 19 24 22"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            {/* Normal eyes */}
            <ellipse cx="10" cy="14" rx="4" ry="5" fill="white" />
            <ellipse cx="22" cy="14" rx="4" ry="5" fill="white" />
            {/* Pupils */}
            <ellipse cx="11" cy="15" rx="2" ry="3" fill="#1a1aff" />
            <ellipse cx="23" cy="15" rx="2" ry="3" fill="#1a1aff" />
          </>
        )}
      </svg>
    </div>
  )
}

export default Ghost
