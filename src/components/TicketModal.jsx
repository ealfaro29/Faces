import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function TicketModal({ isOpen, onClose }) {
    const [copiedIndex, setCopiedIndex] = useState(null);

    if (!isOpen) return null;

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const tickets = [
        { flag: '🇪🇸', text: 'SPAIN - FashionMuseDoll' },
        { flag: '🇧🇷', text: 'BRAZIL - FashionMuseDoll' },
        { flag: '🇬🇧', text: 'UNITED KINGDOM - FashionMuseDoll' },
        { flag: '🇨🇷', text: 'COSTA RICA - FashionMuseDoll' },
        { flag: '🇮🇹', text: 'ITALY - FashionMuseDoll' },
        { flag: '🇹🇭', text: 'THAILAND - FashionMuseDoll' },
    ];

    return ReactDOM.createPortal(
        <div className="modal-overlay show" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content p-6 pt-8 relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition text-3xl z-10"
                    aria-label="Close ticket modal"
                >
                    &times;
                </button>
                <h2 className="text-center text-xl font-semibold title-fancy gold-title mb-6">
                    Copiar Nombre de Ticket
                </h2>

                <div className="flex flex-col gap-3">
                    {tickets.map((ticket, index) => (
                        <button
                            key={index}
                            className={`copy-ticket-btn ${copiedIndex === index ? 'bg-green-500/20 text-green-500 border-green-500/50' : ''}`}
                            onClick={() => handleCopy(ticket.text, index)}
                        >
                            <span className="flag-emoji">{ticket.flag}</span> {ticket.text}
                            {copiedIndex === index && <span className="ml-auto text-xs font-bold text-green-400">¡Copiado!</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}
