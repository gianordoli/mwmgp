var myBall;
var gravity;
var damping;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  myBall = new Ball(width/2, height/2, 100);
  gravity = 0.2;
  damping = -0.8;
}

function draw() {
  background(255);
  myBall.update();
  myBall.display();

}

// Events
function mousePressed(){
	myBall.isOver();
}
function mouseReleased(){
	if(myBall.isDragging){
		myBall.setInMotion();
		myBall.isDragging = false;
	}
}

// Classes
function Ball(_x, _y, _diameter){
	
	// Class variables
	this.pos = {
		x: _x,
		y: _y
	};
	this.vel = {
		x: 0,
		y: 0
	};
	this.diameter = _diameter;
	this.isDragging = false;
	
	this.setInMotion = function(){
		this.vel.x = mouseX - pmouseX;
		this.vel.y = mouseY - pmouseY;
	};

	this.checkWalls = function(){
      if (this.pos.x < this.diameter/2) {
        this.pos.x = this.diameter/2;
        this.vel.x *= damping;
      }else if (this.pos.x > width - this.diameter/2) {
        this.pos.x = width - this.diameter/2;
        this.vel.x *= damping;
      }
      if (this.pos.y > height - this.diameter/2) {
        this.pos.y = height - this.diameter/2;
        this.vel.y *= damping;
        //Still, it may bounce forever unless we make it stop
        if (abs(this.vel.y) < 3) {
          this.vel.y = 0;
        }
      }else if(this.pos.y < this.diameter/2) {
        this.pos.y = this.diameter/2;
        this.vel.y *= damping;
      }
	};

	this.isOver = function(){
		if(dist(this.pos.x, this.pos.y, mouseX, mouseY) < this.diameter/2){
			this.isDragging = true;
		}
	};

	this.update = function(){
		if(this.isDragging){
			this.pos.x = mouseX;
			this.pos.y = mouseY;
		}else{
			// Walls
			this.checkWalls();

			// Updating speed
			this.vel.y += gravity;

			// Updating position
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
		}
	};

	this.display = function(){
		stroke(0);
		fill(150);
		ellipse(this.pos.x, this.pos.y, this.diameter, this.diameter);
	};
}