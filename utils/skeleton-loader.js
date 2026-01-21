// utils/skeleton-loader.js

/**
 * Agrega skeleton loading a todas las imágenes con lazy loading
 * Muestra un skeleton mientras la imagen carga y lo oculta cuando termina
 * Optimizado para mejor performance
 */
export function initSkeletonLoaders() {
    // Observador para detectar cuando las imágenes entran en el viewport
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                setupImageSkeleton(img);
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px', // Empezar a cargar 100px antes (mejor UX)
        threshold: 0.01 // Trigger tan pronto como sea visible
    });

    // Observar todas las imágenes lazy
    const observeImages = () => {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]:not([data-skeleton-initialized])');
        lazyImages.forEach(img => {
            img.dataset.skeletonInitialized = 'true';

            // Si la imagen ya está en cache y cargada
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.add('image-loaded');
                img.classList.remove('image-loading');
            } else {
                // Agregar clase de loading inicial
                img.classList.add('image-loading');
                imageObserver.observe(img);
            }
        });
    };

    // Observar imágenes iniciales
    observeImages();

    // Crear un MutationObserver para detectar nuevas imágenes agregadas dinámicamente
    // Debounce para evitar llamadas excesivas  
    let mutationTimeout;
    const mutationObserver = new MutationObserver(() => {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(observeImages, 100); // Debounce de 100ms
    });

    // Observar cambios en el DOM solo en contenedores relevantes
    const contentWrapper = document.getElementById('tab-content-wrapper');
    if (contentWrapper) {
        mutationObserver.observe(contentWrapper, {
            childList: true,
            subtree: true
        });
    }

    // Exponer función para forzar actualización manual
    window.updateSkeletonLoaders = observeImages;
}

/**
 * Configura el skeleton loader para una imagen específica
 * Optimizado para minimizar reflows y repaints
 */
function setupImageSkeleton(img) {
    // Saltar si es un icono pequeño (mejora performance)
    if (img.classList.contains('variant-button') ||
        img.classList.contains('texture-type-icon') ||
        img.width < 50) {
        return;
    }

    // Crear contenedor skeleton si no existe
    let skeletonWrapper = img.previousElementSibling;
    if (!skeletonWrapper || !skeletonWrapper.classList.contains('image-skeleton')) {
        skeletonWrapper = document.createElement('div');
        skeletonWrapper.className = 'image-skeleton';

        // Usar properties en lugar de styles individuales (mejor performance)
        Object.assign(skeletonWrapper.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '1'
        });

        const parent = img.parentElement;
        // Batch DOM reads and writes para evitar layout thrashing
        const parentPosition = getComputedStyle(parent).position;

        if (parentPosition === 'static') {
            parent.style.position = 'relative';
        }

        // Insertar skeleton antes de la imagen (single DOM write)
        parent.insertBefore(skeletonWrapper, img);

        // Configurar z-index de imagen
        Object.assign(img.style, {
            position: 'relative',
            zIndex: '2'
        });
    }

    // Evento cuando la imagen se carga (usar requestAnimationFrame para smooth transition)
    const handleImageLoad = () => {
        requestAnimationFrame(() => {
            img.classList.remove('image-loading');
            img.classList.add('image-loaded');

            // Remover skeleton después de la transición
            setTimeout(() => {
                if (skeletonWrapper?.parentElement) {
                    skeletonWrapper.remove();
                }
            }, 300);
        });
    };

    // Evento si la imagen falla al cargar
    const handleImageError = () => {
        img.classList.remove('image-loading');
        skeletonWrapper?.remove();
    };

    // Agregar event listeners con { once: true, passive: true } para mejor performance
    img.addEventListener('load', handleImageLoad, { once: true, passive: true });
    img.addEventListener('error', handleImageError, { once: true, passive: true });

    // Si la imagen ya está cargada (por ejemplo, desde cache)
    if (img.complete && img.naturalHeight !== 0) {
        handleImageLoad();
    }
}
