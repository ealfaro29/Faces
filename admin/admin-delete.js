
import { auth, db } from '../core/firebase.js';
import { doc, deleteDoc } from "firebase/firestore";
import store from '../core/store.js';

export function initDeleteHandler() {
    const deleteModal = document.getElementById('delete-confirm-modal');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const nameSpan = document.getElementById('delete-item-name');

    let itemToDelete = null;

    // 1. Right Click Listener Global
    document.addEventListener('contextmenu', (e) => {
        // Solo si hay admin logueado
        if (!auth.currentUser) return;

        // Detectar si clicamos en una carta
        const card = e.target.closest('.facebase-card') || e.target.closest('.texture-group-card');

        if (card) {
            e.preventDefault(); // Bloquear menú nativo

            // EXTRAER ID
            // 1. Preferimos atributos data en la carta
            let itemId = card.dataset.id || card.dataset.mainId;

            // 2. Si no, buscamos en el botón de copiar (común en textures)
            const copyBtn = card.querySelector('.copy-btn');
            if (!itemId && copyBtn) itemId = copyBtn.dataset.id;

            // 3. Fallback: Botón de variante
            const variantBtn = card.querySelector('.variant-button');
            if (!itemId && variantBtn) {
                // onclick="selectVariant(123...)"
                const match = variantBtn.getAttribute('onclick')?.match(/(\d+)/);
                if (match) itemId = match[0];
            }

            // EXTRAER NOMBRE
            let itemName = card.dataset.name;
            if (!itemName) {
                const titleEl = card.querySelector('.main-display-name') || card.querySelector('h3') || card.querySelector('.font-bold');
                if (titleEl) itemName = titleEl.textContent.trim();
                else itemName = "Unknown Item";
            }

            // EXTRAER COLECCIÓN (Por Tab Activo)
            let collectionName = null;
            const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;

            if (activeTab === 'textures') collectionName = 'textures';
            else if (activeTab === 'facebases') collectionName = 'facebases';
            else if (activeTab === 'avatar') collectionName = 'avatar';

            if (itemId && collectionName) {
                itemToDelete = { id: itemId, collection: collectionName, element: card };

                // Mostrar Modal
                nameSpan.innerHTML = `Are you sure you want to delete <b>"${itemName}"</b>?<br><span class="text-xs text-zinc-500">ID: ${itemId} • Collection: ${collectionName}</span>`;
                deleteModal.classList.remove('hidden');

                // Animación y Activación de Puntero
                // Forzar reflow
                void deleteModal.offsetWidth;
                deleteModal.classList.add('show');

            } else {
                console.warn("DELETE TOOL: Could not identify item.", { itemId, collectionName });
            }
        }
    });

    // 2. Action Handlers
    confirmBtn.addEventListener('click', async () => {
        if (!itemToDelete) return;

        confirmBtn.disabled = true;
        confirmBtn.textContent = "Deleting...";

        try {
            console.log(`🗑 Deleting ${itemToDelete.id} from ${itemToDelete.collection}`);

            // Borrar de Firestore
            await deleteDoc(doc(db, itemToDelete.collection, itemToDelete.id));

            // Feedback Visual: Eliminar del DOM con estilo
            itemToDelete.element.style.transition = "all 0.5s ease";
            itemToDelete.element.style.transform = "scale(0.8) translateY(20px)";
            itemToDelete.element.style.opacity = "0";
            setTimeout(() => itemToDelete.element.remove(), 500);

            closeDeleteModal();
            // Toast de éxito (opcional)
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-black px-4 py-2 rounded shadow-lg z-50 font-bold';
            toast.textContent = "Item deleted successfully";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Error deleting item: " + error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Delete Permanently";
        }
    });

    cancelBtn.addEventListener('click', closeDeleteModal);

    // Close on background click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    function closeDeleteModal() {
        deleteModal.classList.remove('show');
        setTimeout(() => {
            deleteModal.classList.add('hidden');
            itemToDelete = null;
        }, 300); // Wait for CSS transition
    }
}
