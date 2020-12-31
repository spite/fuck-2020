import {
  sRGBEncoding,
  MeshStandardMaterial,
} from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";

class NekoMaterial extends MeshStandardMaterial {
  constructor() {
    const params = {
      roughness: 0,
      metalness: 1,
      map: null,
      color: 0x00d3ff,
      emissive: 0x00d3ff,
      emissiveMap: null,
      envMap: null,
      envMapIntensity: 50,
    };
    super(params);

    this.onBeforeCompile = (shader, renderer) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <map_fragment>`,
        `#ifdef USE_MAP
        vec4 texelColor = texture2D( map, vUv );
        texelColor = mapTexelToLinear( texelColor*(1.-1.) );
        diffuseColor *= texelColor;
      #endif`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <emissivemap_fragment>`,
        `#ifdef USE_EMISSIVEMAP
        vec4 emissiveColor = texture2D( emissiveMap, vUv );
        //emissiveColor -= .1*texture2D( emissiveMap, vUv,8. );
        //emissiveColor *= 0.;
        emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor*1. ).rgb;
        totalEmissiveRadiance *= emissiveColor.rgb;
      #endif`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>
        gl_FragColor.a = 1.;// 4.*length(emissiveColor.rgb) * 1.;`
      );
    };
  }
}

function generateParams(gui, material) {
  return;
  const params = material.params;
  gui
    .add(params, "roughness", 0, 1)
    .onChange((v) => (material.roughness = (1 - params.badness) * v));
  gui
    .add(params, "metalness", 0, 1)
    .onChange((v) => (material.metalness = (1 - params.badness) * v));
  gui.add(params, "badness", 0, 1).onChange((v) => {
    const vv = Easings.InOutQuad(v);
    material.uniforms.badness.value = v;
    material.roughness = (1 - vv) * params.roughness;
    material.metalness = Maf.mix(params.metalness, 1, vv);
    material.uniforms.normalScale.value.setScalar((1 - vv) * 0.05);
  });
}

export { NekoMaterial, generateParams };
