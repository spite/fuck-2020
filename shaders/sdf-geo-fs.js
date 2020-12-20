import * as features from "../js/features.js";

const lodPolyfill = features.canDoTexLOD()
  ? ""
  : `
vec4 textureCubeLodEXT(samplerCube cube, vec3 n, float bias) {
  return textureCube(cube, n, .5 * bias);
}
`;

const enableLodTex = features.canDoTexLOD()
  ? `#extension GL_EXT_shader_texture_lod : enable`
  : "";

const shader = `
#extension GL_OES_standard_derivatives : enable
${enableLodTex}

precision highp float;

uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;

uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform samplerCube envMap;

uniform float exposureDiffuse;
uniform float exposureSpecular;
uniform float roughness;
uniform float texScale;
uniform float normalScale;
uniform float stripeFreq;
uniform float stripeOffset;
uniform vec4 stripeColor;
uniform vec4 baseColor;
uniform vec4 ambientColor;

varying vec3 vNormal;
varying vec3 vONormal;
varying vec4 vPosition;
varying vec3 vEye;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

${lodPolyfill}

void main() {

  vec3 n = normalize( vONormal.xyz );
  vec3 blend_weights = abs( n );
  blend_weights = ( blend_weights - 0.2 ) * 7.;  
  blend_weights = max( blend_weights, 0. );
  blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

  vec2 coord1 = vPosition.yz * texScale;
  vec2 coord2 = vPosition.zx * texScale;
  vec2 coord3 = vPosition.xy * texScale;

  vec4 col1 = texture2D( textureMap, coord1 );  
  vec4 col2 = texture2D( textureMap, coord2 );  
  vec4 col3 = texture2D( textureMap, coord3 ); 

  vec4 spec1 = texture2D( specularMap, coord1 );  
  vec4 spec2 = texture2D( specularMap, coord2 );  
  vec4 spec3 = texture2D( specularMap, coord3 ); 

  vec3 bump1 = texture2D( normalMap, coord1 ).rgb;  
  vec3 bump2 = texture2D( normalMap, coord2 ).rgb;  
  vec3 bump3 = texture2D( normalMap, coord3 ).rgb; 

  vec4 blended_color = col1 * blend_weights.xxxx +  
                       col2 * blend_weights.yyyy +  
                       col3 * blend_weights.zzzz; 

  vec4 blended_specular = spec1 * blend_weights.xxxx +  
                          spec2 * blend_weights.yyyy +  
                          spec3 * blend_weights.zzzz; 

  float stripe = smoothstep(.45,.55, .5 + .5 *sin(stripeOffset + stripeFreq*vPosition.y));
  blended_specular *= .5 + .5 * stripe;

  vec3 blended_bump = bump1 * blend_weights.xxx +  
                      bump2 * blend_weights.yyy +  
                      bump3 * blend_weights.zzz;

  vec3 tn = vNormal;                   
  vec3 tanX = vec3(  tn.x, -tn.z,  tn.y );
  vec3 tanY = vec3(  tn.z,  tn.y, -tn.x );
  vec3 tanZ = vec3( -tn.y,  tn.x,  tn.z );
  vec3 blended_tangent = tanX * blend_weights.xxx +  
                         tanY * blend_weights.yyy +  
                         tanZ * blend_weights.zzz; 

  vec3 normalTex = blended_bump * 2.0 - 1.0;
  normalTex.xy *= normalScale;
  normalTex = normalize( normalTex );
  normalTex = mix(vec3(0., 0., 1.), normalTex, roughness /3.);
  vec3 tt = normalMatrix * blended_tangent;
  mat3 tsb = mat3( normalize( tt ), normalize( cross( vWorldNormal, tt ) ), normalize( vWorldNormal ) );
  vec3 finalNormal = tsb * normalTex ;

  float rimPower = 4.;
  float useRim = 1.;
  float f = rimPower * abs( dot( finalNormal, normalize( vEye ) ) );
  f = clamp( 0., 1., useRim * ( 1. - smoothstep( 0.0, 1., f ) ) );
  blended_specular += f;

  blended_color.rgb = pow( blended_color.rgb, vec3( 1. / 2.2 ) );

  vec4 color = blended_color;
  color.rgb *= baseColor.rgb;
  color.rgb += stripeColor.rgb * stripe;
  color.a *= baseColor.a;
  color.a += stripeColor.a * stripe;

  color += ambientColor;

  vec4 refDiff =  8. * textureCubeLodEXT(envMap, finalNormal,  8. + roughness);
  color *= refDiff * exposureDiffuse;
  
  vec4 refSpec = vec4(0.);
  vec3 eyeToSurfaceDir = normalize(vWorldPosition - cameraPosition);
  vec3 fn = reflect(eyeToSurfaceDir,finalNormal);
  refSpec += .9 * textureCubeLodEXT(envMap, fn, 4. + roughness );
  refSpec += .6*  textureCubeLodEXT(envMap, fn, 2. + roughness );
  refSpec += .3*  textureCubeLodEXT(envMap, fn, 1. + roughness );
  color += blended_specular * refSpec * exposureSpecular;
  
  gl_FragColor = color;
 // gl_FragColor = vec4(mat3(viewMatrix) * finalNormal,1.);
//  gl_FragColor = textureCubeLodEXT(envMap, finalNormal);
  //gl_FragColor = vec4(tbn * normalTex, 1.);
  //gl_FragColor = vec4(f, f, f, 1.);
}`;

export { shader };
