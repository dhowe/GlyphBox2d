// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// A rectangular box


// Constructor
function Particle(x,y,r,isStatic) {
  this.r = r;

  // Define a body
  var bd = new box2d.b2BodyDef();
  bd.type = isStatic ? box2d.b2BodyType.b2_dynamicBody :
    box2d.b2BodyType.b2_staticBody;

  bd.position = scaleToWorld(x,y);

  // Define a fixture
  var fd = new box2d.b2FixtureDef();
  // Fixture holds shape
  fd.shape = new box2d.b2CircleShape();
  fd.shape.m_radius = scaleToWorld(this.r);

  // Some physics
  fd.density = 1.0;
  fd.friction = 0.1;
  fd.restitution = 0.4;

  // Create the body
  this.body = world.CreateBody(bd);
  // Attach the fixture
  this.body.CreateFixture(fd);

  // Some additional stuff
  this.body.SetLinearVelocity(new box2d.b2Vec2(random(-5, 5), random(2, 5)));
  this.body.SetAngularVelocity(random(-5,5));

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
    if (pos.y > height+this.r*2) {
      this.killBody();
      return true;
    }
    return false;
  }

  // Drawing the Particle
  this.display = function() {
    // Get the body's position
    var pos = scaleToPixels(this.body.GetPosition());
    // Get its angle of rotation
    var a = this.body.GetAngleRadians();

    // Draw it!
    rectMode(CENTER);
    push();
    translate(pos.x,pos.y);
    rotate(a);
    fill(255);
    //stroke(200);
    //strokeWeight(.5);
    //noStroke();
    ellipse(0,0,this.r*2,this.r*2);
    // Let's add a line so we can see the rotation
    line(0,0,this.r,0);
    pop();
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
