
Poly.prototype.triangulate = function(noHoles) {

  return this.tessPoly2Tri(noHoles);
}

Poly.prototype.tessPoly2Tri = function(noHoles) { // requires poly2tri.js

  console.log('tessPoly2Tri');

  var sweepContext = new poly2tri.SweepContext(this.points);
  if (this.holes && !noHoles) {
    for (var j = 0; j < this.holes.length; j++) {
      sweepContext.addHole(this.holes[j]);
    }
  }
  poly2tri.sweep.Triangulate(sweepContext);
  var tris = sweepContext.GetTriangles();

  this.triangles = [];

  for (var i = 0; i < tris.length; i++) {

    var pts = [ tris[i].GetPoint(0),
                tris[i].GetPoint(1),
                tris[i].GetPoint(2) ];

    this.triangles.push(pts);
  }

  return this.triangles;
}


Poly.prototype.tessPnltri = function(noHoles) {

  console.log('tessPnltri');

  var input = [ this.points ], all = [];

  for (var j = 0; j < this.points.length; j++) {
    all.push(this.points[j]);
  }

  if (this.holes && !noHoles) {
    for (var i = 0; i < this.holes.length; i++) {
      input.push(this.holes[i]);
      for (var k = 0; k < this.holes[i].length; k++) {
        all.push(this.holes[i][k]);
      }
    }
  }

  var pnltri = new PNLTRI.Triangulator();
  var triIdxs = pnltri.triangulate_polygon(input);

  this.triangles = [];

  for (var k = 0; k < triIdxs.length; k++) {

    var pts = [
      { x: all[ triIdxs[k][0] ].x, y: all[ triIdxs[k][0] ].y },
      { x: all[ triIdxs[k][1] ].x, y: all[ triIdxs[k][1] ].y },
      { x: all[ triIdxs[k][2] ].x, y: all[ triIdxs[k][2] ].y } ];

    this.triangles.push(pts);
  }

  return this.triangles;
}

Poly.prototype.tessEarcut = function(noHoles) { // requires earcut

  //console.log('tessEarcut: '+this.points.length);
  var contour = [], holeIdxs;

  for (var j = 0; j < this.points.length; j++) {
    contour.push(this.points[j].x);
    contour.push(this.points[j].y);
  }

  if (this.holes && !noHoles) {

    holeIdxs = [];
    //console.log('    found '+this.holes.length + ' holes');
    for (var i = 0; i < this.holes.length; i++) {
      var hpts = this.holes[i];
      holeIdxs.push(contour.length/2);
      for (var j = 0; j < hpts.length; j++) {
        //console.log('    hole-point: '+hpts[j].x,hpts[j].y);
        contour.push(hpts[j].x);
        contour.push(hpts[j].y);
      }
    }
  }

  if (this.points.length>8&&this.points.length<=27)
    console.log('    earcut('+this.points.length+', '+contour.length+', '+(holeIdxs?holeIdxs.length:0)+')');//,holeIdxs);

  var triIdxs = earcut(contour, holeIdxs);
  if (this.points.length>8&&this.points.length<=27)
    console.log(triIdxs.length);

  this.triangles = [];
  if (0&&triIdxs.length>=120) {
    return;
  }
  for (var i = 0; i < triIdxs.length; i+=3) {

    var k = i, pts = [
      { x: contour[ triIdxs[k]*2   ], y: contour[ triIdxs[k]*2   +1] },
      { x: contour[ triIdxs[k+1]*2 ], y: contour[ triIdxs[k+1]*2 +1] },
      { x: contour[ triIdxs[k+2]*2 ], y: contour[ triIdxs[k+2]*2 +1] } ];

    this.triangles.push(pts);
  }

  //console.log('    found '+this.triangles.length+' tris from '+this.points.length + ' points');

  return this.triangles;
}

Poly.prototype.tessDecomp = function(noHoles) {

  console.log('tessDecomp');

  var cloned = this.points.slice(0);
  cloned.reverse();
  this.triangles = [];

  var concave = new decomp.Polygon();
  for (var k = 0; k < this.points.length; k++) {
    concave.vertices.push([cloned[k].x, cloned[k].y]);
  }

  var plys = concave.quickDecomp();

  for (var i = 0; i < plys.length; i++) {
    var verts = plys[i].vertices, pts = [];
    for (var j = 0; j < verts.length; j++) {
      pts.push({ x: verts[j][0], y: verts[j][1] });
    }
    this.triangles.push(pts);
  }

  return this.triangles;
}

// TODO: add options
Poly.prototype.toB2Body = function(x, y, isStatic, body) {

  //console.log('toB2Body',x,y,typeof body);

  var bd = new box2d.b2BodyDef(),
    fd = new box2d.b2FixtureDef();

  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  bd.type = !isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x, y);
  //if (!body) console.log('pos',bd.position);

  body = body || world.CreateBody(bd);

  if (!this.triangles) this.triangulate();

  for (var i = 0; i < this.triangles.length; i++) {  // triangles
    var vpts = [], ppts = this.triangles[i];
    for (var j = 0; j < ppts.length; j++) {
      vpts.push(new box2d.b2Vec2(scaleToWorld(ppts[j].x),
        scaleToWorld(ppts[j].y)));
    }
    createTriFixture(fd, vpts);
    body.CreateFixture(fd);
  }

  function createTriFixture(fd, verts) {

    var pshape = new box2d.b2PolygonShape();
    pshape.SetAsArray(verts, verts.length);
    fd.shape = pshape;
    return fd;
  }

  return body;
}

//////////////////////// end Poly ////////////////////////////

function b2Dimensions(body, usePixelCoords) {
  var bb = b2Bounds(body, usePixelCoords);
  delete bb.x;
  delete bb.y;
}

function b2Bounds(body, usePixelCoords) {

  // note: might also support normalized bb

  var aabb = new box2d.b2AABB();

  aabb.lowerBound.SetXY(9999999, 9999999);
  aabb.upperBound.SetXY(-9999999, -9999999);

  // could also get aabb of each shape
  for (var f = body.GetFixtureList(); f; f = f.GetNext()) {
    aabb.Combine2(aabb, f.GetAABB(0));
  }

  var result = {
    x: aabb.lowerBound.x,
    y: aabb.lowerBound.y,
    w: (aabb.upperBound.x - aabb.lowerBound.x),
    h: (aabb.upperBound.y - aabb.lowerBound.y)
  };

  if (usePixelCoords) {

    result.x = scaleToPixels(result.x);
    result.y = scaleToPixels(result.y);
    result.w = scaleToPixels(result.w);
    result.h = scaleToPixels(result.h);
  }

  return result;
}
