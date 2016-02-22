mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
mg.sceneSetup();
/*---------------------------------------------*/

gravity = 0;
damping = 0.5;
mg.timer(100000);

mg.setInstructionsMsg('Flick the pink ball and then tap the red one.');
// mg.setGameOverMsg('You fail!');

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation

mg.rect(0, 0, width, 20).turnIntoWall('bounce');
mg.rect(0, height - 20, width, 20).turnIntoWall('bounce');
mg.rect(0, 0, 20, height).turnIntoWall('bounce');
mg.rect(width - 20, 0, 20, height).turnIntoWall('bounce');
mg.rect(width/2 - 10, height/3, 20, height/3).turnIntoWall('bounce');

var circles = [];
var target;

target = mg.circle(width - 200, height/2, 100)
			.setHslaColor(0, 0, 0, 1)
			.onCollision(circles, function(){	// Pass Array or single object
				score ++;
				target.animate({
					radius: target.radius - 20
				}, 1000);
			})
			;

for(var i = 0; i < 2; i++){
	var newCircle;
	newCircle = mg.circle(100, 80 + i * 80, 40)
					.setHslaColor(Math.floor(Math.random()* 255), 70, 50, 1)
					.hasPhysics()
					.throwable(0.2, false, function(){
						// newCircle.removeThrowable();
					});
	circles.push(newCircle);
}

/*---------------------------------------------*/
mg.init(); // This won't be public-facing