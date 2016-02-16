/*---------------------------------------------*/
mg.canvasSetup(); // This won't be public-facing
mg.startTouch();
/*---------------------------------------------*/

mg.timer(50000);


// Ideally we could have this being set visually
var target = mg.circle(width - 600, 200, 100)	// x, y, radius
				.setColor("red");				// string, rgb, rgba, hsl


mg.circle(200, height-50, 50)
	.setColor("blue")
	.throwable()		// optional: "reverse" — for Angry Birds, pool, etc
	// .draggable		// could be another option
	// .setInteraction(target, function(){
		// sending an array sets the conditional to &&
		.setInteraction([target, mgtouch], function(){ // touch is a global
		console.log("YAY");
	});


/*---------------------------------------------*/
mg.init(); // This won't be public-facing
/*---------------------------------------------*/