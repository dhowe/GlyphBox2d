// NEXT:


var font, txt = "p", x = 150, y = 200, fontSize = 150, paused = true;
var world, bodies = [], surface;

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

  /for (var i = shapes.length-1; i >= 0; i--) {
    shapes[i].kill();
    shapes.splice(i, 1);
  }*/

  var glyphs = font._getGlyphs(txt), xoff = 0;
  console.log(glyphs);

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], {
        sampleFactor: .125,
    });

    // then draw polygons and points
    for (var j = 0; j < polys.length; j++) {

      //var points = polys[j].getPoints(false);
      //shapes.push(new Glyph(points, x + xoff, y, 1));
      polys[i].decompose();
      bodies.push(toPhysics(polys[i].decomposed, true));

      //console.log("Adding Glyph '"+glys[i].name+"' with "+points.length+" pts");
      break;
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }

}
function toPhysics(subs, isStatic ) {

    // Define a body
    var bd = new box2d.b2BodyDef();
    bd.type = isStatic ? box2d.b2BodyType.b2_dynamicBody :
      box2d.b2BodyType.b2_staticBody;

    bd.position = scaleToWorld(x, y);

    // Define a fixture
    var fd = new box2d.b2FixtureDef();

    // Some physics
    fd.density = 1.0;
    fd.friction = 0.1;
    fd.restitution = 0.4;

    // Create the body
    var body = world.CreateBody(bd);

    for (var i = 0; i < subs.length; i++) {
      var subpoints = subs[i];
      var bpts = [] ;
      console.log(i);
      for (var j = 0; j < subpoints.length; j++) {
        //console.log('  ',subpoints[j]);
        var bpt = { x:subpoints[j][0],
                    y:subpoints[j][1]};
        bpts.push(bpt  );
      }

      addShape(body, fd, bpts, i);
    }
    //console.log(body);
    return body;
}

function addShape(body, fixDef, verts, id) {

  var boxDef = new box2d.b2PolygonShape();
  try {
    //console.log(verts);
    boxDef.SetAsVector(verts);
  } catch (e) {
    console.error("Error adding fixture #" + id + "\n" + e + "\n" + dump(verts));
    return;
  }
  fixDef.shape = boxDef;
  body.CreateFixture(fixDef);
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

  // Display all the glys
  /*for (var i = shapes.length-1; i >= 0; i--) {
    shapes[i].display();
    if (shapes[i].done()) {
      shapes.splice(i, 1);
    }
  }*/
  for (var i = bodies.length-1; i >= 0; i--) {
    //console.log('draw'+i);
    drawBody(bodies[i]);
  }

}

function drawBody(body) {
  var pos = scaleToPixels(body.GetPosition());
  var a = body.GetAngleRadians();
  rectMode(CENTER);

  push();
  translate(pos.x, pos.y - 100);
  rotate(a);
  fill(127);
  stroke(200);
  strokeWeight(2);
  //ellipse(0,0,20,20);
  beginShape();

  // Draw it!
  var f = body.GetFixtureList();
  while (f) {
    var ps = f.GetShape();
    console.log(ps);
    // For every vertex, convert to pixel vector
    for (var i = 0; i < ps.m_count; i++) {
      var v = (ps.m_vertices[i]);
      //console.log(v.x,v.y);
      vertex(v.x, v.y);
    }
    f = f.m_next;
  }
  endShape(CLOSE);
  pop();
  //drawd = 1;
}

function mouseReleased()
{
  if (!paused)
    createGlyphs();
  paused = !paused;
}
