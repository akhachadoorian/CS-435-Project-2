//CS 435
// Project 2
// Alex Khachadoorian
// FIXME: description

"use strict"

//global variables
var canvas;
var gl;

var vPosition; //holds all the vertex positions
var vColor; //holds all the vertex colors

var windowWidth = 725; //holds the width of the canvas
var windowHeight = 600; //holds the height of the canvas

var minoSize = 25; //width/height of mino
var innerSize = 5; //how much smaller the inner outline of mino is 

//uniform variables
var projection; //holds the projection uniform variable
var transformation; //holds the transformation uniform variable

//items to print
var separators; //holds the separator lines
var tetrisBlocks; //holds the base tetris blocks
var newTetrisBlocks; //holds the tetris blocks are adding by mouse events

//variables related to moving blocks
var BlockIdToBeMoved; //index of block to be moved
var MoveCount; //number of blocks to be moved
var OldX; //old x value
var OldY; //old y value
var rotIndex = 5; // rotation index (default is 1)
var rotDegrees = [ 1, 5, 10, 30, 45, 90]; //holds the amount of degrees for a rotation

//build a mino to the right of current one
function buildRight(color, getBottomLeft, getTopLeft) { //takes the mino's color (vec4), point that will be bottom left, point that will be the top left
    //calculate remaining points
    var getTopRight = add(getTopLeft, vec2(minoSize, 0)); //make top right the top left's x plus size of mino
    var getBottomRight = add(getBottomLeft, vec2(minoSize, 0)); //make bottom right the bottom left's x plus the size of mino

    //create mino
    var mino = new Mino(color, getBottomLeft[0], getBottomLeft[1], getBottomRight[0], getBottomRight[1], getTopRight[0], getTopRight[1], getTopLeft[0], getTopLeft[1]); 

    return mino;
}

//build a mino above the current one
function buildTop(color, getBottomLeft, getBottomRight) { //takes the mino's color (vec4), the point that will become the bottom left, point that will be the bottom right
    //calculate remaining points
    var getTopRight = add(getBottomRight, vec2(0, minoSize)); //top right will be the bottom right's y plus size of mino
    var getTopLeft = add(getBottomLeft, vec2(0, minoSize)); //top left will be the bottom left's y plus size of mino

    //create mino
    var mino = new Mino(color, getBottomLeft[0], getBottomLeft[1], getBottomRight[0], getBottomRight[1], getTopRight[0], getTopRight[1], getTopLeft[0], getTopLeft[1]);

    return mino;
}

//build a mino below the current one
function buildBottom(color, getTopLeft, getTopRight) { //takes the mino's color (vec4), point that will be top left, point that will be top right
    //calculate remaining points
    var getBottomRight = add(getTopRight, vec2(0, -minoSize)); //bottom right will be the top right's y minus size of mino
    var getBottomLeft = add(getTopLeft, vec2(0, -minoSize)); //bottom left will be the top left's y minus size of mino

    //create mino
    var mino = new Mino(color, getBottomLeft[0], getBottomLeft[1], getBottomRight[0], getBottomRight[1], getTopRight[0], getTopRight[1],getTopLeft[0], getTopLeft[1]);

    return mino;
}

//Mino class
function Mino(color, x0, y0, x1, y1, x2, y2, x3, y3) { //takes a color (vec4) and 4 points
    //////////////////////////
    /*   CLASS VARIABLES    */
    //////////////////////////

    this.color = color; //holds mino color
    this.points=[]; //holds all the mino's points
    this.points.push(vec2(x0, y0)); //bottom left
    this.points.push(vec2(x1, y1)); //bottom right
    this.points.push(vec2(x2, y2)); //top right
    this.points.push(vec2(x3, y3)); //top left
    this.colors=[]; //holds the points corresponding colors
    for (var i=0; i<4; i++) this.colors.push(color); //same color for all vertices

    //black border points
    this.points.push(vec2(x0, y0)); //bottom left
    this.points.push(vec2(x1, y1)); //bottom right
    this.points.push(vec2(x2, y2)); //top right
    this.points.push(vec2(x3, y3)); //top left
    for (var i=0; i<4; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0)); //set all vertices to black

    //inside square
    this.points.push(vec2(x0 + innerSize, y0 + innerSize)); //bottom left
    this.points.push(vec2(x1 - innerSize, y1 + innerSize)); //bottom right
    this.points.push(vec2(x2 - innerSize, y2 - innerSize)); //top right
    this.points.push(vec2(x3 + innerSize, y3 - innerSize)); //top left
    var b = add(color, vec4(0.0, 0.0, 0.0, 0.3)); //get color that is slightly color than base mino 
    for (var i=0; i<4; i++) this.colors.push(b); //set all vertices to a slightly darker color than the base color

    //set buffers to default
    this.vBuffer=0; //vertex buffer
    this.cBuffer=0; //color buffer

    //set translation and rotation variables to default
    this.OffsetX=0;
    this.OffsetY=0;
    this.Angle=0;
    this.rotationCenter = this.points[0]; //set rotation point to the bottom left point as default

    //////////////////////////
    /*  SETTERS & GETTERS   */
    //////////////////////////

    //update mino's offsets to match new translation
    this.updateOffsetMino = function(dx, dy) {
        this.OffsetX += dx; //increase x offset by parameter 
        this.OffsetY += dy; //increase y offset by parameter
    }

    //update mino's rotation center to a new point
    this.updateRotationCenter = function(center) { //takes a point (vec2) as input  
        this.rotationCenter = center;
    }

    //update mino's angle to match new rotation
    this.updateAngleMino = function(deg) {
        this.Angle += deg;
    }

    //get bottom left point
    this.getBottomLeft = function() {
        return this.points[0];
    }

    //get top left point
    this.getTopLeft = function() {
        return this.points[3];
    }

    //get top right point
    this.getTopRight = function() {
        return this.points[2];
    }

    //get bottom right point
    this.getBottomRight = function() {
        return this.points[1];
    } 

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    //initialization function
    this.init = function() {
        //setup vertex buffer
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        //setup color buffer  
        this.cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    //drawing function  
    this.draw = function() {
        //get transformation matrix
        var tm=translate(this.rotationCenter[0]+this.OffsetX, this.rotationCenter[1]+this.OffsetY, 0.0); 
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.rotationCenter[0], -this.rotationCenter[1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        //use vertex buffer to fill global position buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        //use color buffer to fil global color buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        //draw mino
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4); //draw base mino
        gl.drawArrays( gl.LINE_LOOP, 4, 4); //draw black mino outline
        gl.drawArrays( gl.LINE_LOOP, 8, 4); //draw inside mino outline
    }

    //transform a point to correspond with the mino's transformation
    this.transform = function(x, y) {
        //convert angle to radians
        if (this.Angle != 0) { //if Angle is anything other than 0
            var theta = Math.PI/180*this.Angle; //use positive theta
        }
        else {
            var theta = -Math.PI/180*this.Angle;  //use negative theta
        }

        //calculate new x and y values
        var x2 = this.rotationCenter[0] + (x - this.rotationCenter[0]-this.OffsetX) * Math.cos(theta) - (y - this.rotationCenter[1]-this.OffsetY) * Math.sin(theta);
        var y2 = this.rotationCenter[1] + (x - this.rotationCenter[0]-this.OffsetX) * Math.sin(theta) + (y - this.rotationCenter[1]-this.OffsetY) * Math.cos(theta);

        return vec2(x2, y2);
    }

    //determine if point is left of 
    this.isLeft = function(x, y, StartID) {
        //determine ending point id
        var endID = (StartID + 1) % 4;

        //calculate dot product
        var c = (y-this.points[StartID][1])*(this.points[endID][0]-this.points[StartID][0]);
        var d = (x-this.points[StartID][0])*(this.points[endID][1]-this.points[StartID][1]);
        return c >= d;
    }

    //determine if parameter point is inside of mino  
    this.isInsideMino = function(x, y) {
        var p=this.transform(x, y); //transform entered points to match transformed mino

        //check if point is inside the mino
        for (var i=0; i<4; i++) {
            if (!this.isLeft(p[0], p[1], i)) { //if any return false, point is not inside mino
                return false;
            }
        }

        return true; //otherwise point is inside mino
    }

    //determine if mino needs to be deleted
    this.inDeleteMino = function() {
        for (var i = 0; i < 4; i++) {
            //calculate transformed y
            var trueY = this.points[i][1] + this.OffsetY;

            //check if y is delete section of canvas
            if (trueY <= minoSize * 4) { //if in delete section, delete
                return true; 
            }
        }
        
        return false; //otherwise don't delete
    }
}

//square tetrimino class
function squareTetrimino(color) {
    //////////////////////////
    /*   CLASS VARIABLES    */
    //////////////////////////

    this.color = color; //store tetrimino's color
    this.squares=[]; //holds tetrimino's minos
    
    //////////////////////////
    /*  SETTERS & GETTERS   */
    //////////////////////////
    
    //update the offset values for all the tetrimino's minos
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateOffsetMino(dx, dy);
        }
    }

    //update the angle values for all the tetrimino's minos
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateAngleMino(deg);
        }
    }

    //get the tetrimino shape
    this.getType = function() {
        return "square";
    }

    //get tetrimino's color
    this.getColor = function() {
        return this.color;
    }

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    //initialization function
    this.init = function() {
        //create and initialize bottom left mino
        this.squares.push(new mino(color, squarePoints[0][0], squarePoints[0][1], squarePoints[1][0], squarePoints[1][1], squarePoints[2][0], squarePoints[2][1],squarePoints[3][0], squarePoints[3][1]));
        this.squares[0].init();
        

        //create and initialize bottom right mino
        this.squares.push(buildRight(this.color, this.squares[0].getBottomRight(), this.squares[0].getTopRight()));
        this.squares[1].init();

        //create and initialize top left mino
        this.squares.push(buildTop(this.color, this.squares[0].getTopLeft(), this.squares[0].getTopRight()));
        this.squares[2].init();

        //create and initialize top right mino
        this.squares.push(buildTop(this.color, this.squares[1].getTopLeft(), this.squares[1].getTopRight()));
        this.squares[3].init();

        //update the centers for all the minos
        for (var i = 0; i < 4; i++) {
            this.squares[i].updateRotationCenter(this.squares[0].getTopRight()); //set center to the center of the tetrimino
        }
    }

    //drawing function
    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.squares[i].draw(); //call the mino draw function for each mino 
        }
        
    }

    //determine if parameter point is inside of tetrimino
    this.isInside = function(x, y) {
        //call is inside function for each mino
        for (var i = 0; i < 4; i++) {
            var inside = this.squares[i].isInsideMino(x, y);

            if (inside) { //if point is inside that mino, its inside tetrimino
                return true;
            }
        }

        return false; //otherwise point is not inside the tetrimino
    }

    //determine if tetrimino needs to be deleted
    this.inDelete = function() {
        //check if any of the minos are in the delete section by calling function for each mino
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.squares[i].inDeleteMino();

            if (deleteVal) { //if mino in delete section, tetrimino needs to be deleted
                return true;
            }
        }

        return false; //otherwise tetrimino does not need to be deleted
    }

    
}

//line tetrimino class
function lineTetrimino(color) {
    //////////////////////////
    /*   CLASS VARIABLES    */
    //////////////////////////

    this.color = color; //holds shape's color
    this.lines = []; //hold's tetrimino's minos

    //////////////////////////
    /*  SETTERS & GETTERS   */
    //////////////////////////

    //update the offset values for all the tetrimino's minos
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.lines[i].updateOffsetMino(dx, dy);
        }
    }

    //update the angle values for all the tetrimino's minos
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.lines[i].updateAngleMino(deg);
        }
    }

    //get the tetrimino shape
    this.getType = function() {
        return "line";
    }

    //get tetrimino's color
    this.getColor = function() {
        return this.color;
    }

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    this.init = function() {
        //create and initialize first mino in the line
        this.lines.push(new mino(color, linePoints[0][0], linePoints[0][1], linePoints[1][0], linePoints[1][1], linePoints[2][0], linePoints[2][1], linePoints[3][0], linePoints[3][1]));
        this.lines[0].init();

        //create and initialize second mino in the line
        this.lines.push(buildRight(this.color, this.lines[0].getBottomRight(), this.lines[0].getTopRight()));
        this.lines[1].init();

        //create and initialize third mino in the line
        this.lines.push(buildRight(this.color, this.lines[1].getBottomRight(), this.lines[1].getTopRight()));
        this.lines[2].init();
        
        //create and initialize fourth mino in the line
        this.lines.push(buildRight(this.color, this.lines[2].getBottomRight(), this.lines[2].getTopRight()));
        this.lines[3].init();
        
        //calculate the center
        var temp = this.lines[1].getBottomRight(); //get second mino's bottom right point
        var tempY = temp[1] + (minoSize / 2); //increase the y value to be half of mino's size
        temp = vec2(temp[0], tempY); //update point

        //update the centers for all the minos
        for (var i = 0; i < 4; i++) {
            this.lines[i].updateRotationCenter(temp); //set center to be center of line 
        }
    }

    //drawing function
    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.lines[i].draw(); //call the mino draw function for each mino 
        }
    }

    //determine if parameter point is inside of tetrimino
    this.isInside = function(x, y) {
        //call is inside function for each mino
        for (var i = 0; i < 4; i++) {
            var inside = this.lines[i].isInsideMino(x, y); 

            if (inside) { //if point is inside that mino, its inside tetrimino
                return true; 
            }
        }

        return false; //otherwise point is not inside the tetrimino
    }

    //determine if tetrimino needs to be deleted
    this.inDelete = function() {
         //check if any of the minos are in the delete section by calling function for each mino
         for (var i = 0; i < 4; i++) {
            var deleteVal = this.lines[i].inDeleteMino();

            if (deleteVal) { //if mino in delete section, tetrimino needs to be deleted
                return true;
            }
        }

        return false; //otherwise tetrimino does not need to be deleted
    }
}

//rocket tetrimino class
function rocketTetrimino(color) {
    //////////////////////////
    /*   CLASS VARIABLES    */
    //////////////////////////
    this.color = color; //store tetrimino's color
    this.rockets = []; //holds tetrimino's minos

    //////////////////////////
    /*  SETTERS & GETTERS   */
    //////////////////////////

    //update the offset values for all the tetrimino's minos
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateOffsetMino(dx, dy);
        }
    }

    //update the angle values for all the tetrimino's minos
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateAngleMino(deg);
        }
    }

    //get the tetrimino shape
    this.getType = function() {
        return "rocket";
    }

    //get tetrimino's color
    this.getColor = function() {
        return this.color;
    }

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    //initialization function
    this.init = function() {
        //create and initialize first mino
        this.rockets.push(new mino(this.color, rocketPoints[0][0], rocketPoints[0][1], rocketPoints[1][0], rocketPoints[1][1], rocketPoints[2][0], rocketPoints[2][1], rocketPoints[3][0], rocketPoints[3][1]));
        this.rockets[0].init();

        //create and initialize mino on the right
        this.rockets.push(buildRight(this.color, this.rockets[0].getBottomRight(), this.rockets[0].getTopRight()));
        this.rockets[1].init();

        //create and initialize mino above 
        this.rockets.push(buildTop(this.color, this.rockets[1].getTopLeft(), this.rockets[1].getTopRight()));
        this.rockets[2].init();
        
        //create and initialize final right mino
        this.rockets.push(buildRight(this.color, this.rockets[1].getBottomRight(), this.rockets[1].getTopRight()));
        this.rockets[3].init();

        //calculate center
        var temp = this.rockets[1].getBottomLeft(); //get second mino's bottom left point
        var tempX = temp[0] + (minoSize / 2); //increase its x by half a mino size
        temp = vec2(tempX, temp[1]); //create new point

        //update the centers for all the minos
        for (var i = 0; i < 4; i++) {
            this.rockets[i].updateRotationCenter(temp); //set center to the center of the tetrimino
        }
    }

    //drawing function
    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].draw(); //call the mino draw function for each mino
        }
    }

    //determine if parameter point is inside of tetrimino
    this.isInside = function(x, y) {
        //call is inside function for each mino
        for (var i = 0; i < 4; i++) {
            var inside = this.rockets[i].isInsideMino(x, y);

            if (inside) { //if point is inside that mino, its inside tetrimino
                return true;
            }
        }

        return false; //otherwise point is not inside the tetrimino
    }

    //determine if tetrimino needs to be deleted
    this.inDelete = function() {
        //check if any of the minos are in the delete section by calling function for each mino
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rockets[i].inDeleteMino();

            if (deleteVal) { //if mino in delete section, tetrimino needs to be deleted
                return true;
            }
        }

        return false; //otherwise tetrimino does not need to be deleted
    }
}

//right L tetrimino class
function rightLTetrimino(color) {
    //////////////////////////
    /*   CLASS VARIABLES    */
    //////////////////////////
    this.color = color; //store tetrimino's color
    this.rightLs = []; //holds tetrimino's minos

    //////////////////////////
    /*  SETTERS & GETTERS   */
    //////////////////////////

    //update the offset values for all the tetrimino's minos
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateOffsetMino(dx, dy);
        }
    }

    //update the angle values for all the tetrimino's minos
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateAngleMino(deg);
        }
    }

    //get the tetrimino shape
    this.getType = function() {
        return "rightL";
    }

    //get tetrimino's color
    this.getColor = function() {
        return this.color;
    }

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    //initialization function
    this.init = function() {
        //create and initialize first mino
        this.rightLs.push(new mino(this.color, rightLPoints[0][0], rightLPoints[0][1], rightLPoints[1][0], rightLPoints[1][1], rightLPoints[2][0], rightLPoints[2][1], rightLPoints[3][0], rightLPoints[3][1]));
        this.rightLs[0].init();

        //create and initialize mino to the right
        this.rightLs.push(buildRight(this.color, this.rightLs[0].getBottomRight(), this.rightLs[0].getTopRight()));
        this.rightLs[1].init();

        //create and initialize another mino to the right
        this.rightLs.push(buildRight(this.color, this.rightLs[1].getBottomRight(), this.rightLs[1].getTopRight()));
        this.rightLs[2].init();

        //create and initialize mino on top
        this.rightLs.push(buildTop(this.color, this.rightLs[2].getTopLeft(), this.rightLs[2].getTopRight()));
        this.rightLs[3].init();

        //update the centers for all the minos
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].updateRotationCenter(this.rightLs[1].getTopRight()); //set center to the center of the tetrimino
        }
    }

    //drawing function
    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].draw(); //call the mino draw function for each mino
        }
    }

    //determine if parameter point is inside of tetrimino
    this.isInside = function(x, y) {
        //call is inside function for each mino
        for (var i = 0; i < 4; i++) {
            var inside = this.rightLs[i].isInsideMino(x, y);

            if (inside) { //if point is inside that mino, its inside tetrimino
                return true;
            }
        }

        return false; //otherwise point is not inside the tetrimino
    }

    //determine if tetrimino needs to be deleted
    this.inDelete = function() {
        //check if any of the minos are in the delete section by calling function for each mino
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightLs[i].inDeleteMino();

            if (deleteVal) { //if mino in delete section, tetrimino needs to be deleted
                return true;
            }
        }

        return false; //otherwise tetrimino does not need to be deleted
    }
}


function leftLTetrimino(color) {
    this.color = color;
    this.leftLs = [];

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    this.init = function() {
        this.leftLs.push(new mino(this.color, leftLPoints[0][0], leftLPoints[0][1], leftLPoints[1][0], leftLPoints[1][1], leftLPoints[2][0], leftLPoints[2][1], leftLPoints[3][0], leftLPoints[3][1]));

        this.leftLs[0].init();

        //draw top
        this.leftLs.push(buildTop(this.color, this.leftLs[0].getTopLeft(), this.leftLs[0].getTopRight()));
        this.leftLs[1].init();

        this.leftLs.push(buildRight(this.color, this.leftLs[0].getBottomRight(), this.leftLs[0].getTopRight()));
        this.leftLs[2].init();

        this.leftLs.push(buildRight(this.color, this.leftLs[2].getBottomRight(), this.leftLs[2].getTopRight()));
        this.leftLs[3].init();

        //center
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateRotationCenter(this.leftLs[0].getTopRight());
        }
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("left Ls inside");
        for (var i = 0; i < 4; i++) {
            var inside = this.leftLs[i].isInsideMino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.leftLs[i].inDeleteMino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateOffsetMino(dx, dy);
        }
    }

    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].updateAngleMino(deg);
        }
    }

    this.getType = function() {
        return "leftL";
    }

    this.getColor = function() {
        return this.color;
    }
}

function rightZTetrimino(color) {
    this.color = color;
    this.rightZs = [];

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    this.init = function() {
        this.rightZs.push(new mino(this.color, rightZPoints[0][0], rightZPoints[0][1], rightZPoints[1][0], rightZPoints[1][1], rightZPoints[2][0], rightZPoints[2][1], rightZPoints[3][0], rightZPoints[3][1]));

        this.rightZs[0].init();

        this.rightZs.push(buildRight(this.color, this.rightZs[0].getBottomRight(), this.rightZs[0].getTopRight()));
        this.rightZs[1].init();

        this.rightZs.push(buildTop(this.color, this.rightZs[1].getTopLeft(), this.rightZs[1].getTopRight()));
        this.rightZs[2].init();

        this.rightZs.push(buildRight(this.color, this.rightZs[2].getBottomRight(), this.rightZs[2].getTopRight()));
        this.rightZs[3].init();

        //center
        var temp = this.rightZs[1].getTopLeft();
        var tempX = temp[0] + (minoSize / 2);
        temp = vec2(tempX, temp[1]);

        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateRotationCenter(temp);
        }
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("right Zs inside");

        for (var i = 0; i < 4; i++) {
            var inside = this.rightZs[i].isInsideMino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightZs[i].inDeleteMino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateOffsetMino(dx, dy);
        }
    }

    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].updateAngleMino(deg);
        }
    }

    this.getType = function() {
        return "rightZ";
    }

    this.getColor = function() {
        return this.color;
    }
}

function leftZTetrimino(color) {
    this.color = color;
    this.leftZs = [];

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    this.init = function() {
        this.leftZs.push(new mino(this.color, leftZPoints[0][0], leftZPoints[0][1], leftZPoints[1][0], leftZPoints[1][1], leftZPoints[2][0], leftZPoints[2][1], leftZPoints[3][0], leftZPoints[3][1]));

        this.leftZs[0].init();
        
        this.leftZs.push(buildRight(this.color, this.leftZs[0].getBottomRight(), this.leftZs[0].getTopRight()));
        this.leftZs[1].init();

        this.leftZs.push(buildBottom(this.color, this.leftZs[1].getBottomLeft(), this.leftZs[1].getBottomRight()));
        this.leftZs[2].init();

        this.leftZs.push(buildRight(this.color, this.leftZs[2].getBottomRight(), this.leftZs[2].getTopRight()));
        this.leftZs[3].init();

        //center
        var temp = this.leftZs[1].getBottomLeft();
        var tempX = temp[0] + (minoSize / 2);
        temp = vec2(tempX, temp[1]);

        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateRotationCenter(temp);
        }

    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("left Zs inside");

        for (var i = 0; i < 4; i++) {
            var inside = this.leftZs[i].isInsideMino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.leftZs[i].inDeleteMino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateOffsetMino(dx, dy);
        }
    }

    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].updateAngleMino(deg);
        }
    }

    this.getType = function() {
        return "leftZ";
    }

    this.getColor = function() {
        return this.color;
    }
}

function seperatorLine(height) {
    this.points = [];
    this.points.push(vec2(minoSize, height));
    this.points.push(vec2((windowWidth - minoSize), height));
    this.points.push(vec2(300,300))
    this.colors = [];
    for (var i=0; i<3; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    
    this.vBuffer=0;
    this.cBuffer=0;

    this.OffsetX=0;
    this.OffsetY=0;
    this.Angle=0;

    //////////////////////////
    /*       FUNCTIONS     */
    //////////////////////////

    this.init = function() {

        this.vBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        this.cBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    this.draw = function() {
        var tm=translate(this.points[0][0]+this.OffsetX, this.points[0][1]+this.OffsetY, 0.0);
        // console.log("tm: " + tm);
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
        // console.log("tm2: " + tm);
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        //supply data for vPosition
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        //supply data for vColor
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.drawArrays( gl.LINES, 0, 2);
        gl.drawArrays(gl.POINTS, 2,1);
    }

    this.getStart = function() {
        return this.points[0];
    }

    this.getEnd = function() {
        return this.points[1];
    }
}

//main
window.onload = function initialize() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //set width and height
    console.log(canvas.height);
    // windowHeight = canvas.height;
    // windowWidth = canvas.width;

    //events
    canvas.addEventListener("mousedown", function(event) {
        if (event.button!=0) return; // left button only

        //figure which menu item selected
        var m = document.getElementById("mymenu");
        m.selectedIndex=rotIndex;
        m.addEventListener("click", function() {
        rotIndex = m.selectedIndex;
        });

        //reset button
        var a = document.getElementById("mybutton")
        a.addEventListener("click", function(){
        for (var i=0; i<7; i++) {
            newTetrisBlocks[i].SetAngle(0);
            newTetrisBlocks[i].SetOffset(0, 0);
            // window.requestAnimFrame(render);
            render();
        }
        });
        var blocksLen = newTetrisBlocks.length;
        // console.log("blocksLen " + blocksLen);
        var baseBlockClicked = true;

        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        y=canvas.height-y;
        console.log("mousedown, x=" + x + ", y=" + y);
        
        if (event.shiftKey) {
            for (var i = blocksLen - 1; i >= 0; i--) {	// search from last to first
                if (newTetrisBlocks[i].isInside(x, y)) {
                  // move newTetrisBlocks[i] to the top
                  var temp=newTetrisBlocks[i];
                  for (var j=i; j<blocksLen; j++) newTetrisBlocks[j]=newTetrisBlocks[j+1];
                  newTetrisBlocks[blocksLen - 1]=temp;
                  // rotate the block
                  newTetrisBlocks[blocksLen - 1].updateAngle(rotDegrees[rotIndex]);
                  // redraw
                  // window.requestAnimFrame(render);
                  render();
                  return;
                }
              }
              return;
        }
        if (event.altKey) {
            for (var i=blocksLen - 1; i>=0; i--) {	// search from last to first
                if (newTetrisBlocks[i].isInside(x, y)) {
                  // move newTetrisBlocks[i] to the top
                  var temp=newTetrisBlocks[i];
                  for (var j=i; j<blocksLen; j++) newTetrisBlocks[j]=newTetrisBlocks[j+1];
                  newTetrisBlocks[blocksLen - 1]=temp;
                  // rotate the block
                  newTetrisBlocks[blocksLen - 1].updateAngle(-rotDegrees[rotIndex]);
                  // redraw
                  // window.requestAnimFrame(render);
                  render();
                  return;
                }
              }
              return;
        }

        //moving block to create duplicate
        if (!event.shiftKey || !event.altKey) {
            for (var i=6; i>=0; i--) {	// search from last to first
                if (tetrisBlocks[i].isInside(x, y)) {
                    // console.log("click inside");

                    if (tetrisBlocks[i].getType() == "square") {
                        newTetrisBlocks.push(new squareTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                        // console.log("new block created")
                    }
                    else if (tetrisBlocks[i].getType() == "line") {
                        newTetrisBlocks.push(new lineTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }
                    else if (tetrisBlocks[i].getType() == "rocket") {
                        newTetrisBlocks.push(new rocketTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }
                    else if (tetrisBlocks[i].getType() == "rightL") {
                        newTetrisBlocks.push(new rightLTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }
                    else if (tetrisBlocks[i].getType() == "leftL") {
                        newTetrisBlocks.push(new leftLTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }
                    else if (tetrisBlocks[i].getType() == "rightZ") {
                        newTetrisBlocks.push(new rightZTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }
                    else if (tetrisBlocks[i].getType() == "leftZ") {
                        newTetrisBlocks.push(new leftZTetrimino(tetrisBlocks[i].getColor()));
                        newTetrisBlocks[blocksLen].init();
                    }

                    BlockIdToBeMoved = blocksLen;
                    MoveCount = 0;
                    OldX = x;
                    OldY = y;

                    // redraw
                    render();
                    return;
                }
                else {
                    baseBlockClicked = false;
                }
            }

            if (!baseBlockClicked) {
                console.log("other block clicked");
                for (var i = blocksLen - 1; i >= 0; i--) {
                    console.log("block " + i);
                    if (newTetrisBlocks[i].isInside(x, y)) {
                        var temp=newTetrisBlocks[i];
                        for (var j=i; j<blocksLen; j++) newTetrisBlocks[j]=newTetrisBlocks[j+1];
                        newTetrisBlocks[blocksLen - 1]=temp;
                        // remember the one to be moved
                        BlockIdToBeMoved=blocksLen - 1;
                        MoveCount=0;
                        OldX=x;
                        OldY=y;
                        // redraw
                        // window.requestAnimFrame(render);
                        render();
                        break;
                    }
                }
            }
        }
        
    });

    canvas.addEventListener("mouseup", function(event){
        if (BlockIdToBeMoved>=0) {
            if (newTetrisBlocks[BlockIdToBeMoved].inDelete()) {
                console.log("delete");
                newTetrisBlocks.pop();
            }

            console.log("up");
          BlockIdToBeMoved=-1;
        }
        render();
    });

    canvas.addEventListener("mousemove", function(event){
        if (BlockIdToBeMoved>=0) {  // if dragging
          var x = event.pageX - canvas.offsetLeft;
          var y = event.pageY - canvas.offsetTop;
          y=canvas.height-y;
          newTetrisBlocks[BlockIdToBeMoved].updateOffset(x-OldX, y-OldY);
          MoveCount++;
          OldX=x;
          OldY=y;
          render();
        }
      });

    setup();
    newTetrisBlocks = [];

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    BlockIdToBeMoved=-1; // no piece selected
    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    transformation = gl.getUniformLocation( program, "transformation" );

    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0;  i < separators.length; i++) {
        // console.log("lines " + separators[i].getStart() + " " + separators[i].getEnd())
        separators[i].draw();
        // console.log("drawing line");
    }

    for (var i=0; i<7; i++) {
        // console.log("drawing base block");
        tetrisBlocks[i].draw();
    }

    for (var i=0; i<newTetrisBlocks.length; i++) {
        // console.log("drawing extra block");
        newTetrisBlocks[i].draw();
    }

    console.log(" ");
    
    return;
}

//FIXME: Basic Setup
function setup() {
    tetrisBlocks=[];
    tetrisBlocks.push(new squareTetrimino(vec4(0.7, 0.7, 0.0, 0.5)));
    tetrisBlocks.push(new lineTetrimino(vec4(0.0, 0.0, 1.0, 0.5)));
    tetrisBlocks.push(new rocketTetrimino(vec4(1.0, 0.0, 0.0, 0.5)));
    tetrisBlocks.push(new rightLTetrimino(vec4(1.0, 0.2, 0.0, 0.5)));
    tetrisBlocks.push(new leftLTetrimino(vec4(0.2, 0.0, 1.0, 0.5)));
    tetrisBlocks.push(new rightZTetrimino(vec4(0.0, 1.0, 0.0, 0.5)));
    tetrisBlocks.push(new leftZTetrimino(vec4(0.8, 0.1, 0.8, 0.5)));

    for (var i=0; i<tetrisBlocks.length; i++) {
        tetrisBlocks[i].init();
    }

    separators  = [];
    separators.push(new seperatorLine(windowHeight - (minoSize * 4)));
    separators.push(new seperatorLine(minoSize * 4));
    // separators.push(new seperatorLine(300));

    for (var i = 0;  i < separators.length; i++) {
        separators[i].init();
    }
}



//
var squarePoints = [];
var linePoints = [];
var rocketPoints = [];
var rightLPoints = [];
var leftLPoints = [];
var rightZPoints = [];
var leftZPoints = [];

var curr = minoSize;
var highHeight = windowHeight - (minoSize * 2);
var lowHeight = windowHeight - (minoSize * 3);

//fill squarePoints and update curr
fillPoints(squarePoints);
curr = curr + (minoSize * 3);

//fill linePoints and update curr
fillPoints(linePoints);
curr = curr + (minoSize * 5);

//fill rocketPoints and update curr
fillPoints(rocketPoints);
curr = curr + (minoSize * 4);

//fill rightLPoints and update curr
fillPoints(rightLPoints);
curr = curr + (minoSize * 4);

//fill leftLPoints and update curr
fillPoints(leftLPoints);
curr = curr + (minoSize * 4);

//fill rightZPoints and update curr
fillPoints(rightZPoints);
curr = curr + (minoSize * 4);

//fill leftZPoints and update curr
highHeight = highHeight + minoSize; //update height since start is top
lowHeight = lowHeight + minoSize; //update height since start is top
fillPoints(leftZPoints);
curr = curr + (leftZPoints * 4);

function fillPoints(pointArray) {
    pointArray.push(vec2(curr, lowHeight));
    pointArray.push(vec2(curr + minoSize, lowHeight));
    pointArray.push(vec2(curr + minoSize, highHeight));
    pointArray.push(vec2(curr, highHeight));
}
