/*---------------------------------------------*/
mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
/*---------------------------------------------*/

var timer = mg.timer(10000);

// Ideally we could positions/sizes this being set visually
var circle = mg.circle(100, height-60, 50) // x, y, radius
	.setColor("blue")					   // string, rgb, rgba, hsl
	.throwable()		// optional: "reverse" — for Angry Birds, pool, etc
	;

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation
target = mg.circle(width - 200, 200, 150)	
			.setColor({h: 0, s: 100, l: 50, a: 0.5})
			.setInteraction([circle, mgtouch], function(){ // mgtouch is a global
				target.animate({
					radius: target.radius - 20
				}, 500);	// Could add more properties to animate...
				score ++;
			});

// Expanding on the ideas:

// FOR OBJECTS
// Circle is very specific, but we can make rects and everything else inherit the same basic properties
// .draggable()
// .setMass(someNumber) // so some objects respond to gravity and some don't

// Walls might be a recurrent thing...
// mg.wall(x, y, width, height, 'bounce/destroy')

// FOR GLOBAL
// mg.gravity() to set a global gravity; because maybe people want physics but no gravity (pool-like)

/*---------------------------------------------*/
mg.init(); // This won't be public-facing
/*---------------------------------------------*/