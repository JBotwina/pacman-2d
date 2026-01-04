import './Ghost.css'

const GHOST_COLORS = {
  blinky: '#ff0000',
  pinky: '#ffb8ff',
  inky: '#00ffff',
  clyde: '#ffb852',
}

function Ghost({ name = 'blinky', size = 40 }) {
  const color = GHOST_COLORS[name.toLowerCase()] || GHOST_COLORS.blinky

  return (
    <div
      className={`ghost ghost-${name.toLowerCase()}`}
      style={{ '--ghost-color': color, '--ghost-size': `${size}px` }}
      title={name}
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
        {/* Eyes */}
        <ellipse cx="10" cy="14" rx="4" ry="5" fill="white" />
        <ellipse cx="22" cy="14" rx="4" ry="5" fill="white" />
        {/* Pupils */}
        <ellipse cx="11" cy="15" rx="2" ry="3" fill="#1a1aff" />
        <ellipse cx="23" cy="15" rx="2" ry="3" fill="#1a1aff" />
      </svg>
    </div>
  )
}

export default Ghost
