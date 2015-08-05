
var world;

// A list for all of our particles
var particles = [];

// An object to store information about the uneven surface
var surface;

var font, txt = "p5*js", x = 150, y = 200, fontSize = 150, paused = true;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {
  createCanvas(640,360);

  textFont(font, fontSize);

  // Initialize box2d physics and create the world
  world = createWorld();

  // Create the surface
  surface = new Surface();

  createParticles();
}

function createParticles() {

  for (var i = particles.length-1; i >= 0; i--) {

    particles[i].kill();
    particles.splice(i, 1);
  }

  var glyphs = font._getGlyphs(txt), xoff = 0;

  for (var i = 0; i < glyphs.length; i++) {

    var polys = glyphToPolys(glyphs[i], x, y, fontSize, {

      sampleFactor: .1, // sample every 10th of path length
      simplifyThreshold: 0 // don't simplify straight lines
    });

    //  draw polygons and points
    for (var j = 0; j < polys.length; j++) {

      var points = polys[j].getPoints();

      for (var k = 0; k < points.length; k++)
        particles.push(new Particle(points[k].x + xoff, points[k].y, 3, 1));
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }
}

function draw() {

  background(237,34,93);

  // We must always step through time!
  var timeStep = paused ? 0 : 1.0/30;
  // 2nd and 3rd arguments are velocity and position iterations
  world.Step(timeStep,10,10);

  surface.display();

  fill(255);
  stroke(0);

  // Display all the particles
  for (var i = particles.length-1; i >= 0; i--) {

    particles[i].display();

    if (particles[i].done()) {
      particles.splice(i, 1);
    }
  }
}

function mouseReleased()
{
  if (!paused)
    createParticles();
  paused = !paused;
}
