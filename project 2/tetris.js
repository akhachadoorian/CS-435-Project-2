/*
    CS 435
    Project 2
    Alex Khachadoorian
    This project draws the 6 tetris tetriminos and allows the user to create more to play with. 
    The user clicks on the 6 base tetris tetriminos that appear along the top to create a duplicate of the shape.
    This shape can be moved and rotated using the shift or alt key. It can also be deleted by moving it into the lower section of the canvas.
*/

"use strict"
///////////////////////////////////
/*       GLOBAL VARIABLES        */
///////////////////////////////////

var canvas;
var gl;

// BUFFER VARIABLES
var vPosition; //holds all the vertex positions
var vColor; //holds all the vertex colors

// CANVAS VARIABLES
var windowWidth; //holds the canvas width
var windowHeight; //holds the canvas height

// MINO VARIABLES
var minoSize = 25; 
var innerSize = 5; //difference in size of inner square of mino

// UNIFORM VARIABLES
var projection; //holds the projection uniform variable
var transformation; //holds the transformation uniform variable

// ARRAYS THAT HOLD ITEMS TO DRAW
var separators; //holds the separator lines
var baseTetriminos; //holds the base tetris tetriminos
var newTetriminos; //holds the tetris tetriminos are adding by mouse events

// MOVING TETRIMINO VARIABLES
var tetriminoIdToBeMoved; //index of block to be moved
var moveCount; //number of blocks to be moved
var oldX; //old x value
var oldY; //old y value
var rotIndex = 5; // rotation index (default is 5)
var rotDegrees = [ 1, 5, 10, 30, 45, 90]; //holds the amount of degrees for a rotation

// TETRIMINO COLORS
var squareColor = vec4(0.7, 0.7, 0.0, 0.5); //set square tetrimino to light yellow
var lineColor = vec4(0.0, 0.0, 1.0, 0.4); //set line tetrimino to light blue
var rocketColor = vec4(1.0, 0.0, 0.0, 0.5); //set rocket tetrimino to light red
var rightLColor = vec4(1.0, 0.2, 0.0, 0.5); //set right l tetrimino to light orange
var leftLColor = vec4(0.2, 0.0, 1.0, 0.5); //set left l tetrimino to light purple
var rightZColor = vec4(0.0, 0.5, 0.0, 0.4); //set right z tetrimino to light green
var leftZColor = vec4(0.8, 0.1, 0.7, 0.4); //set left z tetrimino to light pink

// MINO POINT ARRAYS
var squarePoints = [];
var linePoints = [];
var rocketPoints = [];
var rightLPoints = [];
var leftLPoints = [];
var rightZPoints = [];
var leftZPoints = [];

///////////////////////////////////
/*       GLOBAL FUNCTIONS        */
///////////////////////////////////

// FUNCTION TO SETUP MINO POINT ARRAYS
function pointSetup() {
    
// INSTANCE VARIABLES
var curr = minoSize; //determine start point
var highHeight = windowHeight - (minoSize * 2);; //determine the mino's highest y value
var lowHeight = windowHeight - (minoSize * 3); //determine the mino's lowest y value

//FILL SQUARE TETRIMINO ARRAY AND UPDATE CURR
fillPoints(squarePoints, lowHeight, highHeight);
curr = curr + (minoSize * 3); //move over 3 spaces b/c width of tetrimino is 2 minos

//FILL LINE TETRIMINO ARRAY AND UPDATE CURR
fillPoints(linePoints, lowHeight, highHeight);
curr = curr + (minoSize * 5); //move over 5 spaces b/c width of tetrimino is 4 minos

//FILL ROCKET TETRIMINO ARRAY AND UPDATE CURR
fillPoints(rocketPoints, lowHeight, highHeight);
curr = curr + (minoSize * 4); //move over 4 spaces b/c width of tetrimino is 3 minos

//FILL RIGHT L TETRIMINO ARRAY AND UPDATE CURR
fillPoints(rightLPoints, lowHeight, highHeight);
curr = curr + (minoSize * 4); //move over 4 spaces b/c width of tetrimino is 3 minos

//FILL LEFT L TETRIMINO ARRAY AND UPDATE CURR
fillPoints(leftLPoints, lowHeight, highHeight);
curr = curr + (minoSize * 4); //move over 4 spaces b/c width of tetrimino is 3 minos

//FILL RIGHT Z TETRIMINO ARRAY AND UPDATE CURR
fillPoints(rightZPoints, lowHeight, highHeight);
curr = curr + (minoSize * 4); //move over 4 spaces b/c width of tetrimino is 3 minos

//CALC HEIGHTS and FILL LEFT Z ARRAY
highHeight = highHeight + minoSize; //update height since start is top
lowHeight = lowHeight + minoSize; //update height since start is top
fillPoints(leftZPoints, lowHeight, highHeight);

    // FUNCTION TO FILL TETRIMINO ARRAY WITH 4 POINTS (STARTING MINO)
    // pointArray -> blank array to be filled
    // lowHeight -> lowest y value of tetrimino
    // highestHeight -> highest y value of tetrimino
    function fillPoints(pointArray, lowHeight, highHeight) { 
        // push each point into array
        pointArray.push(vec2(curr, lowHeight)); //bottom left
        pointArray.push(vec2(curr + minoSize, lowHeight)); //bottom right
        pointArray.push(vec2(curr + minoSize, highHeight)); //top right
        pointArray.push(vec2(curr, highHeight)); //top left
    }
}

// FUNCTION TO SETUP BASE TETRIMINOS AND SEPARATOR LINES
function setup() {
    // SETUP BASE TETRIMINOS
    baseTetriminos = []; //set variable to empty array
    baseTetriminos.push(new squareTetrimino(squareColor)); //create starting square tetrimino
    baseTetriminos.push(new lineTetrimino(lineColor)); //create starting line tetrimino
    baseTetriminos.push(new rocketTetrimino(rocketColor)); //create starting rocket tetrimino
    baseTetriminos.push(new rightLTetrimino(rightLColor)); //create starting right l tetrimino
    baseTetriminos.push(new leftLTetrimino(leftLColor)); //create starting left l tetrimino
    baseTetriminos.push(new rightZTetrimino(rightZColor)); //create starting right z tetrimino
    baseTetriminos.push(new leftZTetrimino(leftZColor)); //create starting left z tetrimino

    // INITIALIZE BASE TETRIMINOS
    for (var i=0; i<baseTetriminos.length; i++) {
        baseTetriminos[i].init();
    }

    // SET UP SEPARATORS
    separators  = []; //set equal to empty array
    separators.push(new seperatorLine(windowHeight - (minoSize * 4))); //create separator line at top of canvas
    separators.push(new seperatorLine(minoSize * 4)); //create separator line at the bottom of the canvas

    // INITIALIZE SEPARATORS
    for (var i = 0;  i < separators.length; i++) {
        separators[i].init();
    }
}

// CREATE MINO ON THE RIGHT OF CURRENT ONE
// color -> mino's color (vec4)
// bottomLeft -> mino's bottom left point
// topLeft -> mino's top left point
function buildRight(color, bottomLeft, topLeft) { 
    // CALCULATE REMAINING POINTS
    var topRight = add(topLeft, vec2(minoSize, 0)); //make top right the top left's x plus size of mino
    var bottomRight = add(bottomLeft, vec2(minoSize, 0)); //make bottom right the bottom left's x plus the size of mino

    // CREATE MINO
    var mino = new Mino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1], topLeft[0], topLeft[1]); 

    return mino;
}

// CREATE MINO ON THE RIGHT OF CURRENT ONE
// color -> mino's color (vec4)
// bottomLeft -> mino's bottom left point
// bottomRight -> mino's bottom right point
function buildTop(color, bottomLeft, bottomRight) { //takes the mino's color (vec4), the point that will become the bottom left, point that will be the bottom right
    // CALCULATE REMAINING POINTS
    var topRight = add(bottomRight, vec2(0, minoSize)); //top right will be the bottom right's y plus size of mino
    var topLeft = add(bottomLeft, vec2(0, minoSize)); //top left will be the bottom left's y plus size of mino

    // CREATE MINO
    var mino = new Mino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1], topLeft[0], topLeft[1]);

    return mino;
}

// CREATE MINO ON THE RIGHT OF CURRENT ONE
// color -> mino's color (vec4)
// topLeft -> mino's top left point
// topRight -> mino's top right point
function buildBottom(color, topLeft, topRight) {
    // CALCULATE REMAINING POINTS    
    var bottomRight = add(topRight, vec2(0, -minoSize)); //bottom right will be the top right's y plus size of mino
    var bottomLeft = add(topLeft, vec2(0, -minoSize));

    // CREATE MINO
    var mino = new Mino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1],topLeft[0], topLeft[1]);

    return mino;
}

///////////////////////////////////
/*           CLASSES             */
///////////////////////////////////

// MINO CLASS
// color -> mino's color (vec4)
// x0 -> bottom left x value
// y0 -> bottom left y value
// x1 -> bottom right x value
// y1 -> bottom right y value
// x2 -> top right x value
// y2 -> top right y value
// x3 -> top left x value
// y4 -> top left y value
function Mino (color, x0, y0, x1, y1, x2, y2, x3, y3) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    // SET UP MINO COLOR
    this.color = color; //instance variable to hold mino's color
    this.colors = []; //array to hold all the vertex colors that set to empty
    for (var i = 0; i < 4; i++) this.colors.push(color); //same color for all vertices

    // SET UP MINO BASE POINTS
    this.points = []; //array to hold all of the vertices that is set to empty 
    this.points.push(vec2(x0, y0)); //bottom left
    this.points.push(vec2(x1, y1)); //bottom right
    this.points.push(vec2(x2, y2)); //top right
    this.points.push(vec2(x3, y3)); //top left

    // SET UP MINO BLACK BORDER
    this.points.push(vec2(x0, y0)); //bottom left
    this.points.push(vec2(x1, y1)); //bottom right
    this.points.push(vec2(x2, y2)); //top right
    this.points.push(vec2(x3, y3)); //top left
    for (var i = 0; i < 4; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0)); //set vertices' color to black

    // SET UP INNER SQUARE 
    this.points.push(vec2(x0 + innerSize, y0 + innerSize)); //bottom left
    this.points.push(vec2(x1 - innerSize, y1 + innerSize)); //bottom right
    this.points.push(vec2(x2 - innerSize, y2 - innerSize)); //top right
    this.points.push(vec2(x3 + innerSize, y3 - innerSize)); //top left

    var innerColor = add(color, vec4(0.0, 0.0, 0.0, 0.3)); //calculate inner color to have slightly darker opacity
    for (var i = 0; i<4; i++) this.colors.push(innerColor); //set vertices' to this new color

    // BUFFER VARIABLES
    this.vBuffer = 0; //vertex buffer
    this.cBuffer = 0; //color buffer

    // MOVEMENT VARIABLES
    this.offsetX = 0; //holds offset for mino's x values
    this.offsetY = 0; //holds offset of mino's y values
    this.angle = 0; //holds the mino's rotation angle
    this.rotationCenter = this.points[0]; //point where mino is rotated around (default is points[0])

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET BOTTOM LEFT POINT
    this.bottomLeft = function() {
        return this.points[0];
    }

    // GET TOP LEFT POINT
    this.topLeft = function() {
        return this.points[3];
    }

    // GET TOP RIGHT POINT
    this.topRight = function() {
        return this.points[2];
    }

    // GET BOTTOM RIGHT POINT
    this.bottomRight = function() {
        return this.points[1];
    } 

    // UPDATE MINO'S OFFSET VALUES
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffsetMino = function(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    // UPDATE THE ROTATION CENTER OF THE TIME
    // center -> point of rotation (vec2)
    this.updateRotationCenter = function(center) {
        this.rotationCenter = center;
    }

    // UPDATE MINO'S ANGLE
    // deg -> amount of degrees that mino was rotated
    this.updateAngleMino = function(deg) {
        this.angle += deg;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // SET UP VERTEX BUFF
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        // SET UP COLOR BUFFER
        this.cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    // FUNCTION TO DRAW MINO
    this.draw = function() {
        // CALCULATE TRANSFORMATION MATRIX
        var tm=translate(this.rotationCenter[0]+this.offsetX, this.rotationCenter[1]+this.offsetY, 0.0);
        tm=mult(tm, rotate(this.angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.rotationCenter[0], -this.rotationCenter[1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        // COPY VERTEX POSITIONS OVER THE VPOSITION
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        // COPY COLORS OVER TO VCOLOR
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        // DRAW MINO
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4); //draw filled in section of mino
        gl.drawArrays( gl.LINE_LOOP, 4, 4); //draw outline of mino
        gl.drawArrays( gl.LINE_LOOP, 8, 4); //draw smaller square inside mino
    }

    // FUNCTION TO TRANSFORM POINT TO CORRESPOND WITH MOVED MINO
    // x -> x value
    // y -> y value
    this.transform = function(x, y) {
        // CALCULATE THETA IN RADIANS
        if (this.angle != 0) {
            var theta = Math.PI/180*this.angle;
        }
        else {
            var theta = -Math.PI/180*this.angle;
        }

        // CALCULATE NEW X AND Y VALUES
        var x2 = this.rotationCenter[0] + (x - this.rotationCenter[0]-this.offsetX) * Math.cos(theta) - (y - this.rotationCenter[1]-this.offsetY) * Math.sin(theta);
        var y2 = this.rotationCenter[1] + (x - this.rotationCenter[0]-this.offsetX) * Math.sin(theta) + (y - this.rotationCenter[1]-this.offsetY) * Math.cos(theta);

        return vec2(x2, y2);
    }

    // FUNCTION TO DETERMINE IF POINT IS TO THE LEFT OF A LINE
    // x -> x value of point
    // y -> y value of point
    // startPoint -> index for start of line
    this.isLeft = function(x, y, startPoint) {	
        // CALCULATE INDEX FOR ENDPOINT
        var endPoint = (startPoint + 1) % 4;

        // DO CROSS PRODUCT
        var c = (y-this.points[startPoint][1])*(this.points[endPoint][0]-this.points[startPoint][0]);
        var d = (x-this.points[startPoint][0])*(this.points[endPoint][1]-this.points[startPoint][1]);

        return c >= d;
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF MINO
    // x -> x value of point
    // y -> y value of point
    this.isInsideMino = function(x, y) {
        var p=this.transform(x, y); //calculate version of point that corresponds to mino's transformation

        // CHECK IF POINT IS LEFT FOR ALL LINES OF MINO
        for (var i = 0; i < 4; i++) { 
            if (!this.isLeft(p[0], p[1], i)) { //if at any point not left, point not inside mino
                return false;
            }
        }
        return true; //otherwise inside mino
    }

    // FUNCTION TO DETERMINE IF MINO NEEDS TO BE DELETED
    this.inDeleteMino = function() {
        for (var i = 0; i < 4; i++) {
            var trueY = this.points[i][1] + this.offsetY; //calculate transformed y value of mino

            if (trueY <= minoSize * 4) { //if y is below separator line, it needs to be deleted
                return true;
            }
        }
        
        return false; //otherwise mino is above line
    }

}

// squares TETRIMINO CLASS
// color -> mino's color (vec4)
function squareTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.squares = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "squares";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE BOTTOM LEFT MINO
        this.squares.push(new Mino(color, squarePoints[0][0], squarePoints[0][1], squarePoints[1][0],squarePoints[1][1], squarePoints[2][0], squarePoints[2][1],squarePoints[3][0], squarePoints[3][1]));
        this.squares[0].init();
        
        // CREATE AND INITIALIZE BOTTOM RIGHT MINO
        this.squares.push(buildRight(this.color, this.squares[0].bottomRight(), this.squares[0].topRight()));
        this.squares[1].init();

        // CREATE AND INITIALIZE TOP LEFT MINO
        this.squares.push(buildTop(this.color, this.squares[0].topLeft(), this.squares[0].topRight()));
        this.squares[2].init();

        // CREATE AND INITIALIZE TOP RIGHT
        this.squares.push(buildTop(this.color, this.squares[1].topLeft(), this.squares[1].topRight()));
        this.squares[3].init();

        //UPDATE EACH MINO'S CENTER
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateRotationCenter(this.squares[0].topRight()); //mino center is middle of square tetrimino
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.squares[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.squares[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.squares[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// lines TETRIMINO CLASS
// color -> mino's color (vec4)
function lineTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.lines = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.lines[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.lines[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "lines";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE FIRST MINO
        this.lines.push(new Mino(color, linePoints[0][0], linePoints[0][1], linePoints[1][0], linePoints[1][1], linePoints[2][0], linePoints[2][1], linePoints[3][0], linePoints[3][1]));
        this.lines[0].init();

        // CREATE AND INITIALIZE SECOND MINO
        this.lines.push(buildRight(this.color, this.lines[0].bottomRight(), this.lines[0].topRight()));
        this.lines[1].init();

        
        // CREATE AND INITIALIZE THIRD MINO
        this.lines.push(buildRight(this.color, this.lines[1].bottomRight(), this.lines[1].topRight()));
        this.lines[2].init();
        
        
        // CREATE AND INITIALIZE FOURTH MINO
        this.lines.push(buildRight(this.color, this.lines[2].bottomRight(), this.lines[2].topRight()));
        this.lines[3].init();
        
        // CALCULATE AND SET CENTER FOR MINOS
        var temp = this.lines[1].bottomRight(); //get second mino's bottom right point
        var tempY = temp[1] + (minoSize / 2); //increase the y by half the mino size
        temp = vec2(temp[0], tempY);

        for (var i = 0; i < 4; i++) {
            this.lines[i].updateRotationCenter(temp); //center is point btw the middle 2 minos
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.lines[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.lines[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.lines[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// rockets TETRIMINO CLASS
// color -> mino's color (vec4)
function rocketTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.rockets = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "rockets";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        //CREATE AND INITIALIZE STARTING MINO
        this.rockets.push(new Mino(this.color, rocketPoints[0][0], rocketPoints[0][1], rocketPoints[1][0], rocketPoints[1][1], rocketPoints[2][0], rocketPoints[2][1], rocketPoints[3][0], rocketPoints[3][1]));
        this.rockets[0].init();

        //CREATE AND INITIALIZE MINO TO THE RIGHT
        this.rockets.push(buildRight(this.color, this.rockets[0].bottomRight(), this.rockets[0].topRight()));
        this.rockets[1].init();

        //CREATE AND INITIALIZE MINO TO THE TOP OF SECOND MINO
        this.rockets.push(buildTop(this.color, this.rockets[1].topLeft(), this.rockets[1].topRight()));
        this.rockets[2].init();
        
        //CREATE AND INITIALIZE MINO TO THE RIGHT OF SECOND MINO
        this.rockets.push(buildRight(this.color, this.rockets[1].bottomRight(), this.rockets[1].topRight()));
        this.rockets[3].init();

        // CALCULATE AND SET CENTER FOR MINOS
        var temp = this.rockets[1].bottomLeft(); //get second mino's bottom left point
        var tempX = temp[0] + (minoSize / 2); //increase the x value by half the mino size
        temp = vec2(tempX, temp[1]); //update point

        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateRotationCenter(temp); //center is middle point between middle mino and mino on top of it
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.rockets[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.rockets[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rockets[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// rightLs TETRIMINO CLASS
// color -> mino's color (vec4)
function rightLTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.rightLs = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "rightLs";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE FIRST MINO
        this.rightLs.push(new Mino(this.color, rightLPoints[0][0], rightLPoints[0][1], rightLPoints[1][0], rightLPoints[1][1], rightLPoints[2][0], rightLPoints[2][1], rightLPoints[3][0], rightLPoints[3][1]));
        this.rightLs[0].init();

        // CREATE AND INITIALIZE MINO TO THE RIGHT
        this.rightLs.push(buildRight(this.color, this.rightLs[0].bottomRight(), this.rightLs[0].topRight()));
        this.rightLs[1].init();

        // CREATE AND INITIALIZE MINO TO THE RIGHT
        this.rightLs.push(buildRight(this.color, this.rightLs[1].bottomRight(), this.rightLs[1].topRight()));
        this.rightLs[2].init();

        // CREATE AND INITIALIZE MINO ON TOP
        this.rightLs.push(buildTop(this.color, this.rightLs[2].topLeft(), this.rightLs[2].topRight()));
        this.rightLs[3].init();

        // SET CENTER FOR MINOS
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateRotationCenter(this.rightLs[1].topRight()); //center is second mino's top right point
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.rightLs[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.rightLs[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightLs[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// leftLs TETRIMINO CLASS
// color -> mino's color (vec4)
function leftLTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.leftLs = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "leftLs";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE FIRST MINO
        this.leftLs.push(new Mino(this.color, leftLPoints[0][0], leftLPoints[0][1], leftLPoints[1][0], leftLPoints[1][1], leftLPoints[2][0], leftLPoints[2][1], leftLPoints[3][0], leftLPoints[3][1]));
        this.leftLs[0].init();

        // CREATE AND INITIALIZE MINO ON TOP
        this.leftLs.push(buildTop(this.color, this.leftLs[0].topLeft(), this.leftLs[0].topRight()));
        this.leftLs[1].init();

        // CREATE AND INITIALIZE MINO TO THE RIGHT OF FIRST MINO 
        this.leftLs.push(buildRight(this.color, this.leftLs[0].bottomRight(), this.leftLs[0].topRight()));
        this.leftLs[2].init();

        // CREATE AND INITIALIZE TO THE RIGHT
        this.leftLs.push(buildRight(this.color, this.leftLs[2].bottomRight(), this.leftLs[2].topRight()));
        this.leftLs[3].init();

        // SET CENTER FOR MINOS
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateRotationCenter(this.leftLs[0].topRight()); //center is the first mino's top right point
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.leftLs[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.leftLs[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.leftLs[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// rightZs TETRIMINO CLASS
// color -> mino's color (vec4)
function rightZTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.rightZs = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "rightZs";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE FIRST MINO
        this.rightZs.push(new Mino(this.color, rightZPoints[0][0], rightZPoints[0][1], rightZPoints[1][0], rightZPoints[1][1], rightZPoints[2][0], rightZPoints[2][1], rightZPoints[3][0], rightZPoints[3][1]));
        this.rightZs[0].init();

        // CREATE AND INITIALIZE BUILD MINO TO THE RIGHT
        this.rightZs.push(buildRight(this.color, this.rightZs[0].bottomRight(), this.rightZs[0].topRight()));
        this.rightZs[1].init();

        // CREATE AND INITIALIZE MINO ON TOP
        this.rightZs.push(buildTop(this.color, this.rightZs[1].topLeft(), this.rightZs[1].topRight()));
        this.rightZs[2].init();

        // CREATE AND INITIALIZE MINO ON RIGHT
        this.rightZs.push(buildRight(this.color, this.rightZs[2].bottomRight(), this.rightZs[2].topRight()));
        this.rightZs[3].init();

        // CALCULATE AND SET CENTERS FOR MINOS
        var temp = this.rightZs[1].topLeft(); //get second mino's top left point
        var tempX = temp[0] + (minoSize / 2); //increase the x value by half the mino's size
        temp = vec2(tempX, temp[1]);

        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateRotationCenter(temp); //center is middle between stacked minos
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.rightZs[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.rightZs[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightZs[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

// leftZs TETRIMINO CLASS
// color -> mino's color (vec4)
function leftZTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.leftZs = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "leftZs";
    }

    // GET TETRIMINO'S COLOR
    this.getColor = function() {
        return this.color;
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // CREATE AND INITIALIZE TOP LEFT MINO
        this.leftZs.push(new Mino(this.color, leftZPoints[0][0], leftZPoints[0][1], leftZPoints[1][0], leftZPoints[1][1], leftZPoints[2][0], leftZPoints[2][1], leftZPoints[3][0], leftZPoints[3][1]));
        this.leftZs[0].init();
        
        // CREATE AND INITIALIZE MINO TO RIGHT
        this.leftZs.push(buildRight(this.color, this.leftZs[0].bottomRight(), this.leftZs[0].topRight()));
        this.leftZs[1].init();

        // CREATE AND INITIALIZE MINO BELOW
        this.leftZs.push(buildBottom(this.color, this.leftZs[1].bottomLeft(), this.leftZs[1].bottomRight()));
        this.leftZs[2].init();

        // CREATE AND INITIALIZE MINO TO RIGHT
        this.leftZs.push(buildRight(this.color, this.leftZs[2].bottomRight(), this.leftZs[2].topRight()));
        this.leftZs[3].init();

        // CALCULATE AND SET CENTER FOR MINOS
        var temp = this.leftZs[1].bottomLeft(); //get second mino's bottom left point
        var tempX = temp[0] + (minoSize / 2); //increase the x by half a mino's size
        temp = vec2(tempX, temp[1]);

        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateRotationCenter(temp); //center is center of stacked minos
        }
    }

    // FUNCTION TO DRAW TETRIMINO BY CALLING DRAW FUNCTION FOR EACH MINO
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.leftZs[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.leftZs[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.leftZs[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}

function seperatorLine(height) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    // SET UP SEPARATOR POINTS
    this.points = [];
    this.points.push(vec2(minoSize, height));
    this.points.push(vec2((windowWidth - minoSize), height));

    // SET UP SEPARATOR COLOR
    this.colors = [];
    for (var i = 0; i < 3; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0)); //all vertices are black
    
    // BUFFER VARIABLES
    this.vBuffer = 0; //vertex buffer
    this.cBuffer = 0; //color buffer

    // MOVEMENT VARIABLES
    this.offsetX = 0; //holds offset for mino's x values
    this.offsetY = 0; //holds offset of mino's y values
    this.angle = 0; //holds the mino's rotation angle

    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // GET SEPARATOR SET
    this.getStart = function() {
        return this.points[0];
    }

    // GET SEPARATOR SET
    this.getEnd = function() {
        return this.points[1];
    }

    ///////////////////////////////////
    /*       OTHER FUNCTIONS         */
    ///////////////////////////////////

    //INITIALIZATION FUNCTION
    this.init = function() {
        // SET UP VERTEX BUFF
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        // SET UP COLOR BUFFER
        this.cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    // FUNCTION TO DRAW SEPARATOR
    this.draw = function() {
        // CALCULATE TRANSFORMATION MATRIX
        var tm=translate(this.points[0][0]+this.offsetX, this.points[0][1]+this.offsetY, 0.0);
        tm=mult(tm, rotate(this.angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        // COPY VERTEX POSITIONS OVER THE VPOSITION
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        // COPY COLORS OVER TO VCOLOR
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        // DRAW LINE
        gl.drawArrays( gl.LINES, 0, 2);
    }
}

///////////////////////////////////
/*         MAIN FUNCTION         */
///////////////////////////////////

window.onload = function initialize() {
    // GET CANVAS
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //SET WIDTH AND HEIGHT
    windowHeight = canvas.height;
    windowWidth = canvas.width;

    ///////////////////////////////////
    /*             EVENTS            */
    ///////////////////////////////////

    // MOUSE DOWN EVENT
    canvas.addEventListener("mousedown", function(event) {
        if (event.button != 0) return; // left button only

        // DETERMINE WHICH MENU ITEM SELECTED
        var m = document.getElementById("mymenu");
        m.selectedIndex = rotIndex;
        m.addEventListener("click", function() {
            rotIndex = m.selectedIndex;
        });

        var tetriminoLen = newTetriminos.length; //set variable to number of new tetriminos
        var baseTetriminoClicked = true; //variable to note if base tetrimino clicked

        // CALCULATE X AND Y VALUES FOR CLICKED LOCATION
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        y=canvas.height-y;

        // IF CLICK WITH SHIFT KEY
        if (event.shiftKey) {
            for (var i = tetriminoLen - 1; i >= 0; i--) {	//search new tetriminos from end to start
                if (newTetriminos[i].isInside(x, y)) { //new tetrimino that has been click has been found
                  // MOVE CLICKED TETRIMINO TO THE TOP OF ARRAY
                  var temp = newTetriminos[i];
                  for (var j = i; j<tetriminoLen; j++) newTetriminos[j] = newTetriminos[j + 1];
                  newTetriminos[tetriminoLen - 1] = temp;

                  // ROTATE THE TETRIMINO CLOCKWISE 
                  newTetriminos[tetriminoLen - 1].updateAngle(rotDegrees[rotIndex]);

                  // REDRAW
                  render();

                  return;
                }
              }
              return;
        }

        // IF CLICK WITH ALT KEY
        if (event.altKey) {
            for (var i=tetriminoLen - 1; i >= 0; i--) {	//search new tetriminos from end to start
                if (newTetriminos[i].isInside(x, y)) { //new tetrimino that has been click has been found
                  // MOVE CLICKED TETRIMINO TO THE TOP OF ARRAY
                  var temp = newTetriminos[i];
                  for (var j = i; j<tetriminoLen; j++) newTetriminos[j] = newTetriminos[j + 1];
                  newTetriminos[tetriminoLen - 1] = temp;

                  // ROTATE THE TETRIMINO COUNTERCLOCKWISE
                  newTetriminos[tetriminoLen - 1].updateAngle(-rotDegrees[rotIndex]);

                  // REDRAW
                  render();

                  return;
                }
              }
              return;
        }

        // CLICK ON BASE TETRIMINO SHAPE
        if (!event.shiftKey || !event.altKey) {
            for (var i = 6; i >= 0; i--) {	// search base tetriminos from end to start
                if (baseTetriminos[i].isInside(x, y)) { //if base tetrimino has been identified
                    if (baseTetriminos[i].getType() == "squares") { //if square tetrimino
                        // CREATE AND INITIALIZE SQUARE TETRIMINO
                        newTetriminos.push(new squareTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "lines") { //if line tetrimino
                        // CREATE AND INITIALIZE LINE TETRIMINO
                        newTetriminos.push(new lineTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "rockets") { //if rocket tetrimino
                        // CREATE AND INITIALIZE ROCKET TETRIMINO
                        newTetriminos.push(new rocketTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "rightLs") { //if right l tetrimino
                        // CREATE AND INITIALIZE RIGHT L TETRIMINO
                        newTetriminos.push(new rightLTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "leftLs") { //if left l tetrimino
                        // CREATE AND INITIALIZE LEFT L TETRIMINO
                        newTetriminos.push(new leftLTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "rightZs") { //if right z tetrimino tetrimino
                        // CREATE AND INITIALIZE RIGHT Z TETRIMINO
                        newTetriminos.push(new rightZTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }
                    else if (baseTetriminos[i].getType() == "leftZs") { //if left z tetrimino
                        // CREATE AND INITIALIZE LEFT Z TETRIMINO
                        newTetriminos.push(new leftZTetrimino(baseTetriminos[i].getColor()));
                        newTetriminos[tetriminoLen].init();
                    }

                    // UPDATE VARIABLES
                    tetriminoIdToBeMoved = tetriminoLen;
                    moveCount = 0;
                    oldX = x;
                    oldY = y;

                    // REDRAW

                    render();
                    return;
                }
                else {
                    baseTetriminoClicked = false;
                }
            }

            if (!baseTetriminoClicked) {
                for (var i = tetriminoLen - 1; i >= 0; i--) { //search new tetriminos from end to start
                    if (newTetriminos[i].isInside(x, y)) { //if clicked tetrimino has been found
                        // MOVE CLICKED TETRIMINO TO THE TOP OF ARRAY
                        var temp = newTetriminos[i];
                        for (var j = i; j < tetriminoLen; j++) newTetriminos[j] = newTetriminos[j + 1];
                        newTetriminos[tetriminoLen - 1] = temp;

                        // UPDATE VARIABLES
                        tetriminoIdToBeMoved = tetriminoLen - 1;
                        moveCount = 0;
                        oldX = x;
                        oldY = y;

                        // REDRAW
                        render();
                        break;
                    }
                }
            }
        }
        
    });

    // MOUSE UP EVENT
    canvas.addEventListener("mouseup", function(event){
        if (tetriminoIdToBeMoved >= 0) { //if a tetrimino needs to be moved
            // CHECK IF NEEDS TO BE DELETED
            if (newTetriminos[tetriminoIdToBeMoved].inDelete()) { 
                newTetriminos.pop(); //delete tetrimino from array
            }

          tetriminoIdToBeMoved =- 1; //reset id
        }

        // REDRAW
        render();
    });

    // MOUSE MOVE EVENT
    canvas.addEventListener("mousemove", function(event){
        if (tetriminoIdToBeMoved>=0) {  // if tetrimino is being dragged
            // CALCULATE X AND Y VALUES FOR MOUSE 
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;
            y = canvas.height - y;

            // UPDATE VARIABLES
            newTetriminos[tetriminoIdToBeMoved].updateOffset(x - oldX, y - oldY);
            moveCount++;
            oldX = x;
            oldY = y;
            
            // REDRAW
            render();
        }
    });

    // SET UP
    pointSetup(); //set up point arrays
    setup(); //set up base tetriminos and separators
    newTetriminos = []; //holds newly created tetriminos
    tetriminoIdToBeMoved =- 1; // set id to default

    // SET UP CANVAS
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 ); //canvas background is gray

    // SET UP PROGRAM
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // GET PROJECT VARIABLE
    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    // GET TRANSFORMATION VARIABLE
    transformation = gl.getUniformLocation( program, "transformation" );

    // GET ATTRIBUTE VARIABLES
    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // DRAW SEPARATORS
    for (var i = 0;  i < separators.length; i++) {
        separators[i].draw();
    }

    // DRAW BASE TETRIMINOS
    for (var i=0; i<7; i++) {
        baseTetriminos[i].draw();
    }

    // DRAW NEW TETRIMINOS
    for (var i=0; i<newTetriminos.length; i++) {
        newTetriminos[i].draw();
    }

    return;
}


