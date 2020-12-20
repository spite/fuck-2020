import { shader as vs } from "../shaders/check-vs.js";
import { shader as fs } from "../shaders/check-fs.js";

const extensions = document
  .createElement("canvas")
  .getContext("webgl")
  .getSupportedExtensions();

function canDoTexLOD() {
  return extensions.indexOf("EXT_shader_texture_lod") !== -1;
}

function canDoColorBufferFloat() {
  return extensions.indexOf("WEBGL_color_buffer_float") !== -1;
}

function canDoColorBufferHalfFloat() {
  return extensions.indexOf("EXT_color_buffer_half_float") !== -1;
}

function log(msg) {
  console.log(msg);
}

function glEnum(gl, v) {
  for (var key in gl) {
    if (gl[key] === v) {
      return key;
    }
  }
  return "0x" + v.toString(16);
}

function createProgramFromScripts(context, vertexShader, fragmentShader) {
  const vs = context.createShader(context.VERTEX_SHADER);
  context.shaderSource(vs, vertexShader);
  context.compileShader(vs);
  const fs = context.createShader(context.FRAGMENT_SHADER);
  context.shaderSource(fs, fragmentShader);
  context.compileShader(fs);

  const program = context.createProgram();
  context.attachShader(program, vs);
  context.attachShader(program, fs);

  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    var info = context.getProgramInfoLog(program);
    throw "Could not compile WebGL program. \n\n" + info;
  }

  return program;
}

const floatTextures = {
  float: false,
  floatFilter: false,
  canRenderToFloat: false,
  halfFloat: false,
  halfFloatFilter: false,
  canRenderToHalfFloat: false,
};

function checkContext() {
  // Get A WebGL context
  var canvas = document.createElement("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  function getExt(name, msg) {
    var ext = gl.getExtension(name);
    return !!ext;
  }

  floatTextures.float = getExt("OES_texture_float");
  floatTextures.floatFilter = getExt("OES_texture_float_linear");
  floatTextures.halfFloat = getExt("OES_texture_half_float");
  floatTextures.halfFloatFilter = getExt("OES_texture_half_float_linear");

  gl.HALF_FLOAT_OES = 0x8d61;

  // setup GLSL program
  var program = createProgramFromScripts(gl, vs, fs);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLoc = gl.getUniformLocation(program, "u_color");

  // provide texture coordinates for the rectangle.
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
    ]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  var whiteTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, whiteTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  );

  function test(format) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, format, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0
    );
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      //log("can **NOT** render to " + glEnum(gl, format) + " texture");
      return false;
    }

    // Draw the rectangle.
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.uniform4fv(colorLoc, [0, 10, 20, 1]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform4fv(colorLoc, [0, 1 / 10, 1 / 20, 1]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    var pixel = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    if (pixel[0] !== 0 || pixel[1] < 248 || pixel[2] < 248 || pixel[3] < 254) {
      // log(
      //   `FAIL!!!: Was not able to actually render to ${glEnum(
      //     gl,
      //     format
      //   )} texture`
      // );
      return false;
    } else {
      //log("succesfully rendered to " + glEnum(gl, format) + " texture");
      return true;
    }
  }
  if (floatTextures.float) {
    floatTextures.canRenderToFloat = test(gl.FLOAT);
  }
  if (floatTextures.halfFloat) {
    floatTextures.canRenderToHalfFloat = test(gl.HALF_FLOAT_OES);
  }
}
checkContext();

function canDoFloatLinear() {
  return (
    floatTextures.float &&
    floatTextures.floatFilter &&
    floatTextures.canRenderToFloat
  );
}

function canDoHalfFloatLinear() {
  return (
    floatTextures.halfFloat &&
    floatTextures.halfFloatFilter &&
    floatTextures.canRenderToHalfFloat
  );
}

export {
  canDoTexLOD,
  canDoFloatLinear,
  canDoHalfFloatLinear,
  canDoColorBufferFloat,
  canDoColorBufferHalfFloat,
  floatTextures,
  extensions,
};
