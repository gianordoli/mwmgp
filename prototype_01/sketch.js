mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
/*---------------------------------------------*/

gravity = 1;
var timer = mg.timer(10000);

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation

mg.rect(0, height - 100, width, 200).turnIntoWall('bounce');	// Floor
mg.rect(0, -height, width, 100).turnIntoWall('reset');			// Top
mg.rect(-100, -height, 100, 2*height).turnIntoWall('reset');	// Left
mg.rect(width, -height, 100, 2*height).turnIntoWall('reset');	// Right
// mg.wall(width/2 - 50, height*2/3, 20, height/2, 'destroy');	// Middle

var circle, target;

circle = mg.circle(100, height-180, 50) 		// x, y, radius
			.setColor("#FACADA")
			.hasPhysics()
			.throwable(1, false, function(){	// (speed, reverse?, callback) — reverse for Angry Birds, pool, etc
				circle.removeThrowable();		// removing throwable after 1st throw
				target.label('tap me!', 'center', 'middle');
			})
			.onReset(function(){
				target.removeLabel();
			});

target = mg.circle(width - 150, 150, 150)
			.setHslaColor(0, 100, 50, 0.5)
			// .draggable()
			.onCollision([circle, mgtouch], function(){	// Pass Array or single object
				score ++;
				target.animate({
					radius: target.radius - 20
				}, 2000);
			});

/*---------------------------------------------*/
mg.init(); // This won't be public-facing