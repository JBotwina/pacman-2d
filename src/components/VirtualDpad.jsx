import { useCallback, memo } from 'react';
import './VirtualDpad.css';

/**
 * Virtual D-pad component for mobile touch controls
 * Provides directional buttons for game input on touch devices
 */
function VirtualDpad({ onDirectionPress, onDirectionRelease, disabled = false }) {
  const handlePress = useCallback((direction) => (e) => {
    e.preventDefault();
    if (!disabled && onDirectionPress) {
      onDirectionPress(direction);
    }
  }, [onDirectionPress, disabled]);

  const handleRelease = useCallback((e) => {
    e.preventDefault();
    if (onDirectionRelease) {
      onDirectionRelease();
    }
  }, [onDirectionRelease]);

  return (
    <div className="virtual-dpad" aria-label="Virtual directional pad">
      <div className="dpad-row">
        <button
          className="dpad-button dpad-up"
          onTouchStart={handlePress('up')}
          onTouchEnd={handleRelease}
          onMouseDown={handlePress('up')}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          disabled={disabled}
          aria-label="Move up"
        >
          <span className="dpad-arrow">&#9650;</span>
        </button>
      </div>
      <div className="dpad-row dpad-middle">
        <button
          className="dpad-button dpad-left"
          onTouchStart={handlePress('left')}
          onTouchEnd={handleRelease}
          onMouseDown={handlePress('left')}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          disabled={disabled}
          aria-label="Move left"
        >
          <span className="dpad-arrow">&#9664;</span>
        </button>
        <div className="dpad-center" />
        <button
          className="dpad-button dpad-right"
          onTouchStart={handlePress('right')}
          onTouchEnd={handleRelease}
          onMouseDown={handlePress('right')}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          disabled={disabled}
          aria-label="Move right"
        >
          <span className="dpad-arrow">&#9654;</span>
        </button>
      </div>
      <div className="dpad-row">
        <button
          className="dpad-button dpad-down"
          onTouchStart={handlePress('down')}
          onTouchEnd={handleRelease}
          onMouseDown={handlePress('down')}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          disabled={disabled}
          aria-label="Move down"
        >
          <span className="dpad-arrow">&#9660;</span>
        </button>
      </div>
    </div>
  );
}

export default memo(VirtualDpad);
