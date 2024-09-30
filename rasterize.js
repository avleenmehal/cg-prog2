/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var indexBuffer; // this contains indices into vertexBuffer in triples
var colorBuffer;// this contains color into colorBuffer in triples
var triBufferSize =0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexColorAttrib; // where to put position for vertex shader


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
// function loadTriangles() {
//     var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
//     if (inputTriangles != String.null) { 
//         var whichSetVert; // index of vertex in current triangle set
//         var whichSetTri; // index of triangle in current triangle set
//         var coordArray = []; // 1D array of vertex coords for WebGL
//         var indexArray = [];
        
//         for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            
//             // set up the vertex coord array
//             for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
//                 coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
//                 // console.log(inputTriangles[whichSet].vertices[whichSetVert]);
//             }
//         } // end for each triangle set 
//         // console.log(coordArray.length);
//         // console.log(coordArray);
//         // send the vertex coords to webGL
//         vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
//         gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
//         gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

//         // indexBuffer = gl.createBuffer();
//         // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
//         // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(), gl.STATIC_DRAW);
        
//     } // end if triangles found
// } // end load triangles

function loadTriangles(inputTriangles) {
    // var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri;  // index of triangle in current triangle set
        var coordArray = [];
        var colorArray = [];  // 1D array of vertex coords for WebGL
        var indexArray = [];  // 1D array of vertex indices for WebGL
        var indexOffset = 0;  // keep track of the current index offset for the current triangle set
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            // Set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++) {
                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                var col = inputTriangles[whichSet].material.diffuse;
                colorArray = colorArray.concat([col[0], col[1], col[2]]);
                
                
            }
            
            // Set up the index array
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                var tri = inputTriangles[whichSet].triangles[whichSetTri];
                
                // Add offset to the indices to handle multiple sets
                indexArray = indexArray.concat([tri[0] + indexOffset, tri[1] + indexOffset, tri[2] + indexOffset]);
                
            }
            

            // Update index offset to ensure proper indexing across triangle sets
            indexOffset += inputTriangles[whichSet].vertices.length;
        }

        // Send the vertex coords to WebGL
        vertexBuffer = gl.createBuffer();  // Init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);  // Activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW);  // Coords to that buffer

        // Send the triangle indices to WebGL
        indexBuffer = gl.createBuffer();  // Init empty index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);  // Activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);  // Indices to that buffer

        //color bubffer
        colorBuffer = gl.createBuffer();  // Init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);  // Activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);

        triBufferSize = indexArray.length;  // Number of indices
    }
}


// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragColor;
        void main(void) {
            gl_FragColor = vec4(fragColor, 1.0); // all fragments are white
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 vertexColor;
        varying vec3 fragColor;

        void main(void) {
            fragColor = vertexColor;
            gl_Position = vec4(vertexPosition, 1.0); // use the untransformed position
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                vertexColorAttrib = gl.getAttribLocation(shaderProgram, "vertexColor");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                gl.enableVertexAttribArray(vertexColorAttrib); // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);  // Activate the index buffer
    gl.vertexAttribPointer(vertexColorAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);  // Activate the index buffer
    // Render the triangles using indices
    gl.drawElements(gl.TRIANGLES, triBufferSize, gl.UNSIGNED_SHORT, 0);  // Render using index buffer

} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main(inputTriangles) {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(inputTriangles); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main
