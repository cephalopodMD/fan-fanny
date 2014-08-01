var particleSize;
var particles;
var heatSources;
var canvas;
var ctx;
var fanny;

if ( !window.requestAnimationFrame ) {
	window.requestAnimationFrame = ( function() {
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
			window.setTimeout( callback, 1000 / 60 );
		};
	} )();
}

function main() {
	canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = 640;
	canvas.height = 480;
	particleSize = 2;
	particles = [];
	for(var i = 0; i < 400; i++) {
		particles.push(new Particle(new Vector(Math.random() * canvas.width, Math.random() * canvas.height)
			, new Vector()
			, new Vector()
			, Math.random * 10))
	}
	heatSources = [new HeatSource(new Vector(240, 320), 20)
		,new HeatSource(new Vector(240, 160), -20)
		,new HeatSource(new Vector(440, 320), 20)
		,new HeatSource(new Vector(440, 160), -20)];
	
	fanny = new Image();
	fanny.src = "http://i.imgur.com/WMjaM7u.png";
	
	gameLoop();
}

function gameLoop() {
	update();
	draw();
	window.requestAnimationFrame(gameLoop);
}

function update() {
	plotParticles(canvas.width, canvas.height);
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.drawImage(fanny, 320, 380, 100, 100);
	drawHeatSources();
	drawParticles();
}

function plotParticles(boundsX, boundsY) {
	// a new array to hold particles within our bounds
	var currentParticles = [];

	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		var pos = particle.position;
		
		// gravity
		particle.acceleration.add(new Vector(0, -.0001 * particle.temp));

		// Update particles to account for all sources
		particle.reactToSource(heatSources, 1);
		particle.reactToSource(particles, 1/2);
		
		//collisions
		if ((pos.x > canvas.width && particle.velocity.x > 0) || (pos.x < 0 && particle.velocity.x < 0)) {
			particle.velocity = new Vector(-particle.velocity.x * .5, particle.velocity.y * (Math.random() - .5));
		}
		
		if ((pos.y > canvas.height && particle.velocity.y > 0) || (pos.y < 0 && particle.velocity.y < 0)) {
			particle.velocity = new Vector(particle.velocity.x * (Math.random() - .5), -particle.velocity.y * .5);
		}
		  
		// Move our particles
		particle.move();

		// Add this particle to the list of current particles
		currentParticles.push(particle);
	  
	}

	// Update our global particles, clearing room for old particles to be collected
	particles = currentParticles;
}
 
function drawParticles() {
	// For each particle
	for (var i = 0; i < particles.length; i++) {
		var position = particles[i].position;
		var color = "rgb(" + Math.round(192 + particles[i].temp * 4) + 
			"," + Math.round(192 - Math.abs(particles[i].temp) * 4) + 
			"," + Math.round(192 - particles[i].temp * 4) + ")";
		ctx.fillStyle = color;

		// Draw a circle at our position
		ctx.beginPath();
		ctx.arc(position.x, position.y, particleSize, 0, 2 * Math.PI, true);
		ctx.fill();
	}
}

function drawHeatSources() {
	// For each source
	for (var i = 0; i < heatSources.length; i++) {
		var position = heatSources[i].position;
		var color = "rgb(" + Math.round(192 + heatSources[i].temp) + 
			"," + Math.round(192 - Math.abs(heatSources[i].temp)) + 
			"," + Math.round(192 - heatSources[i].temp) + ")";
		ctx.fillStyle = color;

		// Draw a circle at our position
		ctx.beginPath();
		ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI, true);
		ctx.fill();
	}
}

function Vector(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

// Add a vector to another
Vector.prototype.add = function(vector) {
	this.x += vector.x;
	this.y += vector.y;
}

// Gets the length of the vector
Vector.prototype.getMagnitude = function () {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

// Gets distance between vectors
Vector.prototype.getDistanceVector = function(vector) {
	return new Vector(this.x - vector.x, this.y - vector.y);
}

// Add a vector to another
Vector.prototype.scale = function(scalar) {
	this.x = this.x * scalar;
	this.y = this.y * scalar;
}
  
// Add a vector to another
Vector.prototype.normalize = function() {
	this.x = this.x * 1 / this.getMagnitude;
	this.y = this.y * 1 / this.getMagnitude;
}

// Add a vector to another
Vector.prototype.setMagnitude = function(scalar) {
	this.normalize();
	this.x = this.x * scalar;
	this.y = this.y * scalar;
}

// Gets the angle accounting for the quadrant we're in
Vector.prototype.getAngle = function () {
	return Math.atan2(this.y,this.x);
};

// Allows us to get a new vector from angle and magnitude
Vector.fromAngle = function (angle, magnitude) {
	return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};
 
function Particle(point, velocity, acceleration, temp) {
	this.position = point || new Vector(320, 240);
	this.velocity = velocity || new Vector(0, 0);
	this.acceleration = acceleration || new Vector(0, 0);
	this.temp = temp || 0;
}

Particle.prototype.move = function () {	 
	this.position.add(new Vector((Math.random() - .5) * (Math.atan(this.temp/3) + Math.PI/2)
		, (Math.random() - .5) * (Math.atan(this.temp/3) + Math.PI/2)))
	// Add our current velocity to our position
	this.position.add(this.velocity);
	
	// Add our current acceleration to our current velocity
	this.velocity.add(this.acceleration);
	
	this.acceleration = new Vector(0, 0);
};

Particle.prototype.reactToSource = function (sources, influence) {
	// for each passed source
	for (var i = 0; i < sources.length; i++) {
		var distVec = this.position.getDistanceFrom(sources[i].position);
		var dist = distVec.getMagnitude + 1;
		if (dist > 0) {
			this.temp += influence * (sources[i].temp - this.temp) / (dist ^ 2);
			this.acceleration.add(distVec.setMagnitude(-1/(dist ^ 2)));
		}
	}
};

function HeatSource(point, temp) {
	this.position = point;
	this.setHeat(temp);
}

HeatSource.prototype.setHeat = function(temp) {
    this.temp = temp || 100;
}
