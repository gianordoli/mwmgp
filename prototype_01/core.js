// Super globals... We might need to expose these
var width, height;
var mgtouch;
var score;
var gravity;
var damping;

var mg = mg || {};

mg = (function(){

	/*---------------------- PUBLIC ---------------------*/
	function timer(time){
		myTimer = new Timer(time);
		return myTimer;
	};

	function circle(_x, _y, _radius){
		var obj = new MgObject();
		obj.createCircle(_x, _y, _radius);
		console.log(obj);
		objects.push(obj);
		return obj;
	};

	function wall(_x, _y, _width, _height, _effect){
		var obj = new MgWall(_x, _y, _width, _height, _effect);
		walls.push(obj);
		return obj;
	};

	/*---------- VARIABLES ----------*/
	// This is gonna hold all objects created on the scene,
	// so we can simply loop through them to update/display
	var objects = [];
	var walls = [];

	// PRIVATE
	var request;	// animation
	var canvas;		// canvas
	var ctx;
	var isMobile;

	var myTimer;

	var gameOver;

	function canvasSetup(){
		canvas = document.getElementById('my-canvas');
		ctx = canvas.getContext('2d');
		resizeCanvas();
		isMobile = mobileCheck();
	}

	function setup() {

		// If nothing is passed, default to:
		gravity = 1;
		damping = -1;

		score = 0;
		gameOver = false;

		draw();
	}

	function draw() {
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if(!gameOver){

			// Display all walls
			for(var i = 0; i < walls.length; i++){
				walls[i].display();
			}	

			// Display all objects
			for(var i = 0; i < objects.length; i++){
				objects[i].update();
				objects[i].display();
			}

			// mgtouch.display();

			// Timer
			myTimer.display();
			// Score
			ctx.fillStyle = 'black';
			ctx.font = "40px sans-serif";
			ctx.textAlign = "left";		
			ctx.fillText(score + '/5', 30, 110);

		}else{
			ctx.fillStyle = parseHsla(0, 0, 0, 1);
			ctx.font = "120px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("GAME\nOVER", canvas.width/2, canvas.height/2);
		}

		// Makes draw loop
		request = requestAnimFrame(draw);
	}

	// Classes
	function Timer(time){
		var totalTime = time;
		remainingTime = time; // global
		var timeBar = {
			pos: {
				x: 30,
				y: 30
			},
			width: canvas.width - 60,
			height: 30
		};

		var gameTimer = setInterval(function(){
			remainingTime -= 100;
			if(remainingTime <= 0){
				clearInterval(gameTimer);
				gameOver = true;	
			}
		}, 100);

		this.display = function(){
			ctx.fillStyle = parseHsla(0, 0, 75, 1);
			ctx.fillRect(timeBar.pos.x, timeBar.pos.y, timeBar.width, timeBar.height);
			
			ctx.fillStyle = parseHsla(0, 100, 50, 1);
			var remainingWidth = map(remainingTime, 0, totalTime, 0, timeBar.width);
			ctx.fillRect(timeBar.pos.x, timeBar.pos.y, remainingWidth, timeBar.height);
		};
	}

	function MgTouch(){
		
		var obj = {};

		obj.pos = { x: 0, y: 0	};
		obj.prevPos = { x: 0, y: 0 };
		obj.width = 0;			// Declaring these just to make mgtouch work with the isColliding function
		obj.height = 0;
		obj.onTouchStart = {};	// Lists of functions called; user-added;
		obj.onTouchMove = {};	// Stored with { objectId: function(){} }
		obj.onTouchEnd = {};	// so we can refer to the object id to remove the listener...

		obj.display = function(){
			ctx.fillStyle = "black";
			ctx.beginPath();
			ctx.arc(obj.pos.x, obj.pos.y, obj.radius, obj.radius, 0, Math.PI*2, false);
			ctx.fill();			
		}

		return obj;
	}

	/*-------------------------------------- CLASSES --------------------------------------*/
	
	function MgObject(){
		// This is the 'master' MgObject. All objects will share its properties and methods
		var obj = {};

		/*------------------- PROPERTIES -------------------*/
		obj.id = createId(7);
		obj.color = "black";
		obj.actions = {};			// List with behavior functions
									// Each function is added ith a key — 'collision', 'physics' —
									// so the user can also remove them if needed

		obj.transformations = {};	// List with transformation functions

		obj.isDragging = false;

		/*-------------------- METHODS ---------------------*/
		// A) CLASSES
		// These turn our blank abstract object into a specific shape
		obj.createCircle = function(_x, _y, _radius){
			Circle(obj, _x, _y, _radius);
		};

		// B) BASIC METHODS
		// Every object has these
		obj.update = function(){
			// Execute actions that have been added (physics included)
			// for(var i = 0; i < obj.actions.length; i++){
			for(var prop in obj.actions){
				obj.actions[prop]();
			};
		};

		// C) ADDITIONAL METHODS
		// These are user-added
		obj.animate = function(_obj, _time){
			this.radius -= 20;
			return this;
		};

		obj.onCollision = function(_obj2, _callback){
			
			var debounce;

			obj.actions['collision'] = function(){

				// One object only
				if(!Array.isArray(_obj2)){
					if(isColliding(obj, _obj2)){
						execCallback();
					}

				// Array of objects		
				}else{
					var collided = [];
					// Loop through all other (_obj2) objects
					for(var i = 0; i < _obj2.length; i++){
						if(isColliding(obj, _obj2[i])){
				    		collided.push(true);
						}						
					}
					// If we have as many true values as objects...
					if(collided.length === _obj2.length){
						execCallback();
					}
				}

				function execCallback(){
					clearTimeout(debounce);
		    		debounce = setTimeout(_callback, 500); 						
				}

			};
			return obj;
		};

		obj.onTap = function(_callback){
			mgtouch.onTouchStart[obj.id] = function(){
				if(isColliding(obj, mgtouch)){
					_callback();
				}
			};
		};

		obj.removeTap = function(){
			delete mgtouch.onTouchStart[obj.id];
		};

		obj.throwable = function(_add, _speed, _reverse, _callback){

			// Add action/listener
			if(_add){
				// Add events to mgtouch object
				mgtouch.onTouchStart[obj.id] = function(){
					if(isColliding(obj, mgtouch)){
						obj.isDragging = true;
					}
				};
				mgtouch.onTouchEnd[obj.id] = function(){
					if(obj.isDragging){
						obj.isDragging = false;
						obj.vel.x = (mgtouch.pos.x - mgtouch.prevPos.x) * _speed;
						obj.vel.y = (mgtouch.pos.y - mgtouch.prevPos.y) * _speed;
						if(_callback !== undefined){
							_callback();
						}
					}
				};

			// Remove action/listener
			}else{
				delete mgtouch.onTouchStart[obj.id];
				delete mgtouch.onTouchEnd[obj.id];
			}

			return obj;
		}
		
		obj.setColor = function(_color){
			var _obj = setColor(obj, _color);
			return _obj;
		}

		obj.setHslaColor = function(_h, _s, _l, _a){
			var _obj = setHslaColor(obj, _h, _s, _l, _a);
			return _obj;
		}

		obj.hasPhysics = function(){

			// Add vel as a new property
			obj.vel = { x: 0, y: 0 };

			// Add a new action
			obj.actions['physics'] = function(){

				// Checking collision with walls
				obj.checkWalls();				
				
				// Storing the previous position
				obj.prevPos.x = obj.pos.x;
				obj.prevPos.y = obj.pos.y;

				// Updating speed
				obj.vel.y += gravity;

				// Updating position
				obj.pos.x += obj.vel.x;
				obj.pos.y += obj.vel.y;
			};

			return obj;
		};

		// Invoked by 'hasPhysics'
		obj.checkWalls = function(){
			for(var i = 0; i < walls.length; i++){
				if(isColliding(obj, walls[i])){
					if(walls[i].effect == 'bounce'){
						if (collidedFromTop(obj, walls[i]) || collidedFromBottom(obj, walls[i])){
							obj.pos.y -= obj.vel.y;	// Forced update here to prevent object from being stuck
						    obj.vel.y = -obj.vel.y;
						}
						if (collidedFromLeft(obj, walls[i]) || collidedFromRight(obj, walls[i])){
							obj.pos.x -= obj.vel.x;	// Forced update here to prevent object from being stuck
						    obj.vel.x = -obj.vel.x;
						}
					}
				}
			}
		};				

		return obj;
	}

	function MgWall(_x, _y, _width, _height, _effect){

		/*------------------- PROPERTIES -------------------*/
		var obj = {};
		obj.pos = { x: _x,	y: _y };
		obj.width = _width;
		obj.height = _height;
		obj.color = "gray";
		obj.effect = _effect;

		obj.setColor = function(_color){
			var _obj = setColor(obj, _color);
			return _obj;
		}

		obj.setHslaColor = function(_h, _s, _l, _a){
			var _obj = setHslaColor(obj, _h, _s, _l, _a);
			return _obj;
		}		

		// Should walls have an update? :S
		obj.display = function(){
			ctx.fillStyle = obj.color;
			ctx.fillRect(obj.pos.x, obj.pos.y, obj.width, obj.height);
		};
		return obj;
	};

	/*---------- Functions shared by both MgWall and MgObject ----------*/
	function setColor(_obj, _color){
		var obj = _obj;
		obj.color = _color;
		return obj;
	};


	function setHslaColor(_obj, _h, _s, _l, _a){
		var obj = _obj;
		obj.color = parseHsla(_h, _s, _l, _a);
		return obj;
	};	

	function isColliding(_obj1, _obj2){
		// Circles?
		if(_obj1.shape === 'circle' && _obj2.shape === 'circle'){
			if(dist(_obj1.pos.x, _obj1.pos.y, _obj2.pos.x, _obj2.pos.y) < _obj1.radius + _obj2.radius){
				return true;
			}else{
				return false;
			}
		}else{
			if(_obj1.pos.x < _obj2.pos.x + _obj2.width && _obj1.pos.x + _obj1.width > _obj2.pos.x &&
	   		   _obj1.pos.y < _obj2.pos.y + _obj2.height && _obj1.height + _obj1.pos.y > _obj2.pos.y){
				return true;
			}else{
				return false;
			}
		}
	}	

	// Detecting collision direction
	function collidedFromLeft(_obj1, _obj2){
		// console.log('left')
	    return _obj1.prevPos.x + _obj1.width < _obj2.pos.x && // was not colliding
	           _obj1.pos.x + _obj1.width > _obj2.posx;
	}

	function collidedFromRight(_obj1, _obj2){
		// console.log('right');
	    return _obj1.prevPos.x > _obj2.pos.x + _obj2.width && // was not colliding
	           _obj1.pos.x < _obj2.pos.x + _obj2.width;
	}

	function collidedFromTop(_obj1, _obj2){
		// console.log('top');
	    return _obj1.prevPos.y + _obj1.height < _obj2.pos.y && // was not colliding
	           _obj1.pos.y + _obj1.height > _obj2.pos.y;
	}

	function collidedFromBottom(_obj1, _obj2){
		// console.log('bottom');
	    return _obj1.prevPos.y > _obj2.pos.y + _obj2.height && // was not colliding
	           _obj1.pos.y < _obj2.pos.y + _obj2.height;
	}

	function Circle(_obj, _x, _y, _radius){

		var obj = _obj;

		/*-------------------- VARIABLES --------------------*/
		obj.shape = 'circle';
		obj.initPos = { x: _x,	y: _y };	// Saving these for reseting the circle later
		obj.pos = { x: _x,	y: _y };
		obj.prevPos = { x: _x,	y: _y };
		obj.radius = _radius;
		obj.width = 2 * _radius;
		obj.height = 2 * _radius;

		/*-------------------- FUNCTIONS --------------------*/

		obj.display = function(){
	        ctx.fillStyle = obj.color;
			ctx.beginPath();
			ctx.arc(obj.pos.x + obj.radius, obj.pos.y + obj.radius, obj.radius, obj.radius, 0, Math.PI*2, false);
			ctx.fill();
		};

		return obj;
	}




	/*---------- AUXILIAR FUNCTIONS ----------*/
	// These are global setup functions (resize canvas, capture touch, check mobile, etc)

	function resizeCanvas(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		width = canvas.width;
		height = canvas.height;
	};

	function startTouch(){
		mgtouch = new MgTouch();
		addTouchListeners();
	};

	function mobileCheck(){
		var check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	};

	// https://gist.github.com/gordonbrander/2230317
	function createId(n) {
	    // Math.random should be unique because of its seeding algorithm.
	    // Convert it to base 36 (numbers + letters), and grab the first 7 characters
	    // after the decimal.
	    return Math.random().toString(36).substr(2, n);
	}	


	/*------ PROCESSING-LIKE FUNCTIONS -------*/

	function constrain(value, min, max){
		var constrainedValue = Math.min(Math.max(value, min), max);	
		return constrainedValue;
	};

	function map(value, aMin, aMax, bMin, bMax){
	  	var srcMax = aMax - aMin,
	    	dstMax = bMax - bMin,
	    	adjValue = value - aMin;
	  	return (adjValue * dstMax / srcMax) + bMin;
	};

	function parseHsla(h, s, l, a){
		var myHslColor = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a +')';
		//console.log('called calculateAngle function');
		return myHslColor;
	};

	function dist(x1, y1, x2, y2){
		var angle = Math.atan2(y1 - y2, x1 - x2);
		var dist;
		if( (y1 - y2) == 0 ){
			dist = (x1 - x2) / Math.cos( angle );
		}else{
			dist = (y1 - y2) / Math.sin( angle );
		}
		return dist;
	};

	/*---------- REQUEST ANIMATION FRAME ----------*/

	window.requestAnimFrame = (function(callback) {
		return  window.requestAnimationFrame ||
	    		window.webkitRequestAnimationFrame ||
	    		window.mozRequestAnimationFrame ||
	    		window.oRequestAnimationFrame ||
	    		window.msRequestAnimationFrame ||
	        	function(callback) {
	          		return window.setTimeout(callback, 1000 / 60);
	        	};
	})();

	window.cancelRequestAnimFrame = ( function() {
	    return window.cancelAnimationFrame          ||
	        window.webkitCancelRequestAnimationFrame    ||
	        window.mozCancelRequestAnimationFrame       ||
	        window.oCancelRequestAnimationFrame     ||
	        window.msCancelRequestAnimationFrame        ||
	        clearTimeout
	} )();


	/*---------- EVENTS ----------*/
	function addTouchListeners(){

		// Mobile or Desktop?
		var startEvent = (isMobile) ? ('touchstart') :('mousedown');
		var moveEvent = (isMobile) ? ('touchmove') :('mousemove');
		var endEvent = (isMobile) ? ('touchend') :('mouseup');

		canvas.addEventListener(startEvent, function(evt){
			// getTouchPos(evt);
			// Execute all functions added to touchstart	
			for(var id in mgtouch.onTouchStart){
				mgtouch.onTouchStart[id]();
			}
			if(gameOver){
				location.reload();
			}
		}, false);

		canvas.addEventListener(moveEvent, function(evt){
			getTouchPos(evt);
			// Execute all functions added to touchmove
			for(var id in mgtouch.onTouchMove){
				mgtouch.onTouchMove[id]();
			}
		}, false);

		canvas.addEventListener(endEvent, function(evt){
			// getTouchPos(evt);
			// Execute all functions added to touchend
			for(var id in mgtouch.onTouchEnd){
				mgtouch.onTouchEnd[id]();
			}
		}, false);

		function getTouchPos(evt){

			// Update current and previous mouse/touch position
			if(isMobile){
				evt.preventDefault();
				var touches = evt.changedTouches;
				mgtouch.prevPos.x = mgtouch.pos.x;
				mgtouch.prevPos.y = mgtouch.pos.y;
				mgtouch.pos.x = touches[0].pageX;
				mgtouch.pos.y = touches[0].pageY;
			}else{
				mgtouch.prevPos.x = mgtouch.pos.x;
				mgtouch.prevPos.y = mgtouch.pos.y;
				mgtouch.pos.x = evt.clientX;
				mgtouch.pos.y = evt.clientY;
			}
		}		
	};

	var init = function(){
		setup();
	};
	return {
		canvasSetup: canvasSetup,
		startTouch: startTouch,
		init: init,
		timer: timer,
		circle: circle,
		wall: wall
	};	
})();