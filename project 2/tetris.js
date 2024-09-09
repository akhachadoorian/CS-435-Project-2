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

var tetriminoSize = 50;


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
    this.points.push(vec2(x0 + 10, y0 + 10));
    this.points.push(vec2(x1 + 10, y1 - 10));
    this.points.push(vec2(x2 - 10, y2 - 10));
    this.points.push(vec2(x3 - 10, y3 + 10));
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
        this.squares.push(new Tetrimino(color, squarePointsStart[0][0], squarePointsStart[0][1], squarePointsStart[1][0],squarePointsStart[1][1], squarePointsStart[2][0], squarePointsStart[2][1],squarePointsStart[3][0], squarePointsStart[3][1]));

        this.squares[0].init();

        //create bottom right tetrimino
        this.squares.push(buildRight(this.color, squarePointsStart[3], squarePointsStart[2]));
        this.squares[1].init();

        //create top left tetrimino
        this.squares.push(buildTop(this.color, squarePointsStart[1], squarePointsStart[2]));

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
        this.lines.push(new Tetrimino(color, linePointStart[0][0], linePointStart[0][1], linePointStart[1][0], linePointStart[1][1], linePointStart[2][0], linePointStart[2][1], linePointStart[3][0], linePointStart[3][1]));

        this.lines[0].init();

        //second block
        this.lines.push(buildRight(this.color, linePointStart[3], linePointStart[2]));
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
        this.rockets.push(new Tetrimino(this.color, rocketPointStart[0][0], rocketPointStart[0][1], rocketPointStart[1][0], rocketPointStart[1][1], rocketPointStart[2][0], rocketPointStart[2][1], rocketPointStart[3][0], rocketPointStart[3][1]));

        this.rockets[0].init();

        //draw middle block
        this.rockets.push(buildRight(this.color, rocketPointStart[3], rocketPointStart[2]));
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
        this.rightLs.push(new Tetrimino(this.color, rightLPointStart[0][0], rightLPointStart[0][1], rightLPointStart[1][0], rightLPointStart[1][1], rightLPointStart[2][0], rightLPointStart[2][1], rightLPointStart[3][0], rightLPointStart[3][1]));

        this.rightLs[0].init();

        //build next piece
        this.rightLs.push(buildRight(this.color, rightLPointStart[3], rightLPointStart[2]));
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
        this.leftLs.push(new Tetrimino(this.color, leftLPointStart[0][0], leftLPointStart[0][1], leftLPointStart[1][0], leftLPointStart[1][1], leftLPointStart[2][0], leftLPointStart[2][1], leftLPointStart[3][0], leftLPointStart[3][1]));

        this.leftLs[0].init();

        //draw top
        this.leftLs.push(buildTop(this.color, leftLPointStart[1], leftLPointStart[2]));
        this.leftLs[1].init();

        this.leftLs.push(buildRight(this.color, leftLPointStart[3], leftLPointStart[2]));
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
        this.rightZs.push(new Tetrimino(this.color, rightZPointStart[0][0], rightZPointStart[0][1], rightZPointStart[1][0], rightZPointStart[1][1], rightZPointStart[2][0], rightZPointStart[2][1], rightZPointStart[3][0], rightZPointStart[3][1]));

        this.rightZs[0].init();
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
    Blocks.push(new squareTetrimino(vec4(1.0, 1.0, 0.0, 0.3)));
    Blocks.push(new lineTetrimino(vec4(0.0, 0.0, 1.0, 0.5)));
    Blocks.push(new rocketTetrimino(vec4(1.0, 0.0, 0.0, 0.5)));
    Blocks.push(new rightLTetrimino(vec4(1.0, 0.2, 0.0, 0.5)));
    Blocks.push(new leftLTetrimino(vec4(0.2, 0.0, 1.0, 0.5)));
    Blocks.push(new rightZTetrimino(vec4(0.0, 1.0, 0.0, 0.3)));
    // Blocks.push(new leftzTetrimino(vec4(0.5, 0.0, 0.0, 0.5)));

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

//FIXME:
var squarePointsStart = [
    vec2(50, 50),
    vec2(50, 100),
    vec2( 100, 100),
    vec2( 100, 50)
];

var linePointStart = [
    vec2( 200, 50),
    vec2( 200, 100),
    vec2( 250, 100),
    vec2( 250, 50)
];

var rocketPointStart = [
    vec2( 450, 50),
    vec2( 450, 100),
    vec2( 500, 100),
    vec2( 500, 50)
];

var rightLPointStart = [
    vec2( 650, 50),
    vec2( 650, 100),
    vec2( 700, 100),
    vec2( 700, 50)
]

var leftLPointStart = [
    vec2( 850, 50),
    vec2( 850, 100),
    vec2( 900, 100),
    vec2( 900, 50)
]

var rightZPointStart = [
    vec2( 1050, 50),
    vec2( 1050, 100),
    vec2( 1100, 100),
    vec2( 1100, 50)
]