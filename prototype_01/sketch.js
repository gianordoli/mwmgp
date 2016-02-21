mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
/*---------------------------------------------*/

gravity = 1;
var timer = mg.timer(10000);

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation

mg.wall(0, height - 100, width, 200, 'bounce');				// Floor
mg.wall(-100, 0, 50, height, 'reset');						// Left
mg.wall(width, 0, 100, height, 'reset');					// Right
// mg.wall(width/2 - 50, height*2/3, 20, height/2, 'destroy');	// Middle

var circle = mg.circle(100, height-220, 50); // x, y, radius
circle.setColor("#FACADA")
		.animate({
		radius: circle.radius - 20
		}, 2000)
		.hasPhysics()
		// (speed, reverse?, callback) — reverse for Angry Birds, pool, etc
		.throwable(1, false, function(){
			circle.removeThrowable(); // removing throwable after 1st throw
		});

var target = mg.circle(width - 350, 20, 150)
			.setHslaColor(0, 100, 50, 0.5)
			// .draggable()
			.onCollision([circle, mgtouch], function(){	// Pass Array or single object
				score ++;
			});

/*---------------------------------------------*/
mg.init(); // This won't be public-facing