// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

var flock, count = 0;

function preload() {

  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(640,360);
  createFlock(150, 220, 'p5.js', 150);
}

function createFlock(x, y, txt, size) {

  flock = new Flock();

  var xoff = 0, glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) {

    // sample every 10th of path length
    var polys = getPolys(glyphs[i], x, y, size, { sampleFactor: .1 });

    //  draw polygons and points
    for (var j = 0; j < polys.length; j++) {

      var points = polys[j].getPoints(),
        target = createVector(width/2,height/2);

      for (var k = 0; k < points.length; k++) {
        points[k].x += xoff;
        flock.boids.push(new Boid(points[k]));
      }
    }
    xoff += glyphs[i].advanceWidth * font._scale(size);
  }
}

function draw() {

  var c = count/flock.boids.length;
  background(c*237,34,93);
  fill(255);
  noStroke();

  flock.run();
}

function mouseReleased() {
  if (flock.arrived()) count = 0;
}
