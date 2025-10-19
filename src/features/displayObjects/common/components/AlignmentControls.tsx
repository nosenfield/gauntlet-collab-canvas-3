/**
 * Alignment Controls Component
 * 
 * Contextual toolbar for aligning and distributing selected objects
 * Appears when 2+ objects are selected (3+ for distribute)
 * 
 * Features:
 * - Horizontal alignment: left, center, right
 * - Vertical alignment: top, middle, bottom
 * - Distribution: horizontal, vertical
 */

import { useAlignment } from '../hooks/useAlignment';
import { useSelection } from '../store/selectionStore';
import './AlignmentControls.css';

/**
 * Alignment Controls Component
 * 
 * Displays alignment buttons when 2+ objects are selected
 */
export function AlignmentControls() {
  const { selectedIds } = useSelection();
  const {
    alignLeft,
    alignCenterHorizontal,
    alignRight,
    alignTop,
    alignCenterVertical,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
    selectionCount,
  } = useAlignment();

  // Don't render if less than 2 objects selected
  if (selectedIds.length < 2) {
    return null;
  }

  // Check if distribute operations are available (need 3+ objects)
  const canDistribute = selectionCount >= 3;

  return (
    <div className="alignment-controls">
      <div className="alignment-controls__container">
        {/* Label */}
        <div className="alignment-controls__label">Align:</div>
        
        {/* Horizontal Alignment Group */}
        <div className="alignment-controls__group">
          <button
            className="alignment-controls__button"
            onClick={alignLeft}
            title="Align Left"
            aria-label="Align Left"
          >
            <span className="alignment-controls__icon">⊣</span>
          </button>
          
          <button
            className="alignment-controls__button"
            onClick={alignCenterHorizontal}
            title="Align Center (Horizontal)"
            aria-label="Align Center Horizontal"
          >
            <span className="alignment-controls__icon">⊢⊣</span>
          </button>
          
          <button
            className="alignment-controls__button"
            onClick={alignRight}
            title="Align Right"
            aria-label="Align Right"
          >
            <span className="alignment-controls__icon">⊢</span>
          </button>
        </div>
        
        {/* Separator */}
        <div className="alignment-controls__separator" />
        
        {/* Vertical Alignment Group */}
        <div className="alignment-controls__group">
          <button
            className="alignment-controls__button"
            onClick={alignTop}
            title="Align Top"
            aria-label="Align Top"
          >
            <span className="alignment-controls__icon">⊤</span>
          </button>
          
          <button
            className="alignment-controls__button"
            onClick={alignCenterVertical}
            title="Align Middle (Vertical)"
            aria-label="Align Center Vertical"
          >
            <span className="alignment-controls__icon">⊥⊤</span>
          </button>
          
          <button
            className="alignment-controls__button"
            onClick={alignBottom}
            title="Align Bottom"
            aria-label="Align Bottom"
          >
            <span className="alignment-controls__icon">⊥</span>
          </button>
        </div>
        
        {/* Separator */}
        {canDistribute && <div className="alignment-controls__separator" />}
        
        {/* Distribution Group (only show if 3+ objects) */}
        {canDistribute && (
          <div className="alignment-controls__group">
            <button
              className="alignment-controls__button"
              onClick={distributeHorizontal}
              title="Distribute Horizontally"
              aria-label="Distribute Horizontally"
            >
              <span className="alignment-controls__icon">⟷</span>
            </button>
            
            <button
              className="alignment-controls__button"
              onClick={distributeVertical}
              title="Distribute Vertically"
              aria-label="Distribute Vertically"
            >
              <span className="alignment-controls__icon">⇅</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

