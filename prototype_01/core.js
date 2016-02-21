// Super globals... We might need to expose these
var width, height;
var mgtouch;

var score;
var lives;

var winning;	// Lists of conditions for winning/losing
var losing;		// If nothing is set, we have a highest-score game

var gravity;

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
	
	var gameOver;
	var myTimer;

	function canvasSetup(){
		canvas = document.getElementById('my-canvas');
		ctx = canvas.getContext('2d');
		resizeCanvas();
		isMobile = mobileCheck();
	}

	function setup() {

		// If nothing is passed, default to:
		gravity = 1;
		score = 0;
		gameOver = false;

		// Backup objects' initial properties
		for(var i = 0; i < objects.length; i++){
			objects[i].backup();
		}

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
			posX: 30,
			posY: 30,
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
			ctx.fillRect(timeBar.posX, timeBar.posY, timeBar.width, timeBar.height);
			
			ctx.fillStyle = parseHsla(0, 100, 50, 1);
			var remainingWidth = map(remainingTime, 0, totalTime, 0, timeBar.width);
			ctx.fillRect(timeBar.posX, timeBar.posY, remainingWidth, timeBar.height);
		};
	}

	function MgTouch(){
		
		var obj = {};

		obj.shape = 'circle';
		obj.posX = 0;
		obj.posY = 0;
		obj.prevPosX = 0;
		obj.prevPosY = 0;
		obj.radius = 40;

		obj.onTouchStart = {};	// Lists of functions called; user-added;
		obj.onTouchMove = {};	// Stored with { objectId: function(){} }
		obj.onTouchEnd = {};	// so we can refer to the object id to remove the listener...

		obj.display = function(){
			ctx.fillStyle = "black";
			ctx.beginPath();
			ctx.arc(obj.posX, obj.posY, obj.radius, obj.radius, 0, Math.PI*2, false);
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

		obj.animations = {};	// List with transformation functions
		
		obj.initProperties = {};	// This will be filled out on game initialization

		obj.isThrowable = false;
		obj.isDraggable = false;

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
			// Execute animations
			for(var id in obj.animations){
				obj.animations[id]();
			}

			// Updating boundaries
			updateBoundaries(obj);			
		};

		obj.backup = function(){
			for(var prop in obj){
				if(	typeof obj[prop] !== 'function' &&
					typeof obj[prop] !== 'object' &&
					!Array.isArray(obj[prop])){
					obj['initProperties'][prop] = obj[prop];
				}
			}
		};

		obj.reset = function(){
			obj.setup();
			for(var prop in obj.initProperties){
				obj[prop] = obj.initProperties[prop];
			}
		};		

		// C) ADDITIONAL METHODS
		// These are user-added
		obj.animate = function(_propsObj, _time){

			for(var prop in _propsObj){

				// Let's give our animation a unique id so we can remove it once it is done
				var animId = createId(4);
				var animEnd = (new Date()).getTime() + _time;				
				var initState = obj[prop];
				var endState = _propsObj[prop];

				// Add the animation to the animations list
				obj.animations[animId] = function(){
					var animDiff = animEnd - (new Date()).getTime();

					// Execute animation
					if(animDiff > 0){
						obj[prop] = map(animDiff,
										 _time, 0,
										 initState, endState);
						if(prop === 'radius'){
							obj.width = 2 * obj.radius;
							obj.height = 2 * obj.radius;							
						}

					// Remove animation from animations list
					}else{
						delete obj.animations[animId];	
					}
				};				
			}

			// this.radius -= 20;
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

		obj.draggable = function(_callback){
			
			obj.isDraggable = true;

			var diff = {};
				
			// Add events to mgtouch object
			mgtouch.onTouchStart[obj.id] = function(){
				if(obj.isDraggable && isColliding(obj, mgtouch)){
					obj.isDragging = true;
					diffX = mgtouch.posX - obj.posX;
					diffY =  mgtouch.posY - obj.posY;
				}
			};
			mgtouch.onTouchMove[obj.id] = function(){
				if(obj.isDraggable && obj.isDragging){

					obj.posX = mgtouch.posX - diffX;
					obj.posY = mgtouch.posY - diffY;
				}
			};			
			mgtouch.onTouchEnd[obj.id] = function(){
				if(obj.isDraggable && obj.isDragging){
					obj.isDragging = false;
					diff = { x: 0, y: 0 };
					if(_callback !== undefined){
						_callback();
					}
				}
			};

			return obj;

		};

		obj.throwable = function(_speed, _reverse, _callback){

			obj.isThrowable = true;
				
			// Add events to mgtouch object
			mgtouch.onTouchStart[obj.id] = function(){
				if(obj.isThrowable && isColliding(obj, mgtouch)){
					obj.isDragging = true;
				}
			};
			mgtouch.onTouchEnd[obj.id] = function(){
				if(obj.isThrowable && obj.isDragging){
					obj.isDragging = false;
					var forceX = (mgtouch.posX - mgtouch.prevPosX) * _speed;
					var forceY = (mgtouch.posY - mgtouch.prevPosY) * _speed;
					obj.applyForce(forceX, forceY);
					if(_callback !== undefined){
						_callback();
					}
				}
			};

			return obj;
		}

		obj.removeThrowable = function(){
			obj.isThrowable = false;
		};		
		
		obj.setColor = function(_color){
			var _obj = setColor(obj, _color);
			return _obj;
		}

		obj.setHslaColor = function(_h, _s, _l, _a){
			var _obj = setHslaColor(obj, _h, _s, _l, _a);
			return _obj;
		}

		obj.hasPhysics = function(){

			// Add a new action
			obj.actions['physics'] = function(){

				// Checking collision with walls
				obj.checkWalls();
				
				// Storing the previous position
				obj.prevPosX = obj.posX;
				obj.prevPosY = obj.posY;

				// Updating speed with gravity
				obj.velY += gravity;

				// Updating speed with other accel
				obj.velX += obj.accX;
				obj.velY += obj.accY;

				// Updating position with speed
				obj.posX += obj.velX;
				obj.posY += obj.velY;

				// Cleaning up acceleration
				obj.accX = 0;
				obj.accY = 0;
			};

			return obj;
		};

		obj.applyForce = function(_x, _y){
			obj.accX += _x;
			obj.accY += _y;
		}

		// Invoked by 'hasPhysics'
		obj.checkWalls = function(){
			for(var i = 0; i < walls.length; i++){
				if(isColliding(obj, walls[i])){

					if(walls[i].effect == 'bounce'){
						if (collidedFromTop(obj, walls[i]) || collidedFromBottom(obj, walls[i])){
							obj.posY -= obj.velY;	// Forced update here to prevent object from being stuck
						    obj.velY = -obj.velY;
						}
						if (collidedFromLeft(obj, walls[i]) || collidedFromRight(obj, walls[i])){
							obj.posX -= obj.velX;	// Forced update here to prevent object from being stuck
						    obj.velX = -obj.velX;
						}

					}else if(walls[i].effect == 'reset'){
						obj.reset();
					
					}else if(walls[i].effect == 'destroy'){
						if(lives !== undefined){
							lives --;
							if(lives === 0){
								gameOver = true;	
							}
						}else{
							gameOver = true;
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

		obj.setup = function(){		
			obj.shape = 'rect';
			obj.color = "gray";
			obj.posX = _x;
			obj.posY = _y;
			obj.width = _width;
			obj.height = _height;

			// Not the same as CSS! Used to detect collision
			obj.boxTop = obj.posY;
			obj.boxBottom = obj.posY + obj.height;
			obj.boxLeft = obj.posX;
			obj.boxRight = obj.posX + obj.width;
			obj.prevBoxTop = obj.boxTop;
			obj.prevBoxBottom = obj.boxBottom;
			obj.prevBoxLeft = obj.boxLeft;
			obj.prevBoxRight = obj.boxRight;

			// What does this wall do with objects? bounce/reset/destroy
			obj.effect = _effect;
		}

		obj.update = function(){

		}

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
			ctx.fillRect(obj.posX, obj.posY, obj.width, obj.height);
		};

		obj.setup();

		return obj;
	};

	function Rect(_obj, _x, _y, _width, _height){

		var obj = _obj;

		obj.setup = function(){		
			obj.shape = 'rect';
			obj.color = "gray";
			obj.posX = _x;
			obj.posY = _y;
			obj.width = _width;
			obj.height = _height;

			// Not the same as CSS! Used to detect collision
			obj.boxTop = obj.posY;
			obj.boxBottom = obj.posY + obj.height;
			obj.boxLeft = obj.posX;
			obj.boxRight = obj.posX + obj.width;
			obj.prevBoxTop = obj.boxTop;
			obj.prevBoxBottom = obj.boxBottom;
			obj.prevBoxLeft = obj.boxLeft;
			obj.prevBoxRight = obj.boxRight;

			// What does this wall do with objects? bounce/reset/destroy
			obj.effect = _effect;
		}

		obj.display = function(){
			ctx.fillStyle = obj.color;
			ctx.fillRect(obj.posX, obj.posY, obj.width, obj.height);
		};

		obj.setup();

		return obj;
	}	

	function Circle(_obj, _x, _y, _radius){

		var obj = _obj;

		obj.setup = function(){
			obj.shape = 'circle';
			obj.posX = _x;
			obj.posY = _y;
			obj.prevPosX = _x;
			obj.prevPosY = _y;
			obj.velX = 0;
			obj.velY = 0;
			obj.accX = 0;
			obj.accY = 0;
			obj.radius = _radius;

			// Not the same as CSS! Used to detect collision
			obj.boxTop = obj.posY - obj.radius;
			obj.boxBottom = obj.posY + obj.radius;
			obj.boxLeft = obj.posX - obj.radius;
			obj.boxRight = obj.posX + obj.radius;
			obj.prevBoxTop = obj.boxTop;
			obj.prevBoxBottom = obj.boxBottom;
			obj.prevBoxLeft = obj.boxLeft;
			obj.prevBoxRight = obj.boxRight;			
		};

		obj.display = function(){
	        ctx.fillStyle = obj.color;
			ctx.beginPath();
			ctx.arc(obj.posX, obj.posY, obj.radius, obj.radius, 0, Math.PI*2, false);
			ctx.fill();
		};

		obj.reset = function(){
			obj.setup();
			for(var prop in obj.initProperties){
				obj[prop] = obj.initProperties[prop];
			}
		}

		obj.setup();

		return obj;
	}

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

		// console.log(_obj2.boxTop);
		// console.log(_obj2);		

		// Both circles
		if(_obj1.shape === 'circle' && _obj2.shape === 'circle'){
			if(dist(_obj1.posX, _obj1.posY, _obj2.posX, _obj2.posY) < _obj1.radius + _obj2.radius){
				return true;
			}else{
				return false;
			}

		// Rects
		}else{
			if(_obj1.boxLeft < _obj2.boxRight && _obj1.boxRight > _obj2.boxLeft &&
	   		   _obj1.boxTop < _obj2.boxBottom && _obj1.boxBottom > _obj2.boxTop){
				return true;
			}else{
				return false;
			}
		}
	}

	function updateBoundaries(_obj){

		// Store previous boundaries/positions
		_obj.prevBoxTop = _obj.boxTop;
		_obj.prevBoxBottom = _obj.boxBottom;
		_obj.prevBoxLeft = _obj.boxLeft;
		_obj.prevBoxRight = _obj.boxRight;

		// Update current boundaries
		if(_obj.shape === 'circle'){
			_obj.boxTop = _obj.posY - _obj.radius;
			_obj.boxBottom = _obj.posY + _obj.radius;
			_obj.boxLeft = _obj.posX - _obj.radius;
			_obj.boxRight = _obj.posX + _obj.radius;
		}else{
			_obj.boxTop = _obj.posY;
			_obj.boxBottom = _obj.posY + _obj.height;
			_obj.boxLeft = _obj.posX;
			_obj.boxRight = _obj.posX + _obj.width;
		}
	}

	// Detecting collision direction
	function collidedFromLeft(_obj1, _obj2){
	    return _obj1.prevBoxRight < _obj2.boxLeft && // was not colliding
	           _obj1.boxRight > _obj2.boxLeft;
	}

	function collidedFromRight(_obj1, _obj2){
	    return _obj1.prevBoxLeft > _obj2.boxRight && // was not colliding
	           _obj1.boxLeft < _obj2.boxRight;
	}

	function collidedFromTop(_obj1, _obj2){
	    return _obj1.prevBoxBottom < _obj2.boxTop && // was not colliding
	           _obj1.boxBottom > _obj2.boxTop;
	}

	function collidedFromBottom(_obj1, _obj2){
	    return _obj1.prevBoxTop > _obj2.boxBottom && // was not colliding
	           _obj1.boxTop < _obj2.boxBottom;
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
				mgtouch.prevPosX = mgtouch.posX;
				mgtouch.prevPosY = mgtouch.posY;
				mgtouch.posX = touches[0].pageX;
				mgtouch.posY = touches[0].pageY;
			}else{
				mgtouch.prevPosX = mgtouch.posX;
				mgtouch.prevPosY = mgtouch.posY;
				mgtouch.posX = evt.clientX;
				mgtouch.posY = evt.clientY;
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