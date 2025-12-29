// background.js - Animación de partículas con Canvas nativo (reemplazo de p5.js)

class Particle {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * -500 - 50;
        this.z = Math.random() * 20;
        this.len = this.map(this.z, 0, 20, 15, 30);
        this.ySpeed = this.map(this.z, 0, 20, 1, 4);
    }

    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    updateCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    fall() {
        this.y += this.ySpeed;
        this.ySpeed += 0.02;

        if (this.y > this.canvasHeight) {
            this.x = Math.random() * this.canvasWidth;
            this.y = Math.random() * -200 - 100;
            this.ySpeed = this.map(this.z, 0, 20, 1, 4);
        }
    }

    show(ctx) {
        const thick = this.map(this.z, 0, 20, 1, 2.5);
        ctx.strokeStyle = 'rgba(213, 184, 90, 0.5)';
        ctx.lineWidth = thick;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.len);
        ctx.stroke();
    }
}

class ParticleSystem {
    constructor(canvasId, particleCount = 15) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Failed to get 2D context');
            return;
        }

        this.particles = [];
        this.particleCount = particleCount;
        this.animationId = null;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update particle canvas dimensions
        for (const particle of this.particles) {
            particle.updateCanvasDimensions(this.canvas.width, this.canvas.height);
        }
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas.width, this.canvas.height));
        }
    }

    animate() {
        // Fondo con mayor opacidad para limpiar bien los rastros
        // Alpha más alto = limpieza más agresiva, sin acumulación
        this.ctx.fillStyle = 'rgba(18, 17, 23, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Actualizar y dibujar partículas
        for (const particle of this.particles) {
            particle.fall();
            particle.show(this.ctx);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Inicializar cuando el DOM esté listo
function initBackground() {
    console.log('Initializing particle background...');
    const system = new ParticleSystem('particle-canvas', 15);
    if (system.canvas) {
        console.log('✓ Particle background initialized successfully');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground);
} else {
    initBackground();
}
