// NEXT:

var world, glyphs = [], surface;
var font, txt = "p", x = 150, y = 200, fontSize = 150, paused = true;

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

  createGlyphs();
  noLoop();
}

function createGlyphs() {

  for (var i = glyphs.length-1; i >= 0; i--) {
    glyphs[i].kill();
    glyphs.splice(i, 1);
  }

  var glyphs = font._getGlyphs(txt), xoff = 0;
  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], {
        sampleFactor: .125,
    });

    // then draw polygons and points
    for (var j = 0; j < polys.length; j++) {

// WORKING HERE ******

      var points = polys[j].getPoints(false);
      glyphs.push(new Glyph(points, x + xoff, y, 1));
      console.log("Adding Glyph '"+glyphs[i].name+"' with "+points.length+" pts");
      break;
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

  // Display all the glyphs
  for (var i = glyphs.length-1; i >= 0; i--) {
    glyphs[i].display();
    if (glyphs[i].done()) {
      glyphs.splice(i, 1);
    }
  }

}

function mouseReleased()
{
  if (!paused)
    createGlyphs();
  paused = !paused;
}
