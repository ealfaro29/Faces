
import { auth, db } from '../core/firebase.js';
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Configuración de Categorías
const CATEGORIES = {
    texture: ["Mesh", "Solid", "Translucid", "Mixed", "Makeup", "Tattoos", "Skin Details", "Fantasy"],
    facebase: ["Global", "Brazil", "UK", "USA", "Italy", "Spain", "France", "Japan", "Korea", "China", "Thailand"],
    avatar: ["Hair", "Mesh", "Accessory", "Clothing", "Hats", "Face"]
};

// Proxy para obtener datos de Roblox sin CORS (Funciona en GitHub Pages)
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export function initAdminPanel() {
    // --- DOM REFERENCES ---
    const adminModal = document.getElementById('admin-modal');
    const adminCloseBtn = document.getElementById('admin-close-btn');
    const navAdminBtn = document.getElementById('nav-admin-btn');

    // Dashboard Views
    const authView = document.getElementById('admin-auth-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const userEmailSpan = document.getElementById('admin-user-email');
    const logoutBtn = document.getElementById('admin-logout-btn');

    // Form Elements
    const uploadForm = document.getElementById('quick-upload-form');
    const typeRadios = document.querySelectorAll('input[name="itemType"]');
    const idInput = document.getElementById('new-roblox-id');
    const nameInput = document.getElementById('new-item-name');
    const categorySelect = document.getElementById('dynamic-category-select');
    const submitBtn = document.getElementById('admin-submit-btn');
    const msg = document.getElementById('admin-msg');
    const finalUrlInput = document.getElementById('final-remote-url');

    // Preview Elements
    const spinner = document.getElementById('id-loading-spinner');
    const previewPlaceholder = document.getElementById('preview-placeholder');
    const previewImage = document.getElementById('preview-image');
    const previewBadge = document.getElementById('preview-badge');

    // --- 1. INITIALIZATION & AUTH STATE ---

    // Si llegamos aquí, asumimos que el usuario ya está logueado (gestionado por app.js)
    if (auth.currentUser) {
        if (authView) authView.classList.add('hidden');
        if (dashboardView) dashboardView.classList.remove('hidden');
        if (userEmailSpan) userEmailSpan.textContent = auth.currentUser.email;
        populateCategories('texture'); // Default
    }

    // Modal Toggle Logic
    if (navAdminBtn) {
        navAdminBtn.addEventListener('click', () => {
            adminModal.classList.remove('hidden');
            setTimeout(() => adminModal.classList.add('show'), 10);
        });
    }

    if (adminCloseBtn) {
        adminCloseBtn.addEventListener('click', closeAdminModal);
    }

    // Logout Logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.reload(); // Recargar para mostrar el login overlay de nuevo
            });
        });
    }

    function closeAdminModal() {
        adminModal.classList.remove('show');
        setTimeout(() => adminModal.classList.add('hidden'), 300);
    }

    // --- 2. DYNAMIC FORM BEHAVIOR ---

    // Type Change Listener
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            populateCategories(e.target.value);
        });
    });

    function populateCategories(type) {
        categorySelect.innerHTML = '';
        const options = CATEGORIES[type] || [];
        options.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
    }

    // --- 3. MAGIC PREVIEW LOGIC ---
    let debounceTimer;

    idInput.addEventListener('input', (e) => {
        const id = e.target.value.trim();
        clearTimeout(debounceTimer);

        // Reset UI state while typing
        submitBtn.disabled = true;
        previewBadge.classList.add('hidden');

        if (id.length < 8) {
            resetPreview();
            return;
        }

        debounceTimer = setTimeout(() => fetchRobloxPreview(id), 600);
    });

    async function fetchRobloxPreview(assetId) {
        showLoading(true);
        resetPreview(); // Hide old image while loading

        const robloxApi = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`;

        // Strategy: Try proxies sequentially
        const strategies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(robloxApi)}`,
            `https://corsproxy.io/?${encodeURIComponent(robloxApi)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(robloxApi)}`
        ];

        let foundUrl = null;

        try {
            for (const url of strategies) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.data && data.data.length > 0 && data.data[0].state === 'Completed') {
                            foundUrl = data.data[0].imageUrl;
                            break; // Success!
                        }
                    }
                } catch (e) {
                    console.warn("Proxy attempt failed:", e);
                }
            }

            if (foundUrl) {
                // Success Case
                previewImage.src = foundUrl;
                previewImage.classList.remove('hidden');
                previewPlaceholder.classList.add('hidden');
                previewBadge.textContent = "VALID";
                previewBadge.className = "absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded";
                previewBadge.classList.remove('hidden');

                finalUrlInput.value = foundUrl;
                submitBtn.disabled = false;
            } else {
                throw new Error("Image could not be fetched");
            }

        } catch (error) {
            console.warn("All previews failed:", error);

            // Fallback: Mostrar mensaje amigable y permitir forzar subida
            previewPlaceholder.innerHTML = `
                <div class="flex flex-col items-center w-full px-4">
                    <span class="text-xs text-red-400 font-bold mb-1">PREVIEW FAILED</span>
                    <span class="text-[10px] text-zinc-500 text-center mb-2">Proxy error or Roblox API busy.</span>
                    <button type="button" id="force-approve-btn" 
                        class="w-full py-2 bg-zinc-800 border border-zinc-600 rounded hover:bg-zinc-700 text-xs text-white transition-colors">
                        ⚠️ Force Allow ID
                    </button>
                    <span class="text-[9px] text-zinc-600 mt-1">If ID is correct, it will work in app.</span>
                </div>
            `;

            // Allow manual override
            setTimeout(() => {
                const forceBtn = document.getElementById('force-approve-btn');
                if (forceBtn) {
                    forceBtn.addEventListener('click', () => {
                        finalUrlInput.value = "FORCE_Heal_Me_Later"; // Auto-healer will fix this later
                        submitBtn.disabled = false;
                        previewBadge.textContent = "FORCE";
                        previewBadge.className = "absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded";
                        previewBadge.classList.remove('hidden');
                    });
                }
            }, 100);

        } finally {
            showLoading(false);
        }
    }

    function showLoading(isLoading) {
        if (isLoading) spinner.classList.remove('hidden');
        else spinner.classList.add('hidden');
    }

    function resetPreview() {
        previewImage.classList.add('hidden');
        previewPlaceholder.classList.remove('hidden');
        previewPlaceholder.innerHTML = `
            <svg class="w-8 h-8 opacity-50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span class="text-xs">Preview Area</span>
        `;
        previewImage.src = "";
        finalUrlInput.value = "";
        previewBadge.classList.add('hidden');
    }

    // --- 4. SUBMIT HANDLER ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        const previousText = submitBtn.innerHTML;
        submitBtn.textContent = "SAVING...";

        try {
            // Gather Data
            const type = document.querySelector('input[name="itemType"]:checked').value;
            const robloxId = idInput.value.trim();
            const name = nameInput.value.trim();
            const category = categorySelect.value;
            let remoteUrl = finalUrlInput.value;

            // Manejar caso de "Force Allowed"
            if (remoteUrl === "FORCE_Heal_Me_Later") {
                // Usamos una URL temporal o nula para que el Auto-Healer lo arregle después
                remoteUrl = null;
            }

            if (!name) throw new Error("Missing items!");

            // Determine Collection
            const collectionName = (type === 'texture') ? 'textures' :
                (type === 'facebase') ? 'facebases' : 'avatar';

            // Save to Firestore
            await addDoc(collection(db, collectionName), {
                id: robloxId,
                robloxId: robloxId,
                name: name,
                category: category,
                type: type,
                remoteUrl: remoteUrl,
                dateAdded: serverTimestamp(),
                searchName: name.toLowerCase()
            });

            // Success UI
            msg.textContent = "✅ Saved!";
            msg.className = "text-center text-xs mt-3 text-green-500 font-bold";

            // Reset Form (Partial)
            idInput.value = "";
            nameInput.value = "";
            resetPreview();
            submitBtn.disabled = true; // Wait for new valid ID

            // Success animation or delay
            setTimeout(() => {
                msg.textContent = "";
                submitBtn.innerHTML = previousText;
            }, 2000);

        } catch (error) {
            console.error("Upload failed:", error);
            msg.textContent = "❌ " + error.message;
            msg.className = "text-center text-xs mt-3 text-red-500 font-bold";
            submitBtn.disabled = false;
            submitBtn.innerHTML = previousText;
        }
    });
}
