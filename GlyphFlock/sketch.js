// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

var flock;

function setup() {

  createCanvas(500,300);
  flock = new Flock();
  loadFont("avenir.otf", function(f) {
      createFlock(f, 80, 185, 'p5.js', 150);
  });
}

function draw() {

  var c = flock.count / flock.boids.length;
  background(c * 237, 34, 93);
  flock.run();
}

function createFlock(font, x, y, txt, size) {

  var xoff = 0, glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) { // each glyph

    // sample every 10th of glyph path length
    var polys = getPolys(glyphs[i], x, y, size, { sampleFactor: .1 });
    for (var j = 0; j < polys.length; j++) {

      // TODO: getPoints(glyph, size, options); ??
      var points = polys[j].getPoints();
      for (var k = 0; k < points.length; k++) {
        points[k].x += xoff;
        flock.boids.push(new Boid(points[k]));
      }
    }
    xoff += glyphs[i].advanceWidth * font._scale(size);
  }
}

function mouseReleased() {

  if (flock.arrived()) flock.arrived(false);
}
