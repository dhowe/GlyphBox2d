var world, isStatic = false, font, txt = "p5#js", x = 150, y = 200,
  fontSize = 125, paused = 1, surface, MAX=1;

// TODO:
// NEXT: add holes to letters
// BUG: i or j with fontSize 120-123,140 **
// BUG: # with fontSize 150 **

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(600,360);
  world = createWorld();
  surface = new Surface();

  bodies = makeGlyphs();
  console.log("body count: ", bodies.length);
  draw();
}

function draw() {

  background(237,34,93);

  var timeStep = paused ? 0 : 1.0/30;
  world.Step(timeStep,10,10);

  surface.display();

  for (var i = 0; i < bodies.length; i++)
    drawB2Body(bodies[i],i);

  line(0,y,width,y);
  line(x,0,x,height);

  drawd=1;
}

function makeGlyphs() { // TODO: handle holes

  var body, count, gbodies = [], xoff = 0;

  var glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) {

    // TODO: should this take x,y or no? prob no
    var polys = getPolys(glyphs[i], 0, 0, fontSize, {
        sampleFactor: .125,
    });

    body = undefined;
    for (var j = 0; j < polys.length; j++) {

      polys[j].simplify(.1);
      polys[j].triangulate().length;

      // TODO: should this take x+xoff or just xoff?

      // use the same body if we have one for this glyph
      body = polys[j].toB2Body(x + xoff, y, false, body);
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
    gbodies.push(body);
  }

  return gbodies;
}

var drawd;
function drawB2Body(body,id) {

  //if (id ==1) return;

  var pos = scaleToPixels(body.GetPosition());
  var wc = scaleToPixels(body.GetWorldCenter());
  var wcx = wc.x-pos.x, wcy = wc.y-pos.y;
  var a = body.GetAngleRadians();
  var bb = b2Bounds(body, true);

  //if (!drawd) console.log(id, body.GetPosition(), pos, bb);

  fill(127);
  stroke(200);

  push();
  translate(pos.x, pos.y);
  rotate(a);

  for (var f = body.GetFixtureList(); f; f = f.GetNext()) {
    var ps = f.GetShape();
    beginShape();
    for (var i = 0; i < ps.m_count; i++) {
      //console.log(scaleToPixels(ps.m_vertices[i].x),
        //scaleToPixels(ps.m_vertices[i].y));
      vertex(scaleToPixels(ps.m_vertices[i].x),
        scaleToPixels(ps.m_vertices[i].y));
    }
    endShape();
  }

  noStroke();
  fill(255,255,0);
  text(id+"",0,0);

  pop();

  fill(255,255,0);
  ellipse(wc.x,wc.y,4,4);
  noFill();
  stroke(255,255,0);
  rect(bb.x,bb.y,bb.w,bb.h);
}

function mouseReleased()
{
  paused = !paused;
  //MAX++;console.log(MAX);
}
