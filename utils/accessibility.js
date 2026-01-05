// Focus management utilities

/**
 * Trap focus within a modal
 */
export function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    modal.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) firstElement.focus();

    return () => modal.removeEventListener('keydown', handleTabKey);
}

/**
 * Enhanced modal setup with focus management
 */
export function setupAccessibleModal(openBtnId, closeBtnId, modalId) {
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const modal = document.getElementById(modalId);

    let previousFocus = null;
    let removeTrap = null;

    const openModal = () => {
        if (!modal) return;

        previousFocus = document.activeElement;
        modal.classList.add('show');
        modal.removeAttribute('aria-hidden');

        // Trap focus
        removeTrap = trapFocus(modal);

        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        modal.addEventListener('keydown', handleEscape);
        modal.__handleEscape = handleEscape;
    };

    const closeModal = () => {
        if (!modal) return;

        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');

        // Remove focus trap
        if (removeTrap) removeTrap();

        // Remove escape handler
        if (modal.__handleEscape) {
            modal.removeEventListener('keydown', modal.__handleEscape);
        }

        // Restore focus
        if (previousFocus) previousFocus.focus();
    };

    if (openBtn) {
        openBtn.addEventListener('click', openModal);

        // Keyboard support for open button
        openBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

/**
 * Add keyboard navigation to variant buttons
 */
export function enhanceKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;

        // Handle variant buttons
        if (target.classList.contains('variant-button')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                target.click();
            }
        }

        // Handle copy buttons
        if (target.classList.contains('copy-btn') || target.classList.contains('copy-ticket-btn')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                target.click();
            }
        }

        // Handle favorite buttons
        if (target.classList.contains('favorite-btn')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                target.click();
            }
        }
    });
}

/**
 * Update tab aria-pressed states
 */
export function updateTabStates(activeTab) {
    const tabs = document.querySelectorAll('.tab-nav-button');
    tabs.forEach(tab => {
        const isActive = tab.dataset.tab === activeTab;
        tab.setAttribute('aria-pressed', isActive.toString());
    });
}
