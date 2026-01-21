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

            // 1. Fetch Real CDN URL (via proxy)
            let remoteUrl = null;
            msg.textContent = "🔍 Fetching Roblox URL...";
            try {
                // Usamos el proxy configurado en vite.config.js para evitar CORS
                const res = await fetch(`/api/roblox/v1/assets?assetIds=${robloxId}&size=420x420&format=Png&isCircular=false`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0 && data.data[0].state === 'Completed') {
                        remoteUrl = data.data[0].imageUrl;
                        console.log("Got remote URL via Proxy:", remoteUrl);
                    }
                } else {
                    console.warn("Proxy returned status:", res.status);
                }
            } catch (fetchErr) {
                console.warn("Could not fetch automatic URL (is proxy running?)", fetchErr);
            }

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
                // Clean data structure
                fullName: category === 'M' || category === 'S' ? `${category}-${name}` : name,
                variant: name,
                remoteUrl: remoteUrl, // GUARDAMOS LA URL REAL DE LA CDN
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


}
