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

var Blocks;

var tetriminoSize = 25;
var innerSize = 5;


function buildRight(color, bottomLeft, topLeft) {
    var topRight = add(topLeft, vec2(tetriminoSize, 0));
    var bottomRight = add(bottomLeft, vec2(tetriminoSize, 0));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], topLeft[0], topLeft[1], topRight[0], topRight[1], bottomRight[0], bottomRight[1]);

    return temp;
}

function buildTop(color, bottomLeft, bottomRight) {
    var topRight = add(bottomRight, vec2(0, tetriminoSize));
    var topLeft = add(bottomLeft, vec2(0, tetriminoSize));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], topLeft[0], topLeft[1], topRight[0], topRight[1], bottomRight[0], bottomRight[1]);

    return temp;
}

function buildBottom(color, topLeft, topRight) {
    var bottomRight = add(topRight, vec2(0, -tetriminoSize));
    var bottomLeft = add(topLeft, vec2(0, -tetriminoSize));

    var temp = new Tetrimino(color, bottomLeft[0], bottomLeft[1], topLeft[0], topLeft[1], topRight[0], topRight[1], bottomRight[0], bottomRight[1]);

    return temp;
}

function Tetrimino (color, x0, y0, x1, y1, x2, y2, x3, y3) {
    //class variables
    this.color = color;
    this.points=[]; 
    this.points.push(vec2(x0, y0));
    this.points.push(vec2(x1, y1));
    this.points.push(vec2(x2, y2));
    this.points.push(vec2(x3, y3));
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
    this.points.push(vec2(x1 + innerSize, y1 - innerSize));
    this.points.push(vec2(x2 - innerSize, y2 - innerSize));
    this.points.push(vec2(x3 - innerSize, y3 + innerSize));
    var b = add(color, vec4(0.0, 0.0, 0.0, 0.3)); //FIXME: add another parameter for inside color?

    for (var i=0; i<4; i++) this.colors.push(b);


    this.vBuffer=0;
    this.cBuffer=0;

    this.init = function() {

        this.vBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        this.cBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
    }

    this.draw = function() {
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

    this.bottomLeft = function() {
        return this.points[0];
    }

    this.topLeft = function() {
        return this.points[1];
    }

    this.topRight = function() {
        return this.points[2];
    }

    this.bottomRight = function() {
        return this.points[3];
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
        this.squares.push(buildRight(this.color, squarePoints[3], squarePoints[2]));
        this.squares[1].init();

        //create top left tetrimino
        this.squares.push(buildTop(this.color, squarePoints[1], squarePoints[2]));

        this.squares[2].init();

        //create top right tetrimino
        this.squares.push(buildTop(this.color, this.squares[1].topLeft(), this.squares[1].topRight()));
        this.squares[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++ ) {
            this.squares[i].draw();
        }
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
        this.lines.push(buildRight(this.color, linePoints[3], linePoints[2]));
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
}

function rocketTetrimino(color) {
    this.color = color;
    this.rockets = [];

    this.init = function() {
        //first block
        this.rockets.push(new Tetrimino(this.color, rocketPoints[0][0], rocketPoints[0][1], rocketPoints[1][0], rocketPoints[1][1], rocketPoints[2][0], rocketPoints[2][1], rocketPoints[3][0], rocketPoints[3][1]));

        this.rockets[0].init();

        //draw middle block
        this.rockets.push(buildRight(this.color, rocketPoints[3], rocketPoints[2]));
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
}

function rightLTetrimino(color) {
    this.color = color;
    this.rightLs = [];

    this.init = function() {
        //first block
        this.rightLs.push(new Tetrimino(this.color, rightLPoints[0][0], rightLPoints[0][1], rightLPoints[1][0], rightLPoints[1][1], rightLPoints[2][0], rightLPoints[2][1], rightLPoints[3][0], rightLPoints[3][1]));

        this.rightLs[0].init();

        //build next piece
        this.rightLs.push(buildRight(this.color, rightLPoints[3], rightLPoints[2]));
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
}

function leftLTetrimino(color) {
    this.color = color;
    this.leftLs = [];

    this.init = function() {
        this.leftLs.push(new Tetrimino(this.color, leftLPoints[0][0], leftLPoints[0][1], leftLPoints[1][0], leftLPoints[1][1], leftLPoints[2][0], leftLPoints[2][1], leftLPoints[3][0], leftLPoints[3][1]));

        this.leftLs[0].init();

        //draw top
        this.leftLs.push(buildTop(this.color, leftLPoints[1], leftLPoints[2]));
        this.leftLs[1].init();

        this.leftLs.push(buildRight(this.color, leftLPoints[3], leftLPoints[2]));
        this.leftLs[2].init();

        this.leftLs.push(buildRight(this.color, this.leftLs[2].bottomRight(), this.leftLs[2].topRight()));
        this.leftLs[3].init();
    }

    this.draw = function() {
        for (var i = 0; i < 4; i++) {
            this.leftLs[i].draw();
        }
    }
}

function rightZTetrimino(color) {
    this.color = color;
    this.rightZs = [];

    this.init = function() {
        this.rightZs.push(new Tetrimino(this.color, rightZPoints[0][0], rightZPoints[0][1], rightZPoints[1][0], rightZPoints[1][1], rightZPoints[2][0], rightZPoints[2][1], rightZPoints[3][0], rightZPoints[3][1]));

        this.rightZs[0].init();

        this.rightZs.push(buildRight(this.color, rightZPoints[3], rightZPoints[2]));
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
}

function leftZTetrimino(color) {
    this.color = color;
    this.leftZs = [];

    this.init = function() {
        this.leftZs.push(new Tetrimino(this.color, leftZPoints[0][0], leftZPoints[0][1], leftZPoints[1][0], leftZPoints[1][1], leftZPoints[2][0], leftZPoints[2][1], leftZPoints[3][0], leftZPoints[3][1]));

        this.leftZs[0].init();
        
        this.leftZs.push(buildRight(this.color, leftZPoints[3], leftZPoints[2]));
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
}

//main
window.onload = function initialize() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    Blocks=[];
    Blocks.push(new squareTetrimino(vec4(0.7, 0.7, 0.0, 0.5)));
    Blocks.push(new lineTetrimino(vec4(0.0, 0.0, 1.0, 0.5)));
    Blocks.push(new rocketTetrimino(vec4(1.0, 0.0, 0.0, 0.5)));
    Blocks.push(new rightLTetrimino(vec4(1.0, 0.2, 0.0, 0.5)));
    Blocks.push(new leftLTetrimino(vec4(0.2, 0.0, 1.0, 0.5)));
    Blocks.push(new rightZTetrimino(vec4(0.0, 1.0, 0.0, 0.5)));
    Blocks.push(new leftZTetrimino(vec4(0.8, 0.1, 0.8, 0.5)));

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].init();
    }

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );

    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].draw();
    }
}

//FIXME: points
var squarePoints = [];
var linePoints = [];
var rocketPoints = [];
var rightLPoints = [];
var leftLPoints = [];
var rightZPoints = [];
var leftZPoints = [];

var curr = tetriminoSize;
var highHeight = 600 - (tetriminoSize * 2);
var lowHeight = 600 - (tetriminoSize * 3);

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
    pointArray.push(vec2(curr, highHeight));
    pointArray.push(vec2(curr + tetriminoSize, highHeight));
    pointArray.push(vec2(curr + tetriminoSize, lowHeight));
}
