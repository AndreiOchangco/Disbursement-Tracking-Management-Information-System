import React from 'react';
import Modal from 'react-modal';
import './Modal.css';

// Bind modal to root element (required for accessibility)
Modal.setAppElement('#root');

// Default styling (can be overridden later if needed)
const defaultStyles = {
  content: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
};

/**
 * ReactModal (Reusable Component)
 *
 * Props:
 * - isOpen: boolean → controls modal visibility
 * - onClose: function → closes modal
 * - title: string → modal header title
 * - children: JSX → dynamic content (body)
 * - footer: JSX → optional footer actions (buttons)
 */
function ReactModal({ isOpen, onClose, title, children, footer }) {
  return (
    <Modal
      isOpen={isOpen}                 // Show / hide modal
      onRequestClose={onClose}       // Handles ESC + overlay click
      style={defaultStyles}          // Apply default styles
      shouldCloseOnOverlayClick      // Click outside closes modal
      shouldCloseOnEsc               // ESC key closes modal
    >
      {/* ===== HEADER ===== */}
      {title && (
        <div className="modal-header">
          <h2>{title}</h2>

          {/* Close (X) button */}
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>
      )}

      {/* ===== BODY ===== */}
      <div className="modal-body">
        {children}
      </div>

      {/* ===== FOOTER (optional) ===== */}
      {footer && (
        <div className="modal-footer">
          {footer}
        </div>
      )}
    </Modal>
  );
}

export default ReactModal;