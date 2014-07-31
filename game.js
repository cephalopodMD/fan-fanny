var particleSize;
var particles;
var heatSources;
var canvas;
var ctx;
var fanny;

function gameLoop() {
	update();
	draw();
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
	window.requestAnimationFrame(gameLoop);
}

function plotParticles(boundsX, boundsY) {
	// a new array to hold particles within our bounds
	var currentParticles = [];

	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		var pos = particle.position;
		
		if ((pos.x > canvas.width && particle.velocity.x > 0) || (pos.x < 0 && particle.velocity.x < 0)) {
			particle.velocity = new Vector(-particle.velocity.x * .9, particle.velocity.y);
		}
		
		if ((pos.y > canvas.height && particle.velocity.y > 0) || (pos.y < 0 && particle.velocity.y < 0)) {
			particle.velocity = new Vector(particle.velocity.x, -particle.velocity.y * .9);
		}
		
		// gravity
		particle.acceleration.add(new Vector(0, -.0001 * particle.temp));

		// Update particles to account for all sources
		particle.submitToHeat(heatSources, 1);
		particle.submitToHeat(particles, 1/8);
		  
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
 
// Add a vector to another
Vector.prototype.scale = function(scalar) {
	this.x = this.x * scalar;
	this.y = this.y * scalar;
}
 
// Gets the length of the vector
Vector.prototype.getMagnitude = function () {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};
 
// Gets the angle accounting for the quadrant we're in
Vector.prototype.getAngle = function () {
	return Math.atan2(this.y,this.x);
};

// Allows us to get a new vector from angle and magnitude
Vector.fromAngle = function (angle, magnitude) {
	return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

// Gets distance between vectors
Vector.prototype.getDistanceFrom = function(vector) {
	var distanceVector = new Vector(this.x - vector.x, this.y - vector.y);
	return distanceVector.getMagnitude();
}
 
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

Particle.prototype.submitToHeat = function (sources, influence) {
	// for each passed source
	for (var i = 0; i < sources.length; i++) {
		var dist = this.position.getDistanceFrom(sources[i].position) + 1;
		if (dist > 0) {
			this.temp += influence * (sources[i].temp - this.temp) / (dist * dist);
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

function main() {
	canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = 640;
	canvas.height = 480;
	particleSize = 2;
	particles = [];
	for(var i = 0; i < 200; i++) {
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
