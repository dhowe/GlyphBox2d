var world, isStatic = 0, font, txt = "J", x = 150, y = 100,
  fontSize = 120, bodies = [], paused = 1, surface;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(600,360);
  world = createWorld();
  surface = new Surface();

  var pts = extractPoints(0);

  var subs = getPolygonSubs(pts);
  bodies.push(createB2Poly(subs, 0));
  bodies.push(createB2Chain(subs,100));
  bodies.push(createB2Poly(subs, 200));
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

  for (var i = 0; i < bodies.length; i++) {
    drawB2Body(bodies[i]);
  }
}

function createB2Chain(subs,xoff) {

  var bd = new box2d.b2BodyDef();
  bd.type = !isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x+xoff, y);

  // Create the body
  var body = world.CreateBody(bd);

  if (Array.isArray(subs[0][0])) { // sub-polys
    for (var i = 0; i < subs.length; i++) {;
      var wpts = [], ppts = subs[i];
      for (var j = 0; j < ppts.length; j++) {
        wpts.push(new box2d.b2Vec2(scaleToWorld(ppts[j][0]-x),scaleToWorld(ppts[j][1]-y)));
      }
      fd = chainFixture(wpts);
      body.CreateFixture(fd);
    }
  }
  return body;
}

function chainFixture(points) {
  console.log('chainFixture: ',points);
  var fd = new box2d.b2FixtureDef();
  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  fd.shape = new box2d.b2ChainShape()
  fd.shape.CreateLoop(points, points.length);
  //fd.shape.SetAsArray(points, points.length);
  return fd;
}

function drawPolygonSubs(pts,xoff) {

  var plys = getPolygonSubs(pts);

  noFill();
  stroke(255);
  for (var i = 0; i < plys.length; i++) {
    var apts = plys[i];
    beginShape();
    for (var j = 0; j < apts.length; ++j) {
      //console.log(apts[j][0]+xoff, apts[j][1]);
      vertex(apts[j][0]+xoff, apts[j][1]);
    }
    endShape(CLOSE);
  }

  return plys;
}

function getPolygonSubs(pts) {

  var plys = doDecomp(pts);
  console.log('DECOMP: '+plys.length+' polys');

  var ptsarrays = [];
  for (var i = 0; i < plys.length; i++) {
    console.log('  '+plys[i].vertices.length + ' verts');
    ptsarrays.push(plys[i].vertices);
  }
  return ptsarrays;
}

function createB2Poly(subs,xoff) {

  var bd = new box2d.b2BodyDef();
  bd.type = !isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x+xoff, y);

  // Create the body
  var body = world.CreateBody(bd);

  if (Array.isArray(subs[0][0])) { // sub-polys
    for (var i = 0; i < subs.length; i++) {;
      var wpts = [], ppts = subs[i];
      for (var j = 0; j < ppts.length; j++) {
        wpts.push(new box2d.b2Vec2(scaleToWorld(ppts[j][0]-x),scaleToWorld(ppts[j][1]-y)));
      }
      fd = polyFixture(wpts);
      body.CreateFixture(fd);
    }
  }
  else {
    for (var i = 0; i < subs.length; i++) {  // triangles
      var wpts = [], ppts = subs[i];
      for (var j = 0; j < ppts.length; j++) {
        wpts.push(new box2d.b2Vec2(scaleToWorld(ppts[j].x-x),scaleToWorld(ppts[j].y-y)));
        //console.log(ppts[j].x,ppts[j].y);
      }
      fd = polyFixture(wpts);
      body.CreateFixture(fd);
    }
  }
  return body;
}

function drawPolygonTris(pts,xoff) {

  var plys = getPolygonTris(pts);

  noFill();
  stroke(255);
  for (var i = 0; i < plys.length; i++) {
    var apts = plys[i];
    beginShape();
    for (var j = 0; j < apts.length; ++j) {

      vertex(apts[j].x+xoff, apts[j].y);
    }
    endShape(CLOSE);
  }

  return plys;
}

function drawB2Body(body) {

  var pos = scaleToPixels(body.GetPosition());
  var a = body.GetAngleRadians();
  rectMode(CENTER);

  push();
  translate(pos.x, pos.y);
  rotate(a);

  fill(127);
  stroke(200);
  strokeWeight(2);

  beginShape();

  // Draw it!
  var f = body.GetFixtureList();
  while (f) {
    var ps = f.GetShape();
    //console.log(ps);
    // For every vertex, convert to pixel vector
    for (var i = 0; i < ps.m_count; i++) {
      var v = (ps.m_vertices[i]);
      //console.log(v.x,v.y);
      vertex(scaleToPixels(v.x), scaleToPixels(v.y));
    }
    f = f.m_next;
  }
  endShape(CLOSE);
  fill(0,0,255);
  ellipse(0,0,5,5);
  pop();
}

function polyFixture(points) {
  //console.log('polyFixture: ',points);
  var fd = new box2d.b2FixtureDef();
  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  fd.shape = new box2d.b2PolygonShape()
  fd.shape.SetAsArray(points, points.length);
  return fd;
}

function getPolygonTris(spts) {
  var sweepContext = new poly2tri.SweepContext(spts);
  poly2tri.sweep.Triangulate(sweepContext);
  var tris = sweepContext.GetTriangles();

  console.log('TRIS: '+tris.length+' polys');

  var ptsarrays = [];
  for (var i = 0; i < tris.length; i++) {

    var pts = [tris[i].GetPoint(0), tris[i].GetPoint(1), tris[i].GetPoint(2)];
    //console.log('  '+pts.length + ' verts');
    ptsarrays.push(pts);
  }

  //console.log(ptsarrays);
  return ptsarrays;
}


function doDecomp(pts) {

  var concave = new decomp.Polygon();
  for (var k = 0; k < pts.length; k++) {
    concave.vertices.push([pts[k].x,pts[k].y]);
  }
  return concave.quickDecomp();
}

function drawReduced(pts, xoff) {

  simplifyPath(pts,.1);

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

function extractPoints(xoff) {


  var pts, glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], {
        sampleFactor: .125,
    });

    // then draw polygons and pts
    for (var j = 0; j < polys.length; j++) {
      pts = polys[j].getPoints();
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

  simplifyPath(pts,.1);

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

  pts.reverse();

  return num;
}

function mouseReleased()
{
  paused = !paused;
}
