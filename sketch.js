// Birthday Cake Game

// Variables
let candles = [];  // Array to hold candle objects
let cakeArt;

function setup() {
    createCanvas(windowWidth, windowHeight);
    // Load the cake art
    cakeArt = loadImage('path/to/cake_art.png');

    // Create initial candles
    for (let i = 0; i < 5; i++) {
        candles.push(new Candle(random(width), random(100, height - 50))); // Random x position
    }
}

function draw() {
    background(135, 206, 250); // Sky blue background
    image(cakeArt, (width - cakeArt.width) / 2, height / 2);

    for (let candle of candles) {
        candle.update();
        candle.display();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Custom Candle class
class Candle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isLit = false;
    }
    update() {
        // Logic for lighting up and flickering
        if (this.isLit) {
            // Add flicker effect
            fill(255, 204, 0);
            ellipse(this.x, this.y - 20, 15, 15);
        }
    }
    display() {
        // Display the candle
        fill(150, 75, 0);
        rect(this.x, this.y, 10, 30);
    }
}

function mousePressed() {
    for (let candle of candles) {
        // Light the candle on click
        candle.isLit = true;
    }
    // Trigger confetti effect
    triggerConfetti();
}

function triggerConfetti() {
    // Logic to display confetti
    let confettiCount = 100;
    for (let i = 0; i < confettiCount; i++) {
        // Create confetti pieces
        let x = random(width);
        let y = random(-50, height);
        fill(random(255), random(255), random(255));
        ellipse(x, y, random(5, 10), random(5, 10));
    }
}