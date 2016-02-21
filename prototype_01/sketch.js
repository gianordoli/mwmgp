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
	// (add?, speed, reverse?, callback) — reverse for Angry Birds, pool, etc
	.throwable(true, 1, false, function(){
		circle.throwable(false); // removing throwable after 1st throw
	});

var target = mg.circle(width - 350, 20, 150)
			.setHslaColor(0, 100, 50, 0.5)
			.onCollision([circle, mgtouch], function(){	// Pass Array or single object
				score ++;
				target.animate({
					radius: target.radius - 20
				}, 500);				
			});

// Expanding on the ideas:

// FOR OBJECTS
// .draggable()

/*---------------------------------------------*/
mg.init(); // This won't be public-facing