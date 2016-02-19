// Super globals... We might need to expose these
var width, height;
var mgtouch, mgptouch;
var score;

var mg = mg || {};

mg = (function(){

	/*---------------------- PUBLIC ---------------------*/
	this.timer = function(time){
		myTimer = new Timer(time);
		return myTimer;
	};
	this.circle = function(_x, _y, _radius){
		var myCircle = new Circle();
		myCircle.setup(_x, _y, _radius);
		objects.push(myCircle);
		return myCircle;
	};

	/*---------- VARIABLES ----------*/
	// This is gonna hold all objects created on the scene,
	// so we can simply loop through them to update/display
	var objects = [];

	// PRIVATE
	var request;	// animation
	var canvas;		// canvas
	var ctx;
	var isMobile;

	var myBall;
	var gravity;
	var damping;

	var myTarget;
	var myTimer;

	var gameOver;

	function canvasSetup(){
		canvas = document.getElementById('my-canvas');
		ctx = canvas.getContext('2d');
		resizeCanvas();
		isMobile = mobileCheck();
	}

	function setup() {

		gravity = 1;
		damping = -1;

		score = 0;
		gameOver = false;

		draw();
	}

	function draw() {
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if(!gameOver){

			for(var i = 0; i < objects.length; i++){
				objects[i].update();
				objects[i].display();
			}			

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
		this.pos = {
			x: 0,
			y: 0
		};
		this.radius = 0;
	}

	function Circle(){

		/*-------------------- VARIABLES --------------------*/
		// Everything public for now... :S
		// Initiating all vars so we don't have any 'undefined' problem
		this.pos = { x: 0, y: 0	};
		this.vel = { x: 0, y: 0	};
		this.initPos = { x: 0, y: 0	};	// Saving these for reseting the ball later		
		this.color = "black"; 			// Default
		this.radius = 20;
		this.isDragging = false;

		this.actions = [];			// Array with behavior functions
		this.transformations = [];	// Array with transformation functions

		this.setup = function(_x, _y, _radius){
			this.pos = { x: _x,	y: _y };
			this.initPos = { x: _x,	y: _y };
			this.radius = _radius;
		}

		/*-------------------- FUNCTIONS --------------------*/

		// this.gravitational = gravitational(this);

		this.animate = function(_obj, _time){
			this.radius -= 20;
			return this;
		}

		this.setInteraction = function(_array, callback){
			var parent = this;
			// console.log(_array[0]);
			// console.log(_array[1]);
			var debounce;			
			this.actions.push(function(){
				if(parent.isOver(_array[0]) && parent.isOver(_array[1])){
		    		clearTimeout(debounce);
		    		debounce = setTimeout(callback, 500); 
				}	
			});
			return this;
		};
		
		// Class variables
		this.setColor = function(_color){
			if(typeof _color === "string"){
				this.color = _color;
			}else if(typeof _color === 'object'){
				this.color = parseHsla(_color['h'], _color['s'], _color['l'], _color['a'])
			}
			return this;
			// we could add more conditions to allow for rgb, rgba, etc...
		};

		this.throwable = function(){
			addListeners(this);
			return this;
		};
		/*----------------------------*/


		this.update = function(){
			for(var i = 0; i < this.actions.length; i++){
				this.actions[i]();
			};
			if(this.isDragging){
				// this.pos.x = touch.pos.x;
				// this.pos.y = touch.pos.y;
			// if(!this.isDragging){
			}else{
				if(this.vel.x > 2 || this.vel.y > 2){

					// Walls
					this.checkWalls();
					// this.bounce();

					// Updating speed
					this.vel.y += gravity;

					// Updating position
					this.pos.x += this.vel.x;
					this.pos.y += this.vel.y;
				}
			}
		};

		this.display = function(){
	        // ctx.fillStyle = parseHsla(190, 100, 50, 1);
	        ctx.fillStyle = this.color;
	        ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(this.pos.x, this.pos.y, this.radius, this.radius, 0, Math.PI*2, false);
			ctx.fill();
		};

		this.isOver = function(_obj){
			if(dist(_obj.pos.x, _obj.pos.y, this.pos.x, this.pos.y) < _obj.radius + this.radius){
				return true;
			}else{
				return false;
			}
		}

		this.setInMotion = function(){
			var speed = 1;
			this.vel.x = (mgtouch.pos.x - mgptouch.pos.x)*speed;
			this.vel.y = (mgtouch.pos.y - mgptouch.pos.y)*speed;
		};

		this.checkWalls = function(){
			if (this.pos.x < 0 || this.pos.x > canvas.width
				// || this.pos.y > canvas.height || this.pos.y < 0) {
				|| this.pos.y > canvas.height) {
				
				// new ball wih initial user-set values
				this.pos = {
					x: this.initPos.x,
					y: this.initPos.y
				};
				this.vel = {
					x: 0,
					y: 0
				};
			}
		};

		// Not really using this for now
		this.bounce = function(){
	      if (this.pos.x < this.radius) {
	        this.pos.x = this.radius;
	        this.vel.x *= damping;
	      }else if (this.pos.x > canvas.width - this.radius) {
	        this.pos.x = canvas.width - this.radius;
	        this.vel.x *= damping;
	      }
	      if (this.pos.y > canvas.height - this.radius) {
	        this.pos.y = canvas.height - this.radius;
	        this.vel.y *= damping;
	        //Still, it may bounce forever unless we make it stop
	        if (Math.abs(this.vel.y) < 3) {
	          this.vel.y = 0;
	        }
	      }else if(this.pos.y < this.radius) {
	        this.pos.y = this.radius;
	        this.vel.y *= damping;
	      }
		};
	}

	function gravitational(_obj){
		console.log(_obj);
		var obj = _obj;
		obj.actions.push(function(){
			console.log('yay!');
		});
		return obj;
	}


	/*---------- AUXILIAR FUNCTIONS ----------*/
	// These are global setup functions (resize canvas, capture touch, check mobile, etc)

	function resizeCanvas(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		width = canvas.width;
		height = canvas.height;
	}

	function startTouch(){
		mgtouch = new MgTouch();
		mgptouch = new MgTouch();		
	}

	function mobileCheck(){
		var check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}


	/*------ PROCESSING-LIKE FUNCTIONS -------*/

	function constrain(value, min, max){
		var constrainedValue = Math.min(Math.max(value, min), max);	
		return constrainedValue;
	}

	function map(value, aMin, aMax, bMin, bMax){
	  	var srcMax = aMax - aMin,
	    	dstMax = bMax - bMin,
	    	adjValue = value - aMin;
	  	return (adjValue * dstMax / srcMax) + bMin;
	}	

	function parseHsla(h, s, l, a){
		var myHslColor = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a +')';
		//console.log('called calculateAngle function');
		return myHslColor;
	}

	function dist(x1, y1, x2, y2){
		var angle = Math.atan2(y1 - y2, x1 - x2);
		var dist;
		if( (y1 - y2) == 0 ){
			dist = (x1 - x2) / Math.cos( angle );
		}else{
			dist = (y1 - y2) / Math.sin( angle );
		}
		return dist;
	}

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
	function addListeners(_obj){
		if(isMobile){
			canvas.addEventListener('touchstart', function(evt){
				if(gameOver){
					location.reload();
				}else{
					getTouchPos(evt);
					if(_obj.isOver(mgtouch)){
						_obj.isDragging = true;
					};
				}
			}, false);

			canvas.addEventListener('touchmove', function(evt){
				getTouchPos(evt);
			}, false);

			canvas.addEventListener('touchend', function(evt){
				if(_obj.isDragging){
					_obj.setInMotion();
					_obj.isDragging = false;
				}
			}, false);
		}else{
			canvas.addEventListener('mousedown', function(evt){
				if(gameOver){
					location.reload();
				}else{
					getTouchPos(evt);			
					if(_obj.isOver(mgtouch)){
						_obj.isDragging = true;
					};
				}
			}, false);

			canvas.addEventListener('mousemove', function(evt){
				getTouchPos(evt);
			}, false);

			canvas.addEventListener('mouseup', function(evt){
				if(_obj.isDragging){
					_obj.setInMotion();
					_obj.isDragging = false;
				}
			}, false);			
		}

		function getTouchPos(evt){
			if(isMobile){
				evt.preventDefault();
				var touches = evt.changedTouches;
				mgptouch.pos.x = mgtouch.pos.x;
				mgptouch.pos.y = mgtouch.pos.y;
				mgtouch.pos.x = touches[0].pageX;
				mgtouch.pos.y = touches[0].pageY;
			}else{
				mgptouch.pos.x = mgtouch.pos.x;
				mgptouch.pos.y = mgtouch.pos.y;
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
		circle: circle
	};	
})();