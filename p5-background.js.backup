let raindrops = [];
const PARTICLE_COUNT = 15; 

function setup() {
    // Se usa windowWidth y windowHeight para cubrir toda la ventana
    let canvas = createCanvas(windowWidth, windowHeight); 
    canvas.parent('particle-canvas'); 
    for (let i = 0; i < PARTICLE_COUNT; i++) { 
        raindrops.push(new Raindrop()); 
    }
}

function draw() {
    // Fondo semi-transparente para crear un rastro (blur)
    background(18, 17, 23, 15); 
    for (let drop of raindrops) { 
        drop.fall(); 
        drop.show(); 
    }
}

function windowResized() { 
    resizeCanvas(windowWidth, windowHeight); 
}

class Raindrop {
    constructor() { 
        this.x = random(width); 
        this.y = random(-500, -50); 
        this.z = random(0, 20); 
        this.len = map(this.z, 0, 20, 15, 30); 
        this.ySpeed = map(this.z, 0, 20, 1, 4); 
    }

    fall() { 
        this.y += this.ySpeed; 
        this.ySpeed += 0.02; 
        if (this.y > height) { 
            this.x = random(width); 
            this.y = random(-200, -100); 
            this.ySpeed = map(this.z, 0, 20, 1, 4); 
        } 
    }

    show() { 
        let thick = map(this.z, 0, 20, 1, 2.5); 
        strokeWeight(thick); 
        stroke('rgba(213, 184, 90, 0.5)'); // Color dorado semi-transparente
        line(this.x, this.y, this.x, this.y + this.len); 
    }
}