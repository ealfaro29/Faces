// admin/admin-modal.js
import { auth, db } from '../core/firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getRobloxThumbnailUrl } from '../utils/roblox.js';

export function initAdminPanel() {
    // DOM Elements
    const adminOpenBtn = document.getElementById('nav-admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminCloseBtn = document.getElementById('admin-close-btn');

    // Views
    const authView = document.getElementById('admin-auth-view');
    const dashboardView = document.getElementById('admin-dashboard-view');

    // Auth Form
    const loginForm = document.getElementById('admin-login-form');
    const signupBtn = document.getElementById('admin-signup-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const authStatus = document.getElementById('auth-status');
    const userEmailSpan = document.getElementById('admin-user-email');

    // Upload Form
    const uploadForm = document.getElementById('quick-upload-form');
    const robloxIdInput = document.getElementById('new-roblox-id');
    const previewContainer = document.getElementById('new-item-preview');
    const typeRadios = document.querySelectorAll('input[name="itemType"]');
    const categoryGroups = document.querySelectorAll('.category-options-group'); // Containers for dynamic categories

    let currentUser = null;

    // --- 1. MODAL TOGGLE (Delegation) ---
    document.addEventListener('click', (e) => {
        // Open
        if (e.target.closest('#nav-admin-btn')) {
            console.log("Admin button clicked");
            adminModal.classList.remove('hidden');
            // Force redraw for transition
            setTimeout(() => adminModal.classList.add('show'), 10);
        }
        // Close
        if (e.target.closest('#admin-close-btn') || e.target === adminModal) {
            adminModal.classList.remove('show');
            setTimeout(() => adminModal.classList.add('hidden'), 300);
        }
    });

    // --- 2. AUTH STATE LISTENER ---
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            authView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            userEmailSpan.textContent = user.email;
        } else {
            authView.classList.remove('hidden');
            dashboardView.classList.add('hidden');
        }
    });

    // --- 3. LOGIN / SIGNUP ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        if (!email || !password) return;

        try {
            authStatus.textContent = "Logging in...";
            authStatus.className = "text-center text-xs mt-2 text-zinc-400";
            await signInWithEmailAndPassword(auth, email, password);
            authStatus.textContent = "";
            loginForm.reset();
        } catch (error) {
            authStatus.textContent = "Error: " + error.message;
            authStatus.className = "text-center text-xs mt-2 text-red-500";
        }
    });

    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        if (!email || !password) {
            authStatus.textContent = "Enter email & password to register";
            authStatus.className = "text-center text-xs mt-2 text-red-500";
            return;
        }

        try {
            authStatus.textContent = "Creating account...";
            await createUserWithEmailAndPassword(auth, email, password);
            authStatus.textContent = "Created! logging in...";
        } catch (error) {
            authStatus.textContent = error.message;
            authStatus.className = "text-center text-xs mt-2 text-red-500";
        }
    });

    logoutBtn.addEventListener('click', () => signOut(auth));


    // --- 4. DYNAMIC FORM LOGIC ---
    // Handle Type change to show correct categories
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCategoryView(e.target.value);
        });
    });

    function updateCategoryView(type) {
        // Hide all first
        document.getElementById('cat-options-texture').classList.add('hidden');
        document.getElementById('cat-options-facebase').classList.add('hidden');
        document.getElementById('cat-options-avatar').classList.add('hidden');

        // Show relevant
        if (type === 'texture') document.getElementById('cat-options-texture').classList.remove('hidden');
        else if (type === 'facebase') document.getElementById('cat-options-facebase').classList.remove('hidden');
        else if (type === 'avatar') {
            document.getElementById('cat-options-avatar').classList.remove('hidden');
            document.getElementById('cat-options-avatar').classList.add('flex'); // restore flex
        }
    }

    // Auto-Preview Roblox Image
    robloxIdInput.addEventListener('input', (e) => {
        const id = e.target.value;
        if (id && id.length > 5) {
            const url = getRobloxThumbnailUrl(id);
            previewContainer.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        } else {
            previewContainer.innerHTML = '<span class="text-xs text-zinc-600">?</span>';
        }
    });

    // --- 5. UPLOAD HANDLER ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const subBtn = document.getElementById('admin-submit-btn');
        const msg = document.getElementById('admin-msg');

        subBtn.disabled = true;
        subBtn.textContent = "Saving...";
        msg.textContent = "";

        try {
            // Get values
            const type = document.querySelector('input[name="itemType"]:checked').value;
            const robloxId = robloxIdInput.value;
            const name = document.getElementById('new-item-name').value;

            // Get category based on active view
            let category = "General";
            if (type === 'texture') {
                const checked = document.querySelector('input[name="itemCategory"]:checked');
                if (checked) category = checked.value; // M, S, T...
            } else if (type === 'facebase') {
                category = document.getElementById('cat-options-facebase').value;
            } else if (type === 'avatar') {
                const checked = document.querySelector('#cat-options-avatar input:checked');
                if (checked) category = checked.value;
            }

            if (!name || !robloxId) throw new Error("Missing fields");

            // Define target collection
            let collectionName = 'items';
            if (type === 'texture') collectionName = 'textures';
            else if (type === 'facebase') collectionName = 'facebases';
            else if (type === 'avatar') collectionName = 'avatar';

            // Add to Firestore
            await addDoc(collection(db, collectionName), {
                id: robloxId,
                robloxId: robloxId,
                name: name,
                category: category,
                type: type,
                // For Textures, JSON uses 'fullName' sometimes, but 'name' + category logic handles it in app
                // We'll store cleaner data now
                fullName: category === 'M' || category === 'S' ? `${category}-${name}` : name, // Helper for old logic?
                variant: name, // For facebases
                dateAdded: serverTimestamp()
            });

            msg.textContent = "✅ Item Added Successfully!";
            msg.className = "text-center text-xs mt-2 text-green-500";
            uploadForm.reset();
            previewContainer.innerHTML = '<span class="text-xs text-zinc-600">?</span>';

            // Reset view to default
            typeRadios[0].checked = true;
            updateCategoryView('texture');

        } catch (error) {
            console.error(error);
            msg.textContent = "❌ Error: " + error.message;
            msg.className = "text-center text-xs mt-2 text-red-500";
        } finally {
            subBtn.disabled = false;
            subBtn.textContent = "ADD ITEM";
            setTimeout(() => { msg.textContent = ""; }, 3000);
        }
    });

    // --- 6. MIGRATION TOOL (One-off) ---
    const migrateBtn = document.getElementById('run-migration-btn');
    const migrateMsg = document.getElementById('migration-msg');

    if (migrateBtn) {
        let migrationStep = 0; // 0: Idle, 1: Confirming

        migrateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evita cerrar el modal

            if (migrationStep === 0) {
                // Paso 1: Pedir confirmación
                migrationStep = 1;
                migrateBtn.textContent = "⚠️ Are you sure? Click again to START.";
                migrateBtn.style.color = "#fbbf24"; // Warning color

                // Timeout para resetear si no confirma
                setTimeout(() => {
                    if (migrationStep === 1) {
                        migrationStep = 0;
                        migrateBtn.textContent = "Run Migration (One-time)";
                        migrateBtn.style.color = "";
                    }
                }, 3000);
                return;
            }

            // Paso 2: Ejecutar
            if (!auth.currentUser) {
                migrationStep = 0;
                migrateBtn.textContent = "Run Migration (One-time)";
                migrateBtn.style.color = "";
                migrateMsg.textContent = "❌ Error: You must be logged in first!";
                migrateMsg.className = "status-text text-red-500";
                return;
            }

            migrationStep = 0;
            migrateBtn.disabled = true;
            migrateBtn.textContent = "⏳ Reading database.json...";
            migrateMsg.textContent = "Starting migration...";

            try {
                const res = await fetch('./database.json');
                if (!res.ok) throw new Error("Could not read database.json");

                const data = await res.json();
                let total = 0;

                // Simple sequential upload
                if (data.textures) {
                    migrateMsg.textContent = "Migrating Textures...";
                    for (const item of data.textures) {
                        // Evitar duplicados simples chequeando ID si quisiéramos, pero por ahora raw push
                        await addDoc(collection(db, 'textures'), { ...item, migrated: true });
                        total++;
                    }
                }
                if (data.facebases) {
                    migrateMsg.textContent = "Migrating Facebases...";
                    for (const item of data.facebases) {
                        await addDoc(collection(db, 'facebases'), { ...item, migrated: true });
                        total++;
                    }
                }
                if (data.avatar) {
                    migrateMsg.textContent = "Migrating Avatar Items...";
                    for (const item of data.avatar) {
                        await addDoc(collection(db, 'avatar'), { ...item, migrated: true });
                        total++;
                    }
                }

                migrateMsg.textContent = `✅ Success! Uploaded ${total} items.`;
                migrateMsg.className = "status-text text-green-400";
                migrateBtn.textContent = "Migration Complete";

            } catch (e) {
                console.error(e);
                migrateMsg.textContent = "Error: " + e.message;
                migrateMsg.className = "status-text text-red-500";
                migrateBtn.textContent = "Retry Migration";
                migrateBtn.disabled = false;
            }
        });
    }
}
