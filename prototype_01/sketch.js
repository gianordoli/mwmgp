mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
/*---------------------------------------------*/

gravity = 1;

var timer = mg.timer(7000);

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation
mg.wall(0, height - 100, width, 200, 'bounce');

var circle = mg.circle(100, height-220, 50) // x, y, radius
	.setColor("#FACADA")
	.hasPhysics()
	.throwable(true, 1)	// (add: boolean, speed: number, reverse: boolean) — for Angry Birds, pool, etc
	;

var target = mg.circle(width - 350, 20, 150)	
			.setHslaColor(0, 100, 50, 0.5)
			.onCollision([circle, mgtouch], function(){	// Pass Array or single object
				score ++;
			});
// 			.setInteraction([circle, mgtouch], function(){ // mgtouch is a global
// 				target.animate({
// 					radius: target.radius - 20
// 				}, 500);	// Could add more properties to animate...
// 				score ++;
// 			});

// Expanding on the ideas:

// FOR OBJECTS
// .draggable()

/*---------------------------------------------*/
mg.init(); // This won't be public-facing