import React from 'react';
import Modal from 'react-modal';
import './Modal.css';

Modal.setAppElement('#root');

const defaultStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '25px',
    borderRadius: '12px',
    // --- KEY CHANGES START ---
    width: 'fit-content',      // Shrinks or grows to fit the children
    maxWidth: '95vw',          // Prevents it from going off-screen on mobile
    minWidth: '300px',         // Ensures it's not too tiny for small content
    maxHeight: '90vh',         // Keeps it within vertical bounds
    overflow: 'hidden',          // Adds scrollbars if content is taller than screen
    display: 'flex',
    flexDirection: 'column',
    // --- KEY CHANGES END ---
    border: 'none',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,              // Ensure it sits above everything
  },
};

function ReactModal({ isOpen, onClose, title, children, footer }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={defaultStyles}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      {title && (
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', height: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>
      )}

      <div className="modal-body">
        {children}
      </div>

      {footer && (
        <div className="modal-footer" style={{ marginTop: '20px' }}>
          {footer}
        </div>
      )}
    </Modal>
  );
}

export default ReactModal;