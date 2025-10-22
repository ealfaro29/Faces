// modals/photos.js

export function setupPhotosModal() {
    const openPhotosBtn = document.getElementById('openPhotosBtn');
    const closePhotosBtn = document.getElementById('closePhotosBtn');
    const photosModal = document.getElementById('photosModal');
    const photoContainer = document.getElementById('photo-container');
    const prevPhotoBtn = document.getElementById('prevPhotoBtn');
    const nextPhotoBtn = document.getElementById('nextPhotoBtn');
    let currentPhotoIndex = 0;

    const downloadablePhotos = [
        { src: 'photos/modal/UK.png', filename: 'UK.png', title: 'UK Collection' },
        { src: 'photos/modal/Brazil.png', filename: 'Brazil.png', title: 'Brazil Collection' }
    ];

    if (!openPhotosBtn || !photosModal || !photoContainer) return;

    function renderSimpleGallery() {
        const slidesHTML = downloadablePhotos.map((photo, index) => `
            <div id="slide-${index}" class="photo-slide">
                <h3 class="text-xl font-semibold text-zinc-100 mb-4">${photo.title}</h3>
                <img src="${photo.src}" alt="${photo.title}">
                <a href="${photo.src}" download="${photo.filename}" class="mt-6 px-4 py-2 bg-[var(--gold2)] text-black font-semibold rounded-md hover:brightness-110 transition-all">
                    Descargar ${photo.filename}
                </a>
            </div>
        `).join('');
        
        Array.from(photoContainer.children).forEach(child => { if (child.id && child.id.startsWith('slide-')) child.remove(); });
        photoContainer.insertAdjacentHTML('afterbegin', slidesHTML);
        currentPhotoIndex = 0;
        updateGalleryDisplay(currentPhotoIndex, false);
    }

    function updateGalleryDisplay(newIndex, isNavigation = true) {
        const slides = photoContainer.querySelectorAll('.photo-slide');
        if (slides.length === 0) return;
        if (isNavigation) {
            if (newIndex >= slides.length) newIndex = 0;
            else if (newIndex < 0) newIndex = slides.length - 1;
        }
        slides.forEach((slide, index) => slide.classList.toggle('active', index === newIndex));
        currentPhotoIndex = newIndex;
        const showNav = slides.length > 1;
        if (prevPhotoBtn) prevPhotoBtn.classList.toggle('hidden', !showNav);
        if (nextPhotoBtn) nextPhotoBtn.classList.toggle('hidden', !showNav);
    }

    if (nextPhotoBtn) nextPhotoBtn.addEventListener('click', () => updateGalleryDisplay(currentPhotoIndex + 1));
    if (prevPhotoBtn) prevPhotoBtn.addEventListener('click', () => updateGalleryDisplay(currentPhotoIndex - 1));
    
    openPhotosBtn.addEventListener('click', () => { renderSimpleGallery(); photosModal.classList.add('show'); });
    if (closePhotosBtn) closePhotosBtn.addEventListener('click', () => photosModal.classList.remove('show'));
    photosModal.addEventListener('click', (e) => { if (e.target === photosModal) photosModal.classList.remove('show'); });
}