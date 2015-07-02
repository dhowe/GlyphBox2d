var world, isStatic = false, font, txt = "p%5", x = 100, y = 125, fontSize = 150;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {
  //frameRate(1);
  createCanvas(500,500);
  world = createWorld();
  surface = new Surface();

  //var pts = extractPoints();
//console.log(pts);
//return;
  //var subs = getPolygonSubs(pts);
  //bodies.push(createB2Poly(subs, 0));
  //bodies.push(createB2Chain(subs,100));


  background(100);
  noStroke();

  var noHoles = false;
  var libs = [ 'triangulatePoly2Tri', 'triangulateEarcut', 'triangulatePnltri' ];
  for (var h = 0; h < libs.length; h++) {

    var tris = getPolygonTris(libs[h], noHoles), yoff = h * 150, total = 0;
    for (var k = 0; k < tris.length; k++) {
      var ptlist = tris[k];//k * fontSize*.7;
      push();
      translate(0,yoff);
      for (var i = 0; i < ptlist.length; i++) {
        fill(random(0,255),random(0,255),random(0,255));
        beginShape();
        for (var j = 0; j < 3; j++) {
          vertex(ptlist[i][j].x, ptlist[i][j].y);
          //console.log(ptlist[j].x, ptlist[j].y);
        }
        endShape(CLOSE);
      }
      pop();
    }

    stroke(255);
    line(0, y+yoff,width, y+yoff);
    fill(255);
    noStroke();
    text(libs[h].replace('triangulate',''), x-50, y+yoff);

  }

  //b2PolyFromTris(tris, 300);
  //b2Tris(tris,100)
  //for (var i = 0; i < bodies.length; i++)
    //drawB2Body(bodies[i]);
}

function getPolygonTris(trilib, noHoles) { // returns set of 2d[] of tris

  var result = [], glyphs = font._getGlyphs(txt), xoff = 0;

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], x + xoff, y, fontSize);

    // then get polygons and pts
    for (var j = 0; j < polys.length; j++) {

      polys[j].simplify();
      polys[j][trilib](noHoles);
      result.push(polys[j].triangles);
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }

  return result;
}

function drawX() {

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
  //console.log('DECOMP: '+plys.length+' polys');

  var ptsarrays = [];
  for (var i = 0; i < plys.length; i++) {
    //console.log('  '+plys[i].vertices.length + ' verts');
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





function doDecomp(pts) {

  var concave = new decomp.Polygon();
  for (var k = 0; k < pts.length; k++) {
    concave.vertices.push([pts[k].x,pts[k].y]);
  }
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

    fill((255/pts.length)*k);
    ellipse(pts[k].x+xoff,pts[k].y,8,8);
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


function mouseReleased()
{
  paused = !paused;
  //MAX++;console.log(MAX);
}
