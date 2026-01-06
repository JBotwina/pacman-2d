/**
 * Component for entering 3-letter initials for high score.
 * Classic arcade-style letter selection.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_';

export default function InitialsInput({ onSubmit, onCancel }) {
  const [initials, setInitials] = useState(['A', 'A', 'A']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentLetter = initials[currentIndex];
      const letterIndex = LETTERS.indexOf(currentLetter);

      switch (e.key) {
        case 'ArrowUp':
        case 'e':
        case 'E':
        case 'i':
        case 'I':
          // Move to previous letter
          setInitials(prev => {
            const newInitials = [...prev];
            newInitials[currentIndex] = LETTERS[(letterIndex - 1 + LETTERS.length) % LETTERS.length];
            return newInitials;
          });
          break;

        case 'ArrowDown':
        case 'd':
        case 'D':
        case 'k':
        case 'K':
          // Move to next letter
          setInitials(prev => {
            const newInitials = [...prev];
            newInitials[currentIndex] = LETTERS[(letterIndex + 1) % LETTERS.length];
            return newInitials;
          });
          break;

        case 'ArrowLeft':
        case 's':
        case 'S':
        case 'j':
        case 'J':
          // Move to previous position
          setCurrentIndex(prev => Math.max(0, prev - 1));
          break;

        case 'ArrowRight':
        case 'f':
        case 'F':
        case 'l':
        case 'L':
          // Move to next position
          setCurrentIndex(prev => Math.min(2, prev + 1));
          break;

        case 'Enter':
          // Submit initials
          onSubmit(initials.join(''));
          break;

        case 'Escape':
          // Cancel (skip entering initials)
          if (onCancel) onCancel();
          break;

        default:
          // Direct letter input
          if (/^[a-zA-Z]$/.test(e.key)) {
            const letter = e.key.toUpperCase();
            setInitials(prev => {
              const newInitials = [...prev];
              newInitials[currentIndex] = letter;
              return newInitials;
            });
            // Auto-advance to next position
            if (currentIndex < 2) {
              setCurrentIndex(prev => prev + 1);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, initials, onSubmit, onCancel]);

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleLetterClick = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const handleArrowClick = useCallback((index, direction) => {
    const currentLetter = initials[index];
    const letterIndex = LETTERS.indexOf(currentLetter);
    setInitials(prev => {
      const newInitials = [...prev];
      if (direction === 'up') {
        newInitials[index] = LETTERS[(letterIndex - 1 + LETTERS.length) % LETTERS.length];
      } else {
        newInitials[index] = LETTERS[(letterIndex + 1) % LETTERS.length];
      }
      return newInitials;
    });
    setCurrentIndex(index);
  }, [initials]);

  return (
    <div className="initials-input" ref={containerRef} tabIndex={0}>
      <h3 className="initials-title">NEW HIGH SCORE!</h3>
      <p className="initials-prompt">ENTER YOUR INITIALS</p>

      <div className="initials-letters">
        {initials.map((letter, index) => (
          <div
            key={index}
            className={`initial-slot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleLetterClick(index)}
          >
            <button
              className="initial-arrow up"
              onClick={(e) => { e.stopPropagation(); handleArrowClick(index, 'up'); }}
              aria-label="Previous letter"
            >
              ▲
            </button>
            <span className="initial-letter">{letter}</span>
            <button
              className="initial-arrow down"
              onClick={(e) => { e.stopPropagation(); handleArrowClick(index, 'down'); }}
              aria-label="Next letter"
            >
              ▼
            </button>
          </div>
        ))}
      </div>

      <div className="initials-controls">
        <button
          className="menu-button submit-button"
          onClick={() => onSubmit(initials.join(''))}
        >
          SUBMIT
        </button>
      </div>

      <p className="initials-hint">
        Use SDFE/IJKL or arrows to change letters
      </p>
    </div>
  );
}
