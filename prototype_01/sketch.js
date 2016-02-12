// This doesn't need to be public-facing
mg.canvasSetup();


mg.timer(5000);


// Ideally we could have this being set visually
var target = mg.circle(width - 150, 150, 100)	// x, y, radius
				.setColor("red");				// string, rgb, rgba, hsl


mg.circle(200, 400, 50)
	.setColor("blue")
	.throwable()		// optional: "reverse" — for Angry Birds, pool, etc
	.setInteraction(target, function(){
		console.log("YAY");
	});


// This doesn't need to be public-facing
mg.init();