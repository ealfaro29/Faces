// ui/toast.js - Sistema de notificaciones toast

let toastTimeout;

export function showToast(message, event) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;

    clearTimeout(toastTimeout);

    const x = event.clientX;
    const y = event.clientY;

    toast.style.left = `${x + 15}px`;
    toast.style.top = `${y + 15}px`;
    toast.textContent = message;
    toast.classList.add('show');
}

export function hideToast() {
    const toast = document.getElementById('custom-toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// Exportar para uso global
window.showFlagToast = showToast;
window.hideFlagToast = hideToast;
