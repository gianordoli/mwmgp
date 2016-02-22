mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
mg.sceneSetup();
/*---------------------------------------------*/

maxScore = 1;
gravity = 0;
damping = 0.5;
mg.timer(100000);
maxLives = 1;

mg.setInstructionsMsg('Roll the balls to the gray circle');

// As in D3/Jquery, you can store the object you declare or not.
// Storing allows further manipulation

mg.rect(0, 0, width, 20).turnIntoWall('bounce');
mg.rect(0, height - 20, width, 20).turnIntoWall('bounce');
mg.rect(0, 0, 20, height).turnIntoWall('bounce');
mg.rect(width - 20, 0, 20, height).turnIntoWall('bounce');
mg.rect(width/2 - 10, height*2/5, 20, height/5)
	.turnIntoWall('destroy')
	.setColor('orange');

var circles = [];
var target;

for(var i = 0; i < 2; i++){
	var newCircle;
	newCircle = mg.circle(100, height/3 + i * height/3, 40)
					.setHslaColor(Math.floor(Math.random()* 255), 70, 50, 1)
					.setPhysics()
					.throwable(0.2, false);
	circles.push(newCircle);
}

target = mg.circle(width - 300, height/2, 100)
			.setHslaColor(0, 0, 0, 0.1)
			.onCollision(circles, function(){	// Pass Array or single object
				score ++;
			})
			;

/*---------------------------------------------*/
mg.init(); // This won't be public-facing