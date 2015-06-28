// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// A rectangular box


// Constructor
function Glyph(points, x, y, isStatic) {

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

  //console.log(newpts);

  // Create the body
  this.body = world.CreateBody(bd);
  //simplifyPathPts(newpts);

  // for (var i = 0; i < vecs.length; i++) {
  //   console.log(vecs[i].x, vecs[i].y);
  // }

  var tris = getTriangles(points);
  //console.log(tris);
  //return;
  for (var i = 0; i < tris.length; i++) {
    var verts = [tris[i].GetPoint(0), tris[i].GetPoint(1), tris[i].GetPoint(2)];
    addShape(this.body, fd, verts, i);
  }

  function getTriangles(points) {

    // var newpts = []
    // for (var i = 1; i < points.length; i++) {
    //   var m = points[i - 1], n = points[i], o = points[(i + 1) % points.length];
    //   if ((o.y == n.y && o.y == m.y) || (o.x == n.x && o.x == m.x)) {
    //       //console.log("skipping "+i);
    //       continue;
    //   }
    //   newpts.push(new poly2tri.Point(scaleToWorld(points[i].x), scaleToWorld(points[i].y)))
    //   //points[i].x  = scaleToWorld(points[i].x)
    //   //points[i].y  = scaleToWorld(points[i].y)
    // }
    var spts = simplifyPath(points);
    var sweepContext = new poly2tri.SweepContext(spts);
    poly2tri.sweep.Triangulate(sweepContext);
    return sweepContext.GetTriangles();
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

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(random(-5, 5), random(2, 5)));
  this.body.SetAngularVelocity(random(-5, 5));

  // This function removes the particle from the box2d world
  this.kill = function() {
    world.DestroyBody(this.body);
  }

  // Is the particle ready for deletion?
  this.done = function() {
    // Let's find the screen position of the particle
    var transform = this.body.GetTransform();
    var pos = scaleToPixels(transform.position);
    // Is it off the bottom of the screen?
    if (pos.y > height + this.r * 2) {
      this.killBody();
      return true;
    }
    return false;
  }

  var drawd;

  this.display = function() {
    // Get the body's position
    var pos = scaleToPixels(this.body.GetPosition());
    // Get its angle of rotation
    var a = this.body.GetAngleRadians();

    // Draw it!
    //var f = this.body.GetFixtureList();
    //var ps = f.GetShape();

    rectMode(CENTER);
    push();
    translate(pos.x, pos.y - 100);
    //println(pos.x + " " + pos.y);
    rotate(a);
    fill(127);
    stroke(200);
    strokeWeight(2);
    //ellipse(0,0,20,20);
    beginShape();

    // Draw it!
    var f = this.body.GetFixtureList();
    while (f) {
      var ps = f.GetShape();
      // For every vertex, convert to pixel vector
      for (var i = 0; i < ps.m_count; i++) {
        var v = scaleToPixels(ps.m_vertices[i]);
        vertex(v.x, v.y);
      }
      f = f.m_next;
    }
    endShape(CLOSE);
    pop();
    drawd = 1;
  }

  // Drawing the Particle
  this.displayC = function() {

    // Get the body's position
    var pos = scaleToPixels(this.body.GetPosition());
    //console.log(pos);
    // Get its angle of rotation
    var a = this.body.GetAngleRadians();
    var fl = this.body.GetFixtureList();
    var wc = this.body.GetWorldCenter()
    var xf = this.body.GetTransform();
    //if (!drawd) console.log(a,fl,wc);
    var f = this.body.GetFixtureList()
    var verts = fl.GetShape().m_vertices
    if (!drawd) console.log(fl.GetShape().m_vertices);
    //PolygonShape s = f.shape;

    // this is needed to temporarily keep the vertex, getVertex is a void method
    // var tmp = [];
    // for (int i = 0; i < s.getVertexCount(); i++) {
    //     // fill tmp with the vertex
    //     //console.log(s[i]);
    // }
    // Draw it!
    rectMode(CENTER);
    push();
    translate(pos.x, pos.y);
    rotate(a);
    fill(255);
    //stroke(200);
    //strokeWeight(.5);
    //noStroke();
    var i = 0;
    //ellipse(0,0,wc.x,wc.y);
    // for (var f = this.body.GetFixtureList(); f; f = f.m_next) {
    //
    //   //this.drawPolyShape(f.GetShape(), this.body.m_xf);
    //   if (!drawd) console.log(i++,f.GetShape());
    // }
    // Let's add a line so we can see the rotation
    //line(0,0,this.r,0);
    beginShape();
    var s = '[';
    //if (!drawd) console.log(ps.m_vertices);
    for (var i = 0; i < verts.length; ++i) {
      var vert = box2d.MulX(xf, verts[i])
      vertex(vert[i].x, vert[i].y);
      s += vert[i].x + "::" + vert[i].y;
    }
    endShape();
    pop();
    drawd = 1;
  }

  this.drawPolyShape = function(ps, xf) {
    //console.log(ps);
    //var vertexCount = parseInt(poly.GetVertexCount());
    //var localVertices = ps.GetVertices();
    // var vertices = [];//new Array(vertexCount);
    //for (var i = 0; i < localVertices.length; ++i)
    //  vertices[i] = b2Math.MulX(xf, localVertices[i]);
    stroke(255, 0, 0);
    noFill();
    //noStroke();
    beginShape();
    var s = '[';
    //if (!drawd) console.log(ps.m_vertices);
    for (var i = 0; i < ps.m_vertices; ++i) {
      var vert = b2Math.MulX(xf, localVertices[i])
      vertex(vert[i].x, vert[i].y);
      s += vert[i].x + "::" + vert[i].y
    }
    endShape();
    if (!drawd) console.log(s + ']');
    //this.m_debugDraw.DrawSolidPolygon(vertices, vertexCount, color);
  }

  this.setStatic = function(val) {
    this.boxDef.SetType(!isStatic ? box2d.b2BodyType.b2_dynamicBody :
      box2d.b2BodyType.b2_staticBody);
    // body.m_type = b2Body.b2_staticBody;
    // body.m_mass = 0.0;
    // body.m_invMass = 0.0;
    // body.m_angle = 0;  // TODO: make this an arg...
    // body.m_linearVelocity.SetZero();
    // body.m_angularVelocity = 0.0;
  }

  this.boxDef = bd;
}

function simplifyPath(points) {

  var result = [];

  console.log('simplifyPath:'+points.length);
  s = '[';
  fill(0);
  stroke(0);
  for (var i = 0; i < points.length; i++) {
    s+= '{x: '+points[i].x+', y:'+points[i].y+' },'
    ellipse(points[i].x,points[i].y ,2,2);
  }
  console.log(s+']');
  return points;
  simplify(points);

  function simplify(pts) {

    console.log('simplify:'+pts.length);
    if (pts.length < 3) {
      for (var i = 0; i < pts.length; i++)
            s+= '{x: '+pts[i].x+', y:'+
          console.log(s+']');result.push(pts[i]);

      return result;
    }

    if (collinear(pts[0], pts[1], pts[2])) {
      console.log('hit: ', pts[0], pts[1], pts[2]);
      pts.splice(1, 1);
    } else {
      result.push(pts.shift());
    }

    simplify(pts);
  }

  function collinear(m, n, o) {
    return ((o.y == n.y && o.y == m.y) || (o.x == n.x && o.x == m.x));
  }

  return result;
}

function simplifyPathPts(pts) {

  if (pts.length < 3) return pts;

  var ok = [pts[0]],
    i = 1;

  for (; i < pts.length - 1; i++) {

    var last = pts[i - 1];
    var curr = pts[i];
    var next = pts[i + 1];

    if (next.y == curr.y && next.y == last.y) {
      continue;
    } else if (next.x == curr.x && next.x == last.x) {
      continue;
    }
    ok.push(pts[i]);
  }
  ok.push(pts[i]);

  if (pts.length < ok.length)
    throw Error("Failed: simplifyPathPts(" + pts.length + ") -> " + ok.length);

  return ok;
}
