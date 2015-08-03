var flock, font, pauseFlock = true, findTarget = false; txt = "p5", x = 230, y = 200, fontSize = 150;

function preload() {
  font = loadFont("../fonts/AvenirNextLTPro-Demi.otf");
}

function setup() {

  createCanvas(640, 360);
  flock = new Flock();

  var xoff = 0, glyphs = font._getGlyphs(txt);

  for (var i = 0; i < glyphs.length; i++) {

    var polys = getPolys(glyphs[i], x, y, fontSize, {

      sampleFactor: .25, // sample every 10th of path length
      simplifyThreshold: 0 // don't simplify straight lines
    });

    //  draw polygons and points
    for (var j = 0; j < polys.length; j++) {

      var points = polys[j].getPoints();

      var target = createVector(width/2,height/2);
      for (var k = 0; k < points.length; k++) {
        var start = createVector(points[k].x + xoff, points[k].y);
        flock.addBoid(new Boid(start, start));
      }
    }

    xoff += glyphs[i].advanceWidth * font._scale(fontSize);
  }
}

function draw() {

  background(237,34,93);
  textFont(font, fontSize);
  fill(255);
  noStroke();
  flock.run();
}

function mouseReleased() {
  //for (var i = 0; i < 100; i++)
    //flock.addBoid(new Boid(width / 2, height / 2));
  if (pauseFlock)
    pauseFlock = false;
  else
    findTarget = true;
}

function mouseDragged() {
  //flock.addBoid(new Boid(mouseX,mouseY));
}


// --------------------------------------------------------------
// From Shiffman's The Nature of Code: http://natureofcode.com
// --------------------------------------------------------------

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function() {
  for (var i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);
  }
}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

// From: The Nature of Code - Daniel Shiffman: http://natureofcode.com

function Boid(pos, target) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(pos.x, pos.y);
  this.r = 3;
  this.maxspeed = 3; // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
  this.target = target;
}

Boid.prototype.run = function(boids) {
  if (!pauseFlock) {
    if (findTarget) {
      this.arrive(this.target);
      //var coh = this.seek(this.target);
      //this.applyForce(coh.mult(this.position.dist(this.target)));
    }
    else {
      this.flock(boids);
    }
    this.update();
    this.borders();
  }
  this.render();
}

// TODO: need to specify an arrival rotation
Boid.prototype.arrive = function(target) {

    var arrivalThreshold = this.maxspeed * 25;
    var desiredVelocity = createVector(target.x, target.y);
    desiredVelocity.sub(this.position);
    desiredVelocity.normalize();

    var dist = this.position.dist(target);
    if (dist > arrivalThreshold)
      desiredVelocity.mult(this.maxspeed);
    else
      desiredVelocity.mult( this.maxspeed * (dist / arrivalThreshold) );

    this.applyForce(desiredVelocity.sub(this.velocity));
};

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids) {
  var sep = this.separate(boids); // Separation
  var ali = this.align(boids); // Alignment
  var coh = this.cohesion(boids); // Cohesion
  // Arbitrarily weight these forces
  sep.mult(1.5);
  ali.mult(1.0);
  coh.mult(1.0);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  var steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce); // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  var theta = this.velocity.heading() + radians(90);
  //fill(127);
  //stroke(200);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r*2); // nose
  vertex(-this.r, this.r*2);
  vertex(this.r, this.r*2);
  endShape(CLOSE);
  pop();
}

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r) this.position.x = width + this.r;
  if (this.position.y < -this.r) this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  var desiredseparation = 25.0;
  var steer = createVector(0, 0);
  var count = 0;
  // For every boid in the system, check if it's too close
  for (var i = 0; i < boids.length; i++) {
    var d = p5.Vector.dist(this.position, boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      var diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d); // Weight by distance
      steer.add(diff);
      count++; // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  var neighbordist = 50;
  var sum = createVector(0, 0);
  var count = 0;
  for (var i = 0; i < boids.length; i++) {
    var d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    var steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  var neighbordist = 50;
  var sum = createVector(0, 0); // Start with empty vector to accumulate all locations
  var count = 0;
  for (var i = 0; i < boids.length; i++) {
    var d = p5.Vector.dist(this.position, boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum); // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}
