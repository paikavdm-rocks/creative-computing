function setup() {
  createCanvas(windowWidth, windowHeight);
  // Other setup codes...
}

function draw() {
  // Responsive scaling logic here
  // Draw graphics based on width and height
}

function touchStarted() {
  // Handle touch events for iPhone
  return false; // prevent default
}

function touchMoved() {
  // Handle touch moved events
  return false; // prevent default
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}