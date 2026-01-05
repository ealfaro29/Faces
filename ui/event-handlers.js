// ui/event-handlers.js - Event delegation mejorada

const eventHandlers = new Map();

export function registerHandler(selector, handler) {
    eventHandlers.set(selector, handler);
}

export function setupEventDelegation(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.addEventListener('click', (event) => {
        for (const [selector, handler] of eventHandlers) {
            const target = event.target.closest(selector);
            if (target) {
                handler(event, target);
                break; // Solo manejar el primer match
            }
        }
    });
}

// Handlers específicos
export function handleCopyButton(event, button) {
    const inputToCopy = button.previousElementSibling;

    if (inputToCopy && inputToCopy.tagName === 'INPUT') {
        const textToCopy = inputToCopy.value;

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Error copying text:', err);
                alert('No se pudo copiar el ID.');
            });
        } else {
            console.warn('Attempt to copy empty value.');
        }
    }
}

export function handleVariantButton(event, variantButton) {
    event.stopPropagation();
    const card = variantButton.closest('.facebase-card');
    if (!card) return;

    if (variantButton.classList.contains('active-variant')) {
        revertToDefault(card);
    } else {
        const mainImg = card.querySelector('.facebase-main-img');
        const idInput = card.querySelector('input[readonly]');
        const favButton = card.querySelector('.favorite-btn');

        const newSrc = variantButton.dataset.src;
        const newId = variantButton.dataset.id;
        const newCodeId = variantButton.dataset.codeId || '';

        if (mainImg) mainImg.src = newSrc;
        if (idInput) idInput.value = newCodeId;

        if (favButton) {
            favButton.dataset.id = newId;
            favButton.innerHTML = window.isFavorite(newId) ? '❤️' : '🖤';
        }

        card.querySelectorAll('.variant-button').forEach(btn => btn.classList.remove('active-variant'));
        variantButton.classList.add('active-variant');
    }
}

export function handleCardClick(event, card) {
    // Solo revertir si no se hizo click en botones especiales
    if (!event.target.closest('.favorite-btn') &&
        !event.target.closest('.copy-btn') &&
        !event.target.closest('.variant-button')) {
        revertToDefault(card);
    }
}

function revertToDefault(cardElement) {
    if (!cardElement) return;

    const defaultSrc = cardElement.dataset.defaultSrc;
    const defaultId = cardElement.dataset.defaultId;
    const defaultCodeId = cardElement.dataset.defaultCodeId || '';

    if (!defaultSrc) return;

    const mainImg = cardElement.querySelector('.facebase-main-img');
    const idInput = cardElement.querySelector('input[readonly]');
    const favButton = cardElement.querySelector('.favorite-btn');

    if (mainImg) mainImg.src = defaultSrc;
    if (idInput) idInput.value = defaultCodeId;

    if (favButton) {
        favButton.dataset.id = defaultId;
        favButton.innerHTML = window.isFavorite(defaultId) ? '❤️' : '🖤';
    }

    cardElement.querySelectorAll('.variant-button').forEach(btn => btn.classList.remove('active-variant'));
}
