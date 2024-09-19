// hhhh TETRIMINO CLASS
// color -> mino's color (vec4)
function hhhhTetrimino(color) {
    ///////////////////////////////////
    /*     INSTANCE VARIABLES        */
    ///////////////////////////////////

    this.color = color; //instance variable to hold tetrimino's color
    this.hhhh = []; //holds tetrmino's minos
    
    ///////////////////////////////////
    /*      GETTERS & SETTERS        */
    ///////////////////////////////////

    // UPDATE TETRMINO'S OFFSET VALUES BY UPADING OFFSET FOR EACH MINO
    // dx -> difference of x
    // dy -> difference of y
    this.updateOffset = function(dx, dy) {
        for (var i = 0; i < 4; i++) {
            this.hhhh[i].updateOffsetMino(dx, dy);
        }
    }

    // UPDATE TETRIMINO'S ANGLE BY UPDATING ALL MINO'S ANGLES
    // deg -> amount of degrees that tetrimino was rotated
    this.updateAngle = function(deg) {
        for (var i = 0; i < 4; i++) {
            this.hhhh[i].updateAngleMino(deg);
        }
    }

    // GET TETRIMINO'S SHAPE
    this.getType = function() {
        return "hhhh";
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
            this.hhhh[i].draw();
        }
        
    }

    // FUNCTION TO DETERMINE IF POINT INSIDE OF TETRMINO BY DETERMINING IF IN ANY OF ITS MINOS
    // x -> x value of point
    // y -> y value of point
    this.isInside = function(x, y) {
        for (var i = 0; i < 4; i++) {
            var inside = this.hhhh[i].isInsideMino(x, y);

            if (inside) { 
                return true; // if inside any of the minos, its insides tetrimino
            }
        }

        return false; //if not inside any of the minos, its outside tetrimino
    }

    // FUNCTION TO DETERMINE IF TETRIMINO NEEDS TO BE DELETED BY CHECKING IF ANY MINOS NEED TO BE DELETED
    this.inDelete = function() {
        for (var i = 0; i < 4; i++) {
            var deleteVal = this.hhhh[i].inDeleteMino();

            if (deleteVal) {
                return true; //if any mino needs to be deleted, tetrimino needs to be deleted
            }
        }

        return false; //if none of the mino's need to be deleted, tetrimino does not need to be deleted
    }
}