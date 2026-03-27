let facemesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

let candles = [];
let candleSounds = []; 
let confetti = [];
let airPuffs = [];
let showMessage = false;
let currentMessage = "";
let currentColor = [255, 182, 193]; 
let brightMessageColor = [255, 255, 255]; 

let bgImages = [];
let currentBG = null;
let startImage; 
let bites = []; 
let endingVideo = null;
let videoPlayed = false;
let chompSound;

let pendingCelebration = null;
let celebrationStartTime = 0;
const CELEBRATION_DELAY = 1000; 

let wasMouthOpen = false;
let cakeLayer;
let gameState = "START"; 
let displayTimer = 0;
let finalTimer = 0; 

const CELEBRATION_DURATION = 5000; 
const DELICIOUS_DURATION = 4000;    
const BITE_THRESHOLD = 26; // Set to exactly 15 as requested

function preload() {
  facemesh = ml5.faceMesh(options);
  startImage = loadImage('start.jpeg'); 
  bgImages[0] = loadImage('port.jpg'); 
  bgImages[1] = loadImage('nyc.jpg');
  bgImages[2] = loadImage('beach.jpg');
  bgImages[3] = loadImage('nyc2.jpg');
  bgImages[4] = loadImage('sandan.jpg');
  endingVideo = createVideo(['celebration.mp4']);
  endingVideo.hide();
  
  chompSound = loadSound('chomp.mp3'); 
  for(let i=0; i<5; i++) { candleSounds[i] = loadSound(`candle${i}.mp3`); }
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  cakeLayer = createGraphics(640, 480);
  facemesh.detectStart(video, gotFaces);
  chompSound.playMode('restart');
  
  candles = [
    { x: 220, y: 180, lit: true, text: "HAPPY BIRTHDAY", id: 0, c: [255, 182, 193], stripe: [255, 255, 255], brightText: [255, 105, 180] }, 
    { x: 270, y: 180, lit: true, text: "I LOVE YOU!", id: 1, c: [173, 216, 230], stripe: [255, 255, 255], brightText: [0, 191, 255] },    
    { x: 320, y: 180, lit: true, text: "YOU'RE THE BEST SISTER", id: 2, c: [255, 240, 150], stripe: [255, 255, 255], brightText: [255, 165, 0] }, 
    { x: 370, y: 180, lit: true, text: "JEREBITHIA & JEREMIAH", id: 3, c: [230, 190, 255], stripe: [255, 255, 255], brightText: [221, 160, 221] },  
    { x: 420, y: 180, lit: true, text: "HAVE AN AMAZING DAY!", id: 4, c: [190, 255, 190], stripe: [255, 255, 255], brightText: [50, 205, 50] }   
  ];
}

function gotFaces(results) { faces = results; }

function draw() {
  background(255, 182, 193); 
  if (gameState === "START") { drawStartScreen(); } 
  else if (gameState === "DELICIOUS_TEXT") { drawFinalText(); }
  else if (gameState === "VIDEO") { drawFinalVideo(); }
  else { runMainGame(); }
}

function drawStartScreen() {
  if (startImage) { imageMode(CENTER); image(startImage, width/2, height/2, 640, 480); imageMode(CORNER); }
  fill(255, 255, 255, 220); rect(width/2 - 140, height - 270, 280, 60, 10);
  fill(128, 0, 128); textAlign(CENTER, CENTER); textSize(24); text("CLICK TO BEGIN", width/2, height - 240);
}

function drawFinalText() {
  background(255, 182, 193);
  push(); 
  fill(255, 20, 147); stroke(255); strokeWeight(6); textAlign(CENTER, CENTER);
  textSize(80); text("DELICIOUS", width/2, height/2 - 40); 
  textSize(30); text("just like you", width/2, height/2 + 30); 
  pop();
  if (millis() > finalTimer) { gameState = "VIDEO"; }
}

function drawFinalVideo() {
  background(255, 182, 193);
  playEndingVideo();
}

function mousePressed() { if (gameState === "START") { userStartAudio(); gameState = "PLAY"; } }

function runMainGame() {
  let mouthX = 0, mouthY = 0, mouthOpenDist = 0;
  if (faces.length > 0) {
    let kp = faces[0].keypoints;
    mouthX = width - ((kp[13].x + kp[14].x) / 2);
    mouthY = (kp[13].y + kp[14].y) / 2;
    mouthOpenDist = dist(kp[13].x, kp[13].y, kp[14].x, kp[14].y);
  }

  if (pendingCelebration !== null && millis() > celebrationStartTime + CELEBRATION_DELAY) {
    if (candleSounds[pendingCelebration.id]) candleSounds[pendingCelebration.id].play(); 
    triggerConfetti(pendingCelebration);
    pendingCelebration = null;
  }

  if (showMessage && millis() < displayTimer) { drawCelebrationLayer(); } 
  else {
    showMessage = false; 
    push(); translate(width, 0); scale(-1, 1); image(video, 0, 0); pop();
    let allOut = candles.every(c => !c.lit);
    drawInstructions(allOut);

    if (allOut && faces.length > 0 && bites.length < BITE_THRESHOLD) {
      let isMouthOpenNow = mouthOpenDist > 10 && mouthY > 150; 
      if (isMouthOpenNow && !wasMouthOpen) {
        bites.push(generateBiteShape(mouthX, mouthY));
        chompSound.play();
      }
      wasMouthOpen = isMouthOpenNow;
    }

    cakeLayer.clear();
    drawCakeArt(cakeLayer);
    if (allOut && bites.length > 0) {
      cakeLayer.erase();
      for (let bite of bites) {
        cakeLayer.beginShape();
        for (let p of bite) {
          if (p.type === 'start' || p.type === 'line') cakeLayer.vertex(p.x, p.y);
          else cakeLayer.bezierVertex(p.x1, p.y1, p.x2, p.y2, p.x3, p.y3);
        }
        cakeLayer.endShape(CLOSE);
      }
      cakeLayer.noErase();
    }
    image(cakeLayer, 0, 0);

    if (allOut && bites.length >= BITE_THRESHOLD) {
      finalTimer = millis() + DELICIOUS_DURATION;
      gameState = "DELICIOUS_TEXT";
    }
    
    if (!allOut) handleCandles(mouthX, mouthY, mouthOpenDist);
    updateSmoke();
  }
}

function triggerConfetti(c) {
  currentBG = bgImages[c.id];
  currentMessage = c.text;
  currentColor = c.c;
  brightMessageColor = c.brightText; 
  displayTimer = millis() + CELEBRATION_DURATION; 
  showMessage = true;
  confetti = [];
  let standardColors = [color('#FFC0CB'), color('#FF69B4'), color('#00BFFF'), color('#FFD700'), color('#ADFF2F')];
  for (let i = 0; i < 200; i++) {
    confetti.push({
      x: random(width), y: random(-200, 0), w: random(8, 15), h: random(4, 7),
      speed: random(4, 9), c: random(standardColors), rotation: random(TWO_PI), rotSpeed: random(-0.1, 0.1)
    });
  }
}

function drawCelebrationLayer() {
  background(currentColor[0], currentColor[1], currentColor[2]);
  if (currentBG) {
    imageMode(CENTER); let r = min(width/currentBG.width, height/currentBG.height);
    image(currentBG, width/2, height/2, currentBG.width*r, currentBG.height*r); imageMode(CORNER);
  }
  textAlign(CENTER, CENTER); textSize(45); 
  stroke(currentColor[0]*0.4, currentColor[1]*0.4, currentColor[2]*0.4); strokeWeight(8);
  fill(0, 60); text(currentMessage, width / 2 + 3, 83); 
  stroke(255); strokeWeight(6); 
  fill(brightMessageColor[0], brightMessageColor[1], brightMessageColor[2]); text(currentMessage, width / 2, 80);
  noStroke(); 
  for (let i = confetti.length - 1; i >= 0; i--) {
    let p = confetti[i]; push(); translate(p.x, p.y); rotate(p.rotation); fill(p.c); rect(-p.w/2, -p.h/2, p.w, p.h); pop();
    p.y += p.speed; p.rotation += p.rotSpeed; if (p.y > height) confetti.splice(i, 1);
  }
}

function playEndingVideo() {
  if (!videoPlayed) { endingVideo.volume(1); endingVideo.loop(); videoPlayed = true; }
  imageMode(CENTER); let r = min(width/endingVideo.width, height/endingVideo.height);
  image(endingVideo, width/2, height/2, endingVideo.width*r, endingVideo.height*r); imageMode(CORNER);
}

function generateBiteShape(mx, my) {
  let b = []; let segs = 10; let r = random(20, 30);
  for (let i = 0; i < segs; i++) {
    let a = TWO_PI / segs * i;
    let px = mx + cos(a) * (r + random(-6, 6));
    let py = my + sin(a) * (r + random(-6, 6));
    if (i === 0) b.push({type: 'start', x: px, y: py});
    else if (i % 2 === 0) b.push({type: 'curve', x1: mx+cos(a-0.3)*r*1.1, y1: my+sin(a-0.3)*r*1.1, x2: mx+cos(a-0.1)*r*0.9, y2: my+sin(a-0.1)*r*0.9, x3: px, y3: py});
    else b.push({type: 'line', x: px, y: py});
  }
  return b;
}

function handleCandles(mx, my, mod) {
  for (let c of candles) {
    drawCandleGraphics(c);
    if (faces.length > 0 && c.lit && pendingCelebration === null) {
      if (dist(mx, my, c.x + 5, c.y + 15) < 45 && mod > 8) {
        c.lit = false; pendingCelebration = c; celebrationStartTime = millis();
        for(let i=0; i<30; i++) { 
          airPuffs.push({ x: c.x+5, y: c.y, vx: random(-1.5,1.5), vy: random(-1,-4), alpha: 220, size: random(8,20) });
        }
      }
    }
  }
}

function drawInstructions(allOut) {
  push(); textAlign(CENTER, CENTER); textSize(24); stroke(128,0,128); strokeWeight(4); fill(255);
  if (!allOut) text("BLOW OUT THE CANDLES", width/2, 40);
  else if (bites.length < BITE_THRESHOLD) text("OPEN AND CLOSE MOUTH TO EAT!", width/2, 40);
  pop();
}

function updateSmoke() {
  for (let i = airPuffs.length - 1; i >= 0; i--) {
    let p = airPuffs[i]; noStroke(); fill(220, 220, 220, p.alpha); ellipse(p.x, p.y, p.size);
    p.x += p.vx; p.y += p.vy; p.alpha -= 3; p.size += 0.4;
    if (p.alpha <= 0) airPuffs.splice(i, 1);
  }
}

function drawCandleGraphics(c) {
  noStroke(); fill(c.c); rect(c.x, c.y, 10, 35, 2);
  fill(c.stripe);
  for(let i=0; i<4; i++) {
    push(); translate(c.x, c.y + i*8); rotate(0.4); rect(0,0, 15, 3); pop();
  }
  if (c.lit) {
    let flicker = random(-2, 2);
    fill(255, 140, 0, 200); ellipse(c.x + 5 + flicker, c.y - 12, 16, 24); 
    fill(255, 255, 0); ellipse(c.x + 5 + flicker*0.5, c.y - 10, 10, 16); 
    fill(255); ellipse(c.x + 5, c.y - 8, 5, 10); 
  }
}

function drawCakeArt(pg) {
  pg.noStroke();
  pg.fill(0, 30); pg.ellipse(width/2+6, 368, 400, 85); 
  // PLATE: Porcelain Grey
  pg.fill(160, 160, 165); pg.ellipse(width/2, 350, 384, 99); 
  pg.fill(220, 220, 225); pg.ellipse(width/2, 350, 380, 95); 
  pg.fill(200, 200, 205); pg.ellipse(width/2, 350, 340, 75); 
  let tierColors = { bottom: color(255, 150, 190), top: color(255, 190, 210) };
  let bottomTierRect = { x: 180, y: 260, w: 280, h: 100 };
  let topTierRect = { x: 210, y: 215, w: 220, h: 75 };
  pg.fill(tierColors.top); pg.rect(topTierRect.x, topTierRect.y, topTierRect.w, topTierRect.h, 15);
  pg.fill(tierColors.bottom); pg.rect(bottomTierRect.x, bottomTierRect.y, bottomTierRect.w, bottomTierRect.h, 15); 
  pg.fill(255); 
  pg.rect(bottomTierRect.x, bottomTierRect.y - 1, bottomTierRect.w, 8); 
  pg.rect(topTierRect.x, topTierRect.y - 1, topTierRect.w, 8); 
  // Plate-level frosting line
  pg.rect(bottomTierRect.x, bottomTierRect.y + bottomTierRect.h - 1, bottomTierRect.w, 8); 

  pg.fill(255, 230);
  for(let i=0; i<15; i++) { pg.ellipse(bottomTierRect.x + 10 + i*19.3, bottomTierRect.y, 14, 14); }
  for(let i=0; i<12; i++) { pg.ellipse(topTierRect.x + 10 + i*18.2, topTierRect.y, 14, 14); }
  // Dots touching plate and sticking halfway up bottom icing rectangle
  for(let i=0; i<15; i++) { 
    pg.ellipse(bottomTierRect.x + 10 + i*19.3, bottomTierRect.y + bottomTierRect.h, 14, 14); 
  }
  
  let cherry_base_y = bottomTierRect.y + 45; 
  let cherry_spacing = bottomTierRect.w / 9; 
  for (let i = 0; i < 9; i++) {
    let cx = bottomTierRect.x + 20 + i * cherry_spacing; let cy = cherry_base_y;
    pg.stroke(34, 100, 34); pg.strokeWeight(2); pg.noFill(); 
    pg.bezier(cx+2, cy-8, cx+5, cy-15, cx+12, cy-22, cx+10, cy-28);
    pg.noStroke(); pg.fill(180, 0, 0); pg.ellipse(cx, cy, 20); 
    pg.fill(255, 150); pg.ellipse(cx-4, cy-4, 6, 4); 
  }
}