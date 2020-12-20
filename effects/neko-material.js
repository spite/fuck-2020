import {
  Vector2,
  RepeatWrapping,
  TextureLoader,
  Color,
  sRGBEncoding,
  CubeTextureLoader,
  LinearEncoding,
  MeshStandardMaterial,
} from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";

const loader = new TextureLoader();
const diffuse = loader.load(`./assets/manekineko_light.png`);
const dark = loader.load(`./assets/manekineko_dark.png`);
const normal = loader.load(`./assets/manekineko_light_normal.png`);
const roughness = loader.load(`./assets/manekineko_light_roughness.png`);

diffuse.encoding = sRGBEncoding;
normal.encoding = LinearEncoding;
roughness.encoding = LinearEncoding;

diffuse.wrapS = diffuse.wrapT = RepeatWrapping;
normal.wrapS = normal.wrapT = RepeatWrapping;
roughness.wrapS = roughness.wrapT = RepeatWrapping;

const cubeTexLoader = new CubeTextureLoader();
cubeTexLoader.setPath("./assets/");
const f = "pisa_";
const ext = "png";
const environmentMap = cubeTexLoader.load([
  `${f}posx.${ext}`,
  `${f}negx.${ext}`,
  `${f}posy.${ext}`,
  `${f}negy.${ext}`,
  `${f}posz.${ext}`,
  `${f}negz.${ext}`,
]);
environmentMap.encoding = sRGBEncoding;

class NekoMaterial extends MeshStandardMaterial {
  constructor() {
    const params = {
      roughness: 0.52,
      metalness: 0.1,
      map: diffuse,
      color: 0xffffff,
      emissive: 0x00fffa,
      emissiveMap: dark,
      normalMap: normal,
      normalScale: new Vector2(0.05, 0.05),
      roughnessMap: roughness,
      envMap: environmentMap,
    };
    super(params);

    this.params = params;
    this.params.badness = 0;

    this.uniforms = {
      roughness: { value: this.params.roughness },
      metalness: { value: this.params.metalness },
      map: { value: this.params.map },
      envMap: { value: this.params.envMap },
      normalMap: { value: this.params.normalMap },
      roughnessMap: { value: this.params.roughnessMap },
      normalScale: { value: this.params.normalScale },
      badness: { value: this.params.badness },
    };

    this.onBeforeCompile = (shader, renderer) => {
      for (const uniformName of Object.keys(this.uniforms)) {
        shader.uniforms[uniformName] = this.uniforms[uniformName];
      }

      shader.fragmentShader = shader.fragmentShader.replace(
        `uniform vec3 emissive;`,
        `uniform vec3 emissive;
uniform float badness;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <map_fragment>`,
        `#ifdef USE_MAP
        vec4 texelColor = texture2D( map, vUv );
        texelColor = mapTexelToLinear( texelColor*(1.-badness) );
        diffuseColor *= texelColor;
      #endif`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <emissivemap_fragment>`,
        `#ifdef USE_EMISSIVEMAP
        vec4 emissiveColor = texture2D( emissiveMap, vUv );
        emissiveColor -= .1*texture2D( emissiveMap, vUv,8. );
        emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor*badness ).rgb;
        totalEmissiveRadiance *= emissiveColor.rgb;
      #endif`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>
        gl_FragColor.a = 1.;// 4.*length(emissiveColor.rgb) * badness;`
      );
    };
  }
}

function generateParams(gui, material) {
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
