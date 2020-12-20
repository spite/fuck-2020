const shader = `
#define EPSILON 	0.001
#define MAXDIST 	100.0
#define MAXSTEPS	100

attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float tetrahedronFactor;
uniform float cubeFactor;
uniform float octahedronFactor;
uniform float icosahedronFactor;
uniform float dodecahedronFactor;
uniform float sphereFactor;
uniform float smoothness;
uniform float twistX;
uniform float twistY;
uniform float twistZ;

uniform float time;

varying vec3 vNormal;
varying vec3 vONormal;
varying vec4 vPosition;
varying vec3 vEye;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

mat3 rotate_x (float fi) {
	float cfi = cos (fi);
	float sfi = sin (fi);
	return mat3 (
		vec3 (1.0, 0.0, 0.0),
		vec3 (0.0, cfi, -sfi),
		vec3 (0.0, sfi, cfi)
	);
}

mat3 rotate_y (float fi) {
	float cfi = cos (fi);
	float sfi = sin (fi);
	return mat3 (
		vec3 (cfi, 0.0, sfi),
		vec3 (0.0, 1.0, 0.0),
		vec3 (-sfi, 0.0, cfi)
	);
}

mat3 rotate_z (float fi) {
	float cfi = cos (fi);
	float sfi = sin (fi);
	return mat3 (
		vec3 (cfi, -sfi, 0.0),
		vec3 (sfi, cfi, 0.0),
		vec3 (0.0, 0.0, 1.0)
	);
}

float displacement(vec3 p) {
  float s = 2.;
  return .5*sin(s*p.x)*sin(s*p.y)*sin(s*p.z);
}


vec3 opTwistY( vec3 p, float twist )
{
    float k = twist;
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec2 r = m*p.xz;
    vec3  q = vec3(r.x,p.y,r.y);
    return q;
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}


float udRoundBox( vec3 p, vec3 b, float r ) {
  return length(max(abs(p)-b,0.0))-r;
}

float dot2( in vec3 v ) { return dot(v,v); }
float sdTetrahedron(vec3 p, float size)
{
    const float k = sqrt(2.0);
    p /= size;
    p.xz = abs(p.xz);
    
    float m = 2.0*p.z - k*p.y - 1.0;
    p = (m>0.0) ? p : vec3(p.z,-p.y,p.x);
    float s1 = clamp(p.x,0.0,1.0);
    float s2 = clamp((p.x-p.y*k-p.z+2.0)/4.0,0.0,1.0);
    
    m = 2.0*p.z - k*p.y - 1.0;
    float d = sign(m)*sqrt((sign(p.y*k+p.z+1.0)+sign(2.0-3.0*p.x-k*p.y-p.z)<1.0) 
                  ?
                  min( dot2(vec3(s1,-k*0.5,0)-p), 
                       dot2(vec3(s2, k*0.5-k*s2,1.0-s2)-p) )
                  :
                  m*m/6.0 );
    
    return d * size;
}

float opSmoothUnion( float d1, float d2, float k ) {
  float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
  return mix( d2, d1, h ) - k*h*(1.0-h); }

float opSmoothSubtraction( float d1, float d2, float k ) {
  float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
  return mix( d2, -d1, h ) + k*h*(1.0-h); }

float opSmoothIntersection( float d1, float d2, float k ) {
  float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
  return mix( d2, d1, h ) + k*h*(1.0-h); }

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}


float sdOctahedron( vec3 p, float s)
{
  p = abs(p);
  float m = p.x+p.y+p.z-s;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
  return length(vec3(q.x,q.y-s+k,q.z-k)); 
}

// https://www.shadertoy.com/view/XtyXzW

#define PI 3.14159265359
#define PHI (1.618033988749895)
#define TAU 6.283185307179586

#define GDFVector3 normalize(vec3(1, 1, 1 ))
#define GDFVector4 normalize(vec3(-1, 1, 1))
#define GDFVector5 normalize(vec3(1, -1, 1))
#define GDFVector6 normalize(vec3(1, 1, -1))

#define GDFVector7 normalize(vec3(0, 1, PHI+1.))
#define GDFVector8 normalize(vec3(0, -1, PHI+1.))
#define GDFVector9 normalize(vec3(PHI+1., 0, 1))
#define GDFVector10 normalize(vec3(-PHI-1., 0, 1))
#define GDFVector11 normalize(vec3(1, PHI+1., 0))
#define GDFVector12 normalize(vec3(-1, PHI+1., 0))

#define GDFVector13 normalize(vec3(0, PHI, 1))
#define GDFVector14 normalize(vec3(0, -PHI, 1))
#define GDFVector15 normalize(vec3(1, 0, PHI))
#define GDFVector16 normalize(vec3(-1, 0, PHI))
#define GDFVector17 normalize(vec3(PHI, 1, 0))
#define GDFVector18 normalize(vec3(-PHI, 1, 0))

#define fGDFBegin float d = 0.;
#define fGDF(v) d = max(d, abs(dot(p, v)));
#define fGDFEnd return d - r;

// Version with variable exponent.
// This is slow and does not produce correct distances, but allows for bulging of objects.
#define fGDFExp(v) d += pow(abs(dot(p, v)), e);

// Version with without exponent, creates objects with sharp edges and flat faces
#define fGDF(v) d = max(d, abs(dot(p, v)));

// https://www.shadertoy.com/view/lssfW4

#define fGDFExpEnd return pow(d, 1./e) - r;
#define fGDFEnd return d - r;

float fDodecahedron(vec3 p, float r, float e) {
	fGDFBegin
  fGDFExp(GDFVector13) fGDFExp(GDFVector14) fGDFExp(GDFVector15) fGDFExp(GDFVector16)
  fGDFExp(GDFVector17) fGDFExp(GDFVector18)
  fGDFExpEnd
}

float fDodecahedron(vec3 p, float r) {
    fGDFBegin
    fGDF(GDFVector13) fGDF(GDFVector14) fGDF(GDFVector15) fGDF(GDFVector16)
    fGDF(GDFVector17) fGDF(GDFVector18)
    fGDFEnd
}

float fIcosahedron(vec3 p, float r) {
    fGDFBegin
    fGDF(GDFVector3) fGDF(GDFVector4) fGDF(GDFVector5) fGDF(GDFVector6)
    fGDF(GDFVector7) fGDF(GDFVector8) fGDF(GDFVector9) fGDF(GDFVector10)
    fGDF(GDFVector11) fGDF(GDFVector12)
    fGDFEnd
}

float fIcosahedron(vec3 p, float r, float e) {
  fGDFBegin
  fGDFExp(GDFVector3) fGDFExp(GDFVector4) fGDFExp(GDFVector5) fGDFExp(GDFVector6)
  fGDFExp(GDFVector7) fGDFExp(GDFVector8) fGDFExp(GDFVector9) fGDFExp(GDFVector10)
  fGDFExp(GDFVector11) fGDFExp(GDFVector12)
  fGDFExpEnd
}

float map (vec3 p, float t) {
  vec3 pp = opTwistY( p, twistY );
  float tetra = sdTetrahedron(pp, max(.0001,tetrahedronFactor)) - .1;
  float cube = sdRoundBox(pp, vec3(cubeFactor), .1);
  float octa = sdOctahedron(pp, 1.25 * octahedronFactor) - .1;
  float icosa = fIcosahedron(pp, 1. * icosahedronFactor, 50.);
  float dodeca = fDodecahedron(pp, 1. * dodecahedronFactor, 50.);
  float sphere = sdSphere(pp, sphereFactor);
  float a = opSmoothUnion(tetra,cube, smoothness);
  a = opSmoothUnion(a, octa, smoothness);
  a = opSmoothUnion(a, icosa, smoothness);
  a = opSmoothUnion(a, dodeca, smoothness);
  a = opSmoothUnion(a, sphere, smoothness);
  return a;
  
  // //float d = displacement(pp);
  // //return d + ( sdCappedCylinder(pp, 1., .5) - .1);
  // float icosa = fIcosahedron(pp, 1., 50.);
  // //return icosa;
  // float dodeca = fDodecahedron(pp, 1., 50.);
  // //return dodeca;
  // //float pyramid =  sdPyramid(pp, 1., 2.) - .1;
  // float octa = sdOctahedron(pp, 1.25) - .1;
  // //return octa;
  // float sphere = sdSphere(p, 1.1);
  // return sphere;
  // //return sdRoundBox(pp, vec3(.5,.5,.5), .05);
  // float tetra = sdTetrahedron(pp, 1.) - .1;
  // //return tetra;
  // //return  opSmoothUnion(icosa, dodeca, .05);
  // return  opSmoothUnion(sphere, dodeca, .05);
  // //return opSmoothIntersection(dodeca, icosa, .5);
  // return sdPyramid(pp, 1., .75) - .1;
}

vec3 calcNormal (vec3 p, float t) {
    float d = map (p, t);
    return normalize (vec3 (
        map (p - vec3 (EPSILON, 0.0, 0.0), t) - d,
        map (p - vec3 (0.0, EPSILON, 0.0), t) - d,
        map (p - vec3 (0.0, 0.0, EPSILON), t) - d
    ));
}

float march (vec3 ro, vec3 rd, float time) {
 	float d = EPSILON;
    float t = 0.0;

    for (int i = 0; i < MAXSTEPS; ++i) {
     	vec3 p = ro + rd * d;
       	t = map (p, time);
        if (t < EPSILON || d >= MAXDIST)
            break;
        d += t;
    }
    return d;

}

void main () {

	vec3 up = vec3( 0.0, 1.0, 0.0 );
	vec3 fw = vec3( 1.0, 0.0, 0.0 );
	vec3 rd = - normalize( position );
  vec3 ro = position;

  float d = march( ro, rd, 0. );
  vec3 p = ro + d * rd;
  vec3 nm = calcNormal (p, 0.) * -1.;

  vPosition = vec4( p, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );;

  vEye = ( modelViewMatrix * vec4( p, 1.0 ) ).xyz;
  vNormal = normalMatrix * nm;
  vONormal = nm;

  vWorldPosition = (modelMatrix * vec4(p,1.)).xyz;
  vWorldNormal = mat3(modelMatrix) * nm;
}
`;

export { shader };
