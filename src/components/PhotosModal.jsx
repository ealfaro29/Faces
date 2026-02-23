import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotosModal({ isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen) return null;

    const downloadablePhotos = [
        { src: 'photos/modal/UK.png', filename: 'UK.png', title: 'UK Collection' },
        { src: 'photos/modal/Brazil.png', filename: 'Brazil.png', title: 'Brazil Collection' }
    ];

    const nextPhoto = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % downloadablePhotos.length);
    };

    const prevPhoto = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + downloadablePhotos.length) % downloadablePhotos.length);
    };

    const currentPhoto = downloadablePhotos[currentIndex];

    return ReactDOM.createPortal(
        <div className="modal-overlay show overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose} style={{ display: 'flex' }}>
            <div
                className="modal-content !max-w-[90vw] !max-h-[90vh] !bg-transparent !border-none !shadow-none p-0 relative flex flex-col items-center justify-center"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 md:right-4 text-white/50 hover:text-white transition text-4xl z-20"
                    aria-label="Close photo gallery"
                >
                    &times;
                </button>

                <div className="relative flex flex-col items-center py-10" style={{ minHeight: '400px', minWidth: '300px' }}>
                    {downloadablePhotos.length > 1 && (
                        <button
                            onClick={prevPhoto}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/80 transition-all z-10"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft />
                        </button>
                    )}

                    <div className="flex flex-col items-center text-center animate-fade-in">
                        <h3 className="text-xl font-semibold text-zinc-100 mb-4">{currentPhoto.title}</h3>
                        <img
                            src={currentPhoto.src}
                            alt={currentPhoto.title}
                            className="max-h-[60vh] object-contain rounded-lg shadow-2xl mb-6"
                        />
                        <a
                            href={currentPhoto.src}
                            download={currentPhoto.filename}
                            className="px-6 py-3 bg-[var(--gold2)] text-black font-semibold rounded-md hover:brightness-110 transition-all shadow-lg"
                        >
                            Descargar {currentPhoto.filename}
                        </a>
                    </div>

                    {downloadablePhotos.length > 1 && (
                        <button
                            onClick={nextPhoto}
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/80 transition-all z-10"
                            aria-label="Next photo"
                        >
                            <ChevronRight />
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
