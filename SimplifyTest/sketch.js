var world, isStatic = 0, font, txt = "p", x = 50, y = 200,
  fontSize = 150, bodies = [], paused = 1, surface;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

// BROKEN
function setup() {

  createCanvas(780,360);
  background(237,34,93);

  noFill();
  stroke(255);
  textFont(font, fontSize);

  // Initialize box2d physics and create the world
  world = createWorld();
  surface = new Surface();

  var pts = drawOriginal(0);
  drawReduced(pts, 100);
  console.log(pts);
  var subs = drawPolygonSubs(pts,200);

  var pbody = createB2Poly(subs,300);

  var cbody = createB2Chain(subs,400);

  subs = drawPolygonTris(pts,500);
  var tbody = createB2Poly(subs,600);

  bodies.push(pbody,cbody,tbody);

  for (var i = 0; i < bodies.length; i++)
    drawB2Body(bodies[i]);
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

  console.log(pts);
  var plys = doDecomp(pts);
  console.log(plys);
  var ptsarrays = [];
  for (var i = 0; i < plys.length; i++) {
    ptsarrays.push(plys[i].vertices);
  }
  return ptsarrays;
}

function createB2Poly(subs,xoff) {

  if (!subs || !subs.length) throw Error('No points!');

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

  if (!body) return;

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
  for (var k = 0; k < pts.length; k++)
    concave.vertices.push([pts[k].x,pts[k].y]);
  return concave.quickDecomp();
}

function drawReduced(pts, xoff) {

  simplify(pts,.1);

  beginShape();
  for (var k = 0; k < pts.length; k++) {
    vertex(pts[k].x+xoff,pts[k].y);
  }
  endShape(CLOSE);

  noStroke();
  for (var k = 0; k < pts.length; k++) {

    fill((255-(255/pts.length)*k));
    ellipse(pts[k].x+xoff,pts[k].y,6,6);
  }
}

function drawOriginal(xoff) {

  var glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], x, y, fontSize, {
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

function mouseReleased()
{
  paused = !paused;
}
