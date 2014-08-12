var particlesize,
	particles,
	heatSources,
	canvas,
	ctx,
	fanny,
	cacheCanvas,
	cacheCtx;

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
	canvas.width = 640;
	canvas.height = 480;
	ctx = canvas.getContext('2d');
	cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = canvas.width;
    cacheCanvas.height = canvas.height;
	cacheCtx = cacheCanvas.getContext('2d');
	particlesize = 2;
	particles = [];
	for(var i = 0; i < 200; i++) {
		particles.push(new Entity(new Vector(Math.random() * canvas.width, Math.random() * canvas.height)
			, new Vector()
			, new Vector()
			, Math.random * 10))
	}
	heatSources = [new HeatSource(new Vector(240, 320), 30)
		,new HeatSource(new Vector(240, 160), -30)
		,new HeatSource(new Vector(440, 320), 30)
		,new HeatSource(new Vector(440, 160), -30)];
	
	fanny = new Fanny(new Entity(new Vector(370,430)), "https://i.imgur.com/WMjaM7u.png");
	
	gameLoop();
}

function gameLoop() {
	update();
	draw();
	window.requestAnimationFrame(gameLoop);
}

function update() {
	plotparticles(canvas.width, canvas.height);
	fanny.entity.reactToSource(particles, 1/6);
}

function draw() {
	cacheCtx.clearRect(0, 0, canvas.width, canvas.height);
	cacheCtx.beginPath();
	drawFanny();
	drawHeatSources();
	drawparticles();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(cacheCanvas, 0, 0);
}

function plotparticles(boundsX, boundsY) {
	// a new array to hold particles within our bounds
	var currentparticles = [];

	for (var i = 0; i < particles.length; i++) {
		var Particle = particles[i];
		var pos = Particle.position;
		
		// gravity
		Particle.acceleration.add(new Vector(0, -.0001 * Particle.temp));

		// Update particles to account for all sources
		Particle.reactToSource(heatSources, 1);
		Particle.reactToSource(particles, 1/6);
		if (isNaN(Particle.temp)) {
			Particle.temp = 0;
		}
		
		//collisions
		if ((pos.x > canvas.width - 2 && Particle.velocity.x > 0) || (pos.x < 2 && Particle.velocity.x < 0)) {
			Particle.velocity = new Vector(-Particle.velocity.x * .9, Particle.velocity.y * (Math.random() - .5));
		}
		
		if ((pos.y > canvas.height - 2 && Particle.velocity.y > 0) || (pos.y < 2 && Particle.velocity.y < 0)) {
			Particle.velocity = new Vector(Particle.velocity.x * (Math.random() - .5), -Particle.velocity.y * .9);
		}
		  
		// Move our particles
		Particle.move();

		// Add this Particle to the list of current particles
		currentparticles.push(Particle);
	  
	}

	// Update our global particles, clearing room for old particles to be collected
	particles = currentparticles;
}
 
function drawparticles() {
	// For each Particle
	for (var i = 0; i < particles.length; i++) {
		drawEntity(particles[i]);
	}
}

function drawHeatSources() {
	// For each source
	for (var i = 0; i < heatSources.length; i++) {
		var position = heatSources[i].position;
		var color = "rgb(" + Math.round(192 + heatSources[i].temp) + 
			"," + Math.round(192 - Math.abs(heatSources[i].temp)) + 
			"," + Math.round(192 - heatSources[i].temp) + ")";
		cacheCtx.fillStyle = color;

		// Draw a circle at our position
		cacheCtx.beginPath();
		cacheCtx.arc(position.x, position.y, 10, 0, 2 * Math.PI, true);
		cacheCtx.fill();
	}
}

function drawFanny() {
	cacheCtx.drawImage(fanny.image, fanny.entity.position.x - 65, fanny.entity.position.y - 50, 100, 100);
	drawEntity(fanny.entity);
	var alertString = "Fanny's fanny is " 
	if (fanny.entity.temp > 1) {
		alertString += "a balmy "
	}
	if (fanny.entity.temp < -1) {
		alertString += "a frigid "
	}
	alertString += Math.round(fanny.entity.temp * 2 + 72) + " degrees Fahrenheit"
	cacheCtx.fillText(alertString, 10, 15);
}

function drawEntity(entity) {
	var position = entity.position;
	var color = "rgb(" + Math.round(192 + entity.temp * 8) + 
		"," + Math.round(192 - Math.abs(entity.temp) * 8) + 
		"," + Math.round(192 - entity.temp * 8) + ")";
	cacheCtx.fillStyle = color;

	// Draw a circle at our position
	cacheCtx.beginPath();
	cacheCtx.arc((0.5 + position.x) << 0, (0.5 + position.y) << 0, entity.size, 0, 2 * Math.PI, true); // optimized, but rough
	//cacheCtx.arc(position.x, position.y, entity.size, 0, 2 * Math.PI, true); // less optimized, but smoother looking
	cacheCtx.fill();
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
Vector.prototype.setMagnitude = function(scalar) {
	var magniutude = Math.sqrt(this.x * this.x + this.y * this.y)
	this.x = this.x * scalar / magniutude;
	this.y = this.y * scalar / magniutude;
}

// Add a vector to another
Vector.prototype.normalize = function() {
	this.setMagnitude(1);
}

// Gets the angle accounting for the quadrant we're in
Vector.prototype.getAngle = function () {
	return Math.atan2(this.y,this.x);
};

// Allows us to get a new vector from angle and magnitude
Vector.fromAngle = function (angle, magnitude) {
	return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};
 
function Entity(position, velocity, acceleration, temp, size) {
	this.position = position || new Vector(320, 240);
	this.velocity = velocity || new Vector(0, 0);
	this.acceleration = acceleration || new Vector(0, 0);
	this.temp = temp || 0;
	this.size = size || 2;
}

Entity.prototype.move = function () {	 
	this.position.add(new Vector((Math.random() - .5) * (Math.atan(this.temp/3) + Math.PI/2)
		, (Math.random() - .5) * (Math.atan(this.temp/3) + Math.PI/2)))
	// Add our current velocity to our position
	this.position.add(this.velocity);
	
	// Add our current acceleration to our current velocity
	this.velocity.add(this.acceleration);
	
	this.acceleration = new Vector(0, 0);
};

Entity.prototype.reactToSource = function (sources, influence) {
	// for each passed source
	for (var i = 0; i < sources.length; i++) {
		var distVec = this.position.getDistanceVector(sources[i].position);
		var dist = distVec.getMagnitude();
		if (dist > 1) {
			this.temp += influence * (sources[i].temp - this.temp) / (dist * dist);
			distVec.setMagnitude(1 / (dist * dist))
			this.acceleration.add(distVec);
		}
	}
};

function HeatSource(position, temp) {
	this.position = position;
	this.setHeat(temp);
}

HeatSource.prototype.setHeat = function(temp) {
    this.temp = temp || 100;
}

function Fanny(entity, icon) {
	this.entity = entity;
	this.image = new Image();
	this.image.src = icon;
	this.entity.size = 10;
}
