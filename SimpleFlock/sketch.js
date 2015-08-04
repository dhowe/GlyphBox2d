// from Shiffman's The Nature of Code
// http://natureofcode.com

var flock, count = 0, assemble = false;

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

      for (var k = 0; k < points.length; k+=10) {

        for (var l = 0; l < 10; l++) {
          points[k].x += xoff;
          flock.boids.push(new Boid(points[k+l]));
        }
      }
    }
    xoff += glyphs[i].advanceWidth * font._scale(size);
  }
}

function draw() {
  background(237,34,93);
  fill(255);
  noStroke();
  flock.run();
}

function mouseReleased() {
  count = 0;
}
