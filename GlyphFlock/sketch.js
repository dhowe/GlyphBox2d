// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

var flock;

function setup() {

  createCanvas(500,300);
  flock = new Flock();
  loadFont("avenir.otf", function(f) {
      var points = pointsFromText(f, 80, 185, 'p5.js', 150);
      for (var k = 0; k < points.length; k++) {
        flock.boids.push(new Boid(points[k]));
      }
  });
}

function draw() {

  var c = flock.count / flock.boids.length;
  background(c * 237, 34, 93);
  flock.run();
}

function mouseReleased() {

  if (flock.arrived()) flock.arrived(false);
}
