import React from 'react';
import ReactDOM from 'react-dom';

export default function DriveModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay show" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content p-6 pt-8 relative text-center" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition text-3xl z-10"
                    aria-label="Close Google Drive modal"
                >
                    &times;
                </button>
                <h2 className="text-center text-xl font-semibold title-fancy gold-title mb-6">
                    Contribuir a la Carpeta
                </h2>

                <p className="text-zinc-300 text-sm mb-6">
                    Haz clic en el botón de abajo para abrir la carpeta de Google Drive en una nueva pestaña. Podrás subir tus archivos allí.
                </p>

                <a
                    href="https://drive.google.com/drive/folders/1-3l67TJy51ecP-J_0W9O7VrqhHPNZ7l6?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-6 inline-flex items-center justify-center rounded-md bg-[var(--gold2)] text-black font-semibold hover:brightness-110 transition-transform hover:scale-105 no-underline"
                >
                    Abrir Google Drive
                </a>
            </div>
        </div>,
        document.body
    );
}
