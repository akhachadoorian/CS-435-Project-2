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


function Tetrimino (color, x0, y0, x1, y1, x2, y2, x3, y3) {
    this.color = color;
    this.points=[]; 
    this.points.push(vec2(x0, y0));
    this.points.push(vec2(x1, y1));
    this.points.push(vec2(x2, y2));
    this.points.push(vec2(x3, y3));
    this.colors=[];
    for (var i=0; i<4; i++) this.colors.push(color); //same color for all vertices

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

    //     //find transformation matrix
    //   var tm=translate(this.points[0][0]+this.OffsetX, this.points[0][1]+this.OffsetY, 0.0); 
    //   tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
    //   tm=mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
    //   gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        //supply data for vPosition
      gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
      gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      //supply data for vColor
      gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
      gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vColor );


        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
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
    // Blocks.push(new Tetrimino(vec4(0.0, 0.0, 0.0, 1.0), -1,-1, 1,-1, 1,1,1,0));
    Blocks.push(new Tetrimino(vec4(0.0, 1.0, 1.0, 1.0), 400, 300, 450, 250, 500, 300, 450, 350));

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].init();
    }

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    // transformation = gl.getUniformLocation( program, "transformation" );
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
