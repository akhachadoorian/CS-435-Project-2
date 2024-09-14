//CS 435
// Project 2
// Alex Khachadoorian
// FIXME: description

"use strict"

var canvas;
var gl;

var vPosition; // loc of attribute variables
var vColor;
var projection;
var transformation;


//items to print
var seperators;
var baseBlocks;

var Blocks;
var BlockIdToBeMoved; // this black is moving
var MoveCount;
var OldX;
var OldY;

var rotIndex = 1; // default
var rotDegrees = [ 1, 5, 10, 30, 45, 90];

var windowWidth = 725;
var windowHeight = 600;

var tetriminoSize = 25;
var innerSize = 5;
var sectionSize = tetriminoSize * 4;



function buildRight(color, bottomLeft, topLeft) {
    var topRight = add(topLeft, vec2(tetriminoSize, 0));
    var bottomRight = add(bottomLeft, vec2(tetriminoSize, 0));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1], topLeft[0], topLeft[1]);

    return temp;
}

function buildTop(color, bottomLeft, bottomRight) {
    var topRight = add(bottomRight, vec2(0, tetriminoSize));
    var topLeft = add(bottomLeft, vec2(0, tetriminoSize));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1], topLeft[0], topLeft[1]);

    return temp;
}

function buildBottom(color, topLeft, topRight) {
    var bottomRight = add(topRight, vec2(0, -tetriminoSize));
    var bottomLeft = add(topLeft, vec2(0, -tetriminoSize));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], bottomRight[0], bottomRight[1], topRight[0], topRight[1],topLeft[0], topLeft[1]);

    return temp;
}

function Tetrimino (color, x0, y0, x1, y1, x2, y2, x3, y3) {
    //class variables
    this.color = color;
    this.points=[]; 
    this.points.push(vec2(x0, y0)); //bottom left
    this.points.push(vec2(x1, y1)); //bottom right
    this.points.push(vec2(x2, y2)); //top right
    this.points.push(vec2(x3, y3)); //top left
    this.colors=[];
    for (var i=0; i<4; i++) this.colors.push(color); //same color for all vertices

    //do border 
    this.points.push(vec2(x0, y0));
    this.points.push(vec2(x1, y1));
    this.points.push(vec2(x2, y2));
    this.points.push(vec2(x3, y3));
    for (var i=0; i<4; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0));

    //inside square
    this.points.push(vec2(x0 + innerSize, y0 + innerSize));
    this.points.push(vec2(x1 - innerSize, y1 + innerSize));
    this.points.push(vec2(x2 - innerSize, y2 - innerSize));
    this.points.push(vec2(x3 + innerSize, y3 - innerSize));
    var b = add(color, vec4(0.0, 0.0, 0.0, 0.3)); //FIXME: add another parameter for inside color?

    for (var i=0; i<4; i++) this.colors.push(b);


    this.vBuffer=0;
    this.cBuffer=0;

    this.OffsetX=0;
    this.OffsetY=0;
    this.Angle=0;
    this.rotationCenter;

    this.UpdateOffsetTetrimino = function(dx, dy) {
        this.OffsetX += dx;
        this.OffsetY += dy;
        // console.log("updated " + this.OffsetX + " " + this.OffsetY);
    }



    // this.SetOffset = function(dx, dy) {
    //     this.OffsetX = dx;
    //     this.OffsetY = dy;
    // }

    this.UpdateAngleTetrimino = function(deg) {
        this.Angle += deg;
        console.log("Angle: " + this.Angle);
    }

    this.transform = function(x, y) {
        var theta = -Math.PI/180*this.Angle;	// in radians
        var x2 = this.points[0][0] + (x - this.points[0][0]-this.OffsetX) * Math.cos(theta) - (y - this.points[0][1]-this.OffsetY) * Math.sin(theta);
        var y2 = this.points[0][1] + (x - this.points[0][0]-this.OffsetX) * Math.sin(theta) + (y - this.points[0][1]-this.OffsetY) * Math.cos(theta);
        return vec2(x2, y2);
    }

    this.init = function() {

        this.vBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        this.cBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    this.draw = function() {
        var tm=translate(this.points[1][0]+this.OffsetX, this.points[1][1]+this.OffsetY, 0.0);
        // console.log("tm: " + tm);
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.points[1][0], -this.points[1][1], 0.0));
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

        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
        gl.drawArrays( gl.LINE_LOOP, 4, 4);
        gl.drawArrays( gl.LINE_LOOP, 8, 4);
    }

    this.isLeft = function(x, y, id) {	// Is Point (x, y) located to the left when walking from id to id+1?
        var id1 = (id + 1) % 4;
        // console.log(this.points[id]+ " " + this.points[id1]);
        return (y-this.points[id][1])*(this.points[id1][0]-this.points[id][0])>(x-this.points[id][0])*(this.points[id1][1]-this.points[id][1]);
    }

    this.isInsideTetrimino = function(x, y) {
        var p=this.transform(x, y);
        // var p = vec2(x,y);
        for (var i=0; i<4; i++) {
            // console.log("trying for index: " + i);
            if (!this.isLeft(p[0], p[1], i)) {
                console.log("false");
                return false;
            }
        }
        return true;
    }

    this.inDeleteTetrimino = function() {
        for (var i = 0; i < 4; i++) {
            // var trueX = this.points[i][0] + this.OffsetX;
            var trueY = this.points[i][1] + this.OffsetY;
            // console.log("x: " + trueY);
            if (trueY <= tetriminoSize * 4) {
                console.log("false");
                return true;
            }
        }
        
        return false;
    }
    

    //GETTERS
    this.bottomLeft = function() {
        return this.points[0];
    }

    this.topLeft = function() {
        return this.points[3];
    }

    this.topRight = function() {
        return this.points[2];
    }

    this.bottomRight = function() {
        return this.points[1];
    } 
}

function squareTetrimino(color) {
    this.color = color;
    this.squares=[];
    
    this.init = function() {
        //create bottom left tetrimino
        this.squares.push(new Tetrimino(color, squarePoints[0][0], squarePoints[0][1], squarePoints[1][0],squarePoints[1][1], squarePoints[2][0], squarePoints[2][1],squarePoints[3][0], squarePoints[3][1]));

        this.squares[0].init();

        //create bottom right tetrimino
        this.squares.push(buildRight(this.color, this.squares[0].bottomRight(), this.squares[0].topRight()));
        this.squares[1].init();

        //create top left tetrimino
        this.squares.push(buildTop(this.color, this.squares[0].topLeft(), this.squares[0].topRight()));

        this.squares[2].init();

        //create top right tetrimino
        this.squares.push(buildTop(this.color, this.squares[1].topLeft(), this.squares[1].topRight()));
        this.squares[3].init();
    }

    this.draw = function() {
        // console.log("inside ");
        for (var i = 0; i < 4; i++ ) {
            this.squares[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("square inside");
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            // console.log(" square trying for index: " + i);
            var inside = this.squares[i].isInsideTetrimino(x, y);
            // console.log("done");

            if (inside) {
                // console.log("true");
                returnVal = true;
            }
        }
        // console.log("test");
        return returnVal;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.squares[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }

    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].UpdateOffsetTetrimino(dx, dy);
        }
    }

    this.UpdateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.squares[i].UpdateAngleTetrimino(deg);
            // this.squares[i].UpdateCenter(this.squares[0].topRight());
        }
    }

    this.getType = function() {
        return "square";
    }

    this.getColor = function() {
        return this.color;
    }
}

function lineTetrimino(color) {
    this.color = color;
    this.lines = [];

    this.init = function() {
        //first block
        this.lines.push(new Tetrimino(color, linePoints[0][0], linePoints[0][1], linePoints[1][0], linePoints[1][1], linePoints[2][0], linePoints[2][1], linePoints[3][0], linePoints[3][1]));

        this.lines[0].init();

        //second block
        this.lines.push(buildRight(this.color, this.lines[0].bottomRight(), this.lines[0].topRight()));
        this.lines[1].init();

        
        //third block
        this.lines.push(buildRight(this.color, this.lines[1].bottomRight(), this.lines[1].topRight()));
        this.lines[2].init();
        
        
        //fourth block
        this.lines.push(buildRight(this.color, this.lines[2].bottomRight(), this.lines[2].topRight()));
        this.lines[3].init();
        
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.lines[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("line inside");
        for (var i = 0; i < 4; i++) {
            var inside = this.lines[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.lines[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.lines[i].UpdateOffsetTetrimino(dx, dy);
        }
    }

    this.getType = function() {
        return "line";
    }

    this.getColor = function() {
        return this.color;
    }
}

function rocketTetrimino(color) {
    this.color = color;
    this.rockets = [];

    this.init = function() {
        //first block
        this.rockets.push(new Tetrimino(this.color, rocketPoints[0][0], rocketPoints[0][1], rocketPoints[1][0], rocketPoints[1][1], rocketPoints[2][0], rocketPoints[2][1], rocketPoints[3][0], rocketPoints[3][1]));

        this.rockets[0].init();

        //draw middle block
        this.rockets.push(buildRight(this.color, this.rockets[0].bottomRight(), this.rockets[0].topRight()));
        this.rockets[1].init();

        //draw block above that
        this.rockets.push(buildTop(this.color, this.rockets[1].topLeft(), this.rockets[1].topRight()));
        this.rockets[2].init();
        
        //build final block
        this.rockets.push(buildRight(this.color, this.rockets[1].bottomRight(), this.rockets[1].topRight()));
        this.rockets[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("rockets inside");

        for (var i = 0; i < 4; i++) {
            var inside = this.rockets[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rockets[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rockets[i].UpdateOffsetTetrimino(dx, dy);
        }
    }

    this.getType = function() {
        return "rocket";
    }

    this.getColor = function() {
        return this.color;
    }
}

function rightLTetrimino(color) {
    this.color = color;
    this.rightLs = [];

    this.init = function() {
        //first block
        this.rightLs.push(new Tetrimino(this.color, rightLPoints[0][0], rightLPoints[0][1], rightLPoints[1][0], rightLPoints[1][1], rightLPoints[2][0], rightLPoints[2][1], rightLPoints[3][0], rightLPoints[3][1]));

        this.rightLs[0].init();

        //build next piece
        this.rightLs.push(buildRight(this.color, this.rightLs[0].bottomRight(), this.rightLs[0].topRight()));
        this.rightLs[1].init();

        this.rightLs.push(buildRight(this.color, this.rightLs[1].bottomRight(), this.rightLs[1].topRight()));
        this.rightLs[2].init();

        //build on top
        this.rightLs.push(buildTop(this.color, this.rightLs[2].topLeft(), this.rightLs[2].topRight()));
        this.rightLs[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("right Ls inside");
        for (var i = 0; i < 4; i++) {
            var inside = this.rightLs[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightLs[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightLs[i].UpdateOffsetTetrimino(dx, dy);
        }
    }

    this.getType = function() {
        return "rightL";
    }

    this.getColor = function() {
        return this.color;
    }
}

function leftLTetrimino(color) {
    this.color = color;
    this.leftLs = [];

    this.init = function() {
        this.leftLs.push(new Tetrimino(this.color, leftLPoints[0][0], leftLPoints[0][1], leftLPoints[1][0], leftLPoints[1][1], leftLPoints[2][0], leftLPoints[2][1], leftLPoints[3][0], leftLPoints[3][1]));

        this.leftLs[0].init();

        //draw top
        this.leftLs.push(buildTop(this.color, this.leftLs[0].topLeft(), this.leftLs[0].topRight()));
        this.leftLs[1].init();

        this.leftLs.push(buildRight(this.color, this.leftLs[0].bottomRight(), this.leftLs[0].topRight()));
        this.leftLs[2].init();

        this.leftLs.push(buildRight(this.color, this.leftLs[2].bottomRight(), this.leftLs[2].topRight()));
        this.leftLs[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("left Ls inside");
        for (var i = 0; i < 4; i++) {
            var inside = this.leftLs[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.leftLs[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].UpdateOffsetTetrimino(dx, dy);
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

    this.init = function() {
        this.rightZs.push(new Tetrimino(this.color, rightZPoints[0][0], rightZPoints[0][1], rightZPoints[1][0], rightZPoints[1][1], rightZPoints[2][0], rightZPoints[2][1], rightZPoints[3][0], rightZPoints[3][1]));

        this.rightZs[0].init();

        this.rightZs.push(buildRight(this.color, this.rightZs[0].bottomRight(), this.rightZs[0].topRight()));
        this.rightZs[1].init();

        this.rightZs.push(buildTop(this.color, this.rightZs[1].topLeft(), this.rightZs[1].topRight()));
        this.rightZs[2].init();

        this.rightZs.push(buildRight(this.color, this.rightZs[2].bottomRight(), this.rightZs[2].topRight()));
        this.rightZs[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("right Zs inside");

        for (var i = 0; i < 4; i++) {
            var inside = this.rightZs[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.rightZs[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.rightZs[i].UpdateOffsetTetrimino(dx, dy);
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

    this.init = function() {
        this.leftZs.push(new Tetrimino(this.color, leftZPoints[0][0], leftZPoints[0][1], leftZPoints[1][0], leftZPoints[1][1], leftZPoints[2][0], leftZPoints[2][1], leftZPoints[3][0], leftZPoints[3][1]));

        this.leftZs[0].init();
        
        this.leftZs.push(buildRight(this.color, this.leftZs[0].bottomRight(), this.leftZs[0].topRight()));
        this.leftZs[1].init();

        this.leftZs.push(buildBottom(this.color, this.leftZs[1].bottomLeft(), this.leftZs[1].bottomRight()));
        this.leftZs[2].init();

        this.leftZs.push(buildRight(this.color, this.leftZs[2].bottomRight(), this.leftZs[2].topRight()));
        this.leftZs[3].init();

    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].draw();
        }
    }

    this.isInside = function(x, y) {
        // console.log("left Zs inside");

        for (var i = 0; i < 4; i++) {
            var inside = this.leftZs[i].isInsideTetrimino(x, y);

            if (inside) {
                return true;
            }
        }

        return false;
    }

    this.inDelete = function() {
        var returnVal = false;

        for (var i = 0; i < 4; i++) {
            var deleteVal = this.lef[i].inDeleteTetrimino();

            if (deleteVal) {
                // console.log("true");
                returnVal = true;
            }
        }

        return returnVal;
    }


    this.UpdateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.leftZs[i].UpdateOffsetTetrimino(dx, dy);
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
    this.points.push(vec2(tetriminoSize, height));
    this.points.push(vec2((windowWidth - tetriminoSize), height));
    this.colors = [];
    for (var i=0; i<2; i++) this.colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    
    this.vBuffer=0;
    this.cBuffer=0;

    this.OffsetX=0;
    this.OffsetY=0;
    this.Angle=0;

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

        var blocksLen = Blocks.length;
        console.log("blocksLen " + blocksLen);
        var baseBlockClicked = true;

        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        y=canvas.height-y;
        console.log("mousedown, x=" + x + ", y=" + y);
        
        if (event.shiftKey) {
            for (var i = blocksLen - 1; i >= 0; i--) {	// search from last to first
                if (Blocks[i].isInside(x, y)) {
                  // move Blocks[i] to the top
                  var temp=Blocks[i];
                  for (var j=i; j<blocksLen; j++) Blocks[j]=Blocks[j+1];
                  Blocks[blocksLen - 1]=temp;
                  // rotate the block
                  Blocks[blocksLen - 1].UpdateAngle(rotDegrees[rotIndex]);
                  // redraw
                  // window.requestAnimFrame(render);
                  render();
                  return;
                }
              }
              return;
        }
        if (event.altKey) {}

        //moving block to create duplicate
        for (var i=6; i>=0; i--) {	// search from last to first
            if (baseBlocks[i].isInside(x, y)) {
                console.log("click inside");

                if (baseBlocks[i].getType() == "square") {
                    Blocks.push(new squareTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                    // console.log("new block created")
                }
                else if (baseBlocks[i].getType() == "line") {
                    Blocks.push(new lineTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                }
                else if (baseBlocks[i].getType() == "rocket") {
                    Blocks.push(new rocketTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                }
                else if (baseBlocks[i].getType() == "rightL") {
                    Blocks.push(new rightLTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                }
                else if (baseBlocks[i].getType() == "leftL") {
                    Blocks.push(new leftLTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                }
                else if (baseBlocks[i].getType() == "rightZ") {
                    Blocks.push(new rightZTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
                }
                else if (baseBlocks[i].getType() == "leftZ") {
                    Blocks.push(new leftZTetrimino(baseBlocks[i].getColor()));
                    Blocks[blocksLen].init();
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
                if (Blocks[i].isInside(x, y)) {
                    var temp=Blocks[i];
                    for (var j=i; j<blocksLen; j++) Blocks[j]=Blocks[j+1];
                    Blocks[blocksLen - 1]=temp;
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
        
    });

    canvas.addEventListener("mouseup", function(event){
        if (BlockIdToBeMoved>=0) {
            if (Blocks[BlockIdToBeMoved].inDelete()) {
                console.log("delete");
                Blocks.pop();
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
          Blocks[BlockIdToBeMoved].UpdateOffset(x-OldX, y-OldY);
          MoveCount++;
          OldX=x;
          OldY=y;
          render();
        }
      });

    setup();
    Blocks = [];

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

    for (var i = 0;  i < seperators.length; i++) {
        // console.log("lines " + seperators[i].getStart() + " " + seperators[i].getEnd())
        seperators[i].draw();
        // console.log("drawing line");
    }

    for (var i=0; i<baseBlocks.length; i++) {
        // console.log("drawing base block");
        baseBlocks[i].draw();
    }

    for (var i=0; i<Blocks.length; i++) {
        // console.log("drawing extra block");
        Blocks[i].draw();
    }

    return;
}

//FIXME: Basic Setup
function setup() {
    baseBlocks=[];
    baseBlocks.push(new squareTetrimino(vec4(0.7, 0.7, 0.0, 0.5)));
    baseBlocks.push(new lineTetrimino(vec4(0.0, 0.0, 1.0, 0.5)));
    baseBlocks.push(new rocketTetrimino(vec4(1.0, 0.0, 0.0, 0.5)));
    baseBlocks.push(new rightLTetrimino(vec4(1.0, 0.2, 0.0, 0.5)));
    baseBlocks.push(new leftLTetrimino(vec4(0.2, 0.0, 1.0, 0.5)));
    baseBlocks.push(new  rightZTetrimino(vec4(0.0, 1.0, 0.0, 0.5)));
    baseBlocks.push(new leftZTetrimino(vec4(0.8, 0.1, 0.8, 0.5)));

    for (var i=0; i<baseBlocks.length; i++) {
        baseBlocks[i].init();
    }

    seperators  = [];
    seperators.push(new seperatorLine(windowHeight - (tetriminoSize * 4)));
    seperators.push(new seperatorLine(tetriminoSize * 4));

    for (var i = 0;  i < seperators.length; i++) {
        seperators[i].init();
    }
}




var squarePoints = [];
var linePoints = [];
var rocketPoints = [];
var rightLPoints = [];
var leftLPoints = [];
var rightZPoints = [];
var leftZPoints = [];

var curr = tetriminoSize;
var highHeight = windowHeight - (tetriminoSize * 2);
var lowHeight = windowHeight - (tetriminoSize * 3);

//fill squarePoints and update curr
fillPoints(squarePoints);
curr = curr + (tetriminoSize * 3);

//fill linePoints and update curr
fillPoints(linePoints);
curr = curr + (tetriminoSize * 5);

//fill rocketPoints and update curr
fillPoints(rocketPoints);
curr = curr + (tetriminoSize * 4);

//fill rightLPoints and update curr
fillPoints(rightLPoints);
curr = curr + (tetriminoSize * 4);

//fill leftLPoints and update curr
fillPoints(leftLPoints);
curr = curr + (tetriminoSize * 4);

//fill rightZPoints and update curr
fillPoints(rightZPoints);
curr = curr + (tetriminoSize * 4);

//fill leftZPoints and update curr
highHeight = highHeight + tetriminoSize; //update height since start is top
lowHeight = lowHeight + tetriminoSize; //update height since start is top
fillPoints(leftZPoints);
curr = curr + (leftZPoints * 4);

function fillPoints(pointArray) {
    pointArray.push(vec2(curr, lowHeight));
    pointArray.push(vec2(curr + tetriminoSize, lowHeight));
    pointArray.push(vec2(curr + tetriminoSize, highHeight));
    pointArray.push(vec2(curr, highHeight));
}
