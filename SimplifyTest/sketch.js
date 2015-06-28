var world, font, txt = "i", x = 150, y = 200, fontSize = 150;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {
  createCanvas(640,360);
  background(237,34,93);

  noFill();
  stroke(255);
  textFont(font, fontSize);

  // Initialize box2d physics and create the world
  world = createWorld();

  var pts = drawOriginal();
  simplifyPath(pts,.1);
  drawReduced(pts);

  var plys = getPolygons(pts);

  noFill();
  stroke(255);
  var xoff = 200;
  for (var i = 0; i < plys.length; i++) {
    var apts = plys[i].vertices;
    beginShape();
    for (var j = 0; j < apts.length; ++j) {
      vertex(apts[j][0]+xoff, apts[j][1]);
    }
    endShape(CLOSE);
  }
}

function getPolygons(pts) {

  pts.reverse();
  var concave = new decomp.Polygon();
  for (var k = 0; k < pts.length; k++) {
    concave.vertices.push([pts[k].x,pts[k].y]);
  }
  var plys = concave.quickDecomp();
  console.log(plys.length+' polys');
  return plys;
}


function drawReduced(pts) {

  var xoff = 100;
  beginShape();
  for (var k = 0; k < pts.length; k++) {
    vertex(pts[k].x+xoff,pts[k].y);
  }
  endShape(CLOSE);

  noStroke();
  for (var k = 0; k < pts.length; k++) {

    fill((255/pts.length)*k);
    ellipse(pts[k].x+xoff,pts[k].y,8,8);
  }
}

function drawOriginal() {
  var glyphs = font._getGlyphs(txt), xoff = 0;
  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], {
        sampleFactor: .125,
    });

    // then draw polygons and pts
    for (var j = 0; j < polys.length; j++) {
      var pts = polys[j].getPoints();
      beginShape();
      for (var k = 0; k < pts.length; k++) {
        vertex(pts[k].x+xoff,pts[k].y);
        ellipse(pts[k].x+xoff,pts[k].y,2,2);
      }
        //particles.push(new Particle(pts[k].x+xoff,pts[k].y, 4, 1));
      endShape(CLOSE);
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }
  return pts;
}


function simplifyPath(pts, angle) {

  var num = 0;
  for (var i = pts.length - 1; pts.length > 3 && i >= 0; --i) {

    if (collinear(at(pts, i - 1), at(pts, i), at(pts, i + 1), angle)) {

      // Remove the middle point
      pts.splice(i % pts.length, 1);
      num++;
    }
  }

  return num;
}
