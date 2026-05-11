import React, { useMemo, useState } from 'react';
import Modal from 'react-modal';
import './Modal.css';

Modal.setAppElement('#root');

const baseStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '15px',
    borderRadius: '12px',
    width: '88vw',
    height: 'auto',
    maxWidth: '95vw',
    minWidth: '300px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    boxSizing: 'border-box',
    transition: 'all 0.25s ease',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
  },
};

function PdfViewer({ isOpen, onClose, title, children, footer }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const modalStyles = useMemo(() => {
    if (isFullscreen) {
      return {
        ...baseStyles,
        content: {
          ...baseStyles.content,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          inset: 0,
          transform: 'none',
          margin: 0,
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: 0,
          boxSizing: 'border-box',
          padding: '10px',
        },
      };
    }

    return baseStyles;
  }, [isFullscreen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      {title && (
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            minHeight: '36px',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {title}
          </h2>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* FULLSCREEN BUTTON */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="modal-fullscreen-btn"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="modal-close-btn"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div
        className="modal-body"
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {
        typeof children === 'function'
          ? children({ isFullscreen })
          : children
        }
      </div>

      {footer && (
        <div
          className="modal-footer"
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      )}
    </Modal>
  );
}

export default PdfViewer;