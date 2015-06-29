var world, isStatic = false, font, txt = "5", x = 50, y = 250,
  fontSize = 220, bodies = [], paused = 1, surface, MAX=1;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {
  //frameRate(1);
  createCanvas(600,360);
  world = createWorld();
  surface = new Surface();

  var pts = extractPoints(0);

  //var subs = getPolygonSubs(pts);
  //bodies.push(createB2Poly(subs, 0));
  //bodies.push(createB2Chain(subs,100));

  var tris = getPolygonTris(pts);

  background(237,34,93);
  stroke(255);

  for (var i = 0; i < tris.length; i++) {
    beginShape();
    var tri = tris[i];
    fill(random(0,255),random(0,255),random(0,255));
    for (var j = 0; j < 3; j++)
      vertex(tri[j].x,tri[j].y);
    endShape(CLOSE);
  }

  b2PolyFromTris(tris, 300);
  b2Tris(tris,100)
  //for (var i = 0; i < bodies.length; i++)
    //drawB2Body(bodies[i]);
  console.log('paused: '+paused);
}

function draw() {

  background(237,34,93);

  var timeStep = paused ? 0 : 1.0/30;
  world.Step(timeStep,10,10);

  surface.display();

  for (var i = 0; i < bodies.length; i++)
    drawB2Body(bodies[i]);
}


function drawB2Body(body) {

  var pos = scaleToPixels(body.GetPosition());
  var wc = scaleToPixels(body.GetWorldCenter());
  var a = body.GetAngleRadians();

  fill(127);
  stroke(200);

  push();
  translate(pos.x, pos.y);
  rotate(a);

  for (var k=0, f = body.GetFixtureList(); f; f = f.m_next) {
    var ps = f.GetShape();
    beginShape();
    for (var i = 0; i < ps.m_count; i++) {
      var vert = ps.m_vertices[i];
      vertex(scaleToPixels(vert.x), scaleToPixels(vert.y));
    }
    endShape();
    //if (++k >= MAX) break;
  }

  pop();

  fill(255,255,0);
  ellipse(wc.x,wc.y,5,5);
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

function b2Tris(subs,xoff) {

  var bd = new box2d.b2BodyDef(),
    fd = new box2d.b2FixtureDef();

  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  bd.type = !isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x+xoff, y);

  for (var i = 0; i < subs.length; i++) {  // triangles

    var body = world.CreateBody(bd);

    var wpts = [], ppts = subs[i];
    for (var j = 0; j < ppts.length; j++) {
      var bv = new box2d.b2Vec2(scaleToWorld(ppts[j].x-x),scaleToWorld(ppts[j].y-y))
      console.log(bv);
      wpts.push(bv);
    }
    console.log('-----------------');
    polyFixture(fd, wpts);
    body.CreateFixture(fd);
    bodies.push(body);
  }
}

function b2PolyFromTris(subs,xoff) {

  var body, bd = new box2d.b2BodyDef(),
    fd = new box2d.b2FixtureDef();

  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  bd.type = !isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x+xoff, y);

  body = world.CreateBody(bd);

  for (var i = 0; i < subs.length; i++) {  // triangles
    var wpts = [], ppts = subs[i];
    for (var j = 0; j < ppts.length; j++) {
      var bv = new box2d.b2Vec2(scaleToWorld(ppts[j].x-x),scaleToWorld(ppts[j].y-y))
      console.log(bv);
      wpts.push(bv);
    }
    console.log('-----------------');
    polyFixture(fd, wpts);
    body.CreateFixture(fd);
  }

  bodies.push(body);

  return body;
}

function polyFixture(fd, triPts) {

  var pshape = new box2d.b2PolygonShape();
  pshape.SetAsArray(triPts, triPts.length);
  console.log('polyFixture: ',triPts.length);
  fd.shape = pshape;
  return fd;
}

function createB2Poly(subs,xoff) {

  var bd = new box2d.b2BodyDef(),
    fd = new box2d.b2FixtureDef();

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
      polyFixture(fd, wpts);
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
      polyFixture(fd, wpts);
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



function getPolygonTris(spts) {
  var sweepContext = new poly2tri.SweepContext(spts);
  poly2tri.sweep.Triangulate(sweepContext);
  var tris = sweepContext.GetTriangles();

  console.log('TRIS: '+tris.length+' polys');

  var ptsarrays = [];
  for (var i = 0; i < tris.length; i++) {

    var pts = [tris[i].GetPoint(0), tris[i].GetPoint(1), tris[i].GetPoint(2)];
    console.log('  '+pts.length + ' verts');
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

function extractPoints() { // TODO: handle multiple paths, eg 'j'

  var pts, glyphs = font._getGlyphs(txt), xoff = 0;

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], {
        sampleFactor: .125,
    });

    // then draw polygons and pts
    for (var j = 0; j < polys.length; j++) {
      pts = polys[j].getPoints();
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }

  simplifyPath(pts,.1);

  return pts;
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
  //console.log('chainFixture: ',points);
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


function simplifyPath(pts, angle) {

  var num = 0;
  for (var i = pts.length - 1; pts.length > 3 && i >= 0; --i) {

    if (collinear(at(pts, i - 1), at(pts, i), at(pts, i + 1), angle)) {

      // Remove the middle point
      pts.splice(i % pts.length, 1);
      num++;
    }
  }

  //pts.reverse();

  return num;
}

function mouseReleased()
{
  paused = !paused;
  //MAX++;console.log(MAX);
}
