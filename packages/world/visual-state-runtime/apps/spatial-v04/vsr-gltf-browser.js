"use strict";
var VSRGltfAsset = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/gltf-asset/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    VSR_GLTF_ASSET_VERSION: () => VSR_GLTF_ASSET_VERSION,
    VSR_GLTF_IMPORT_FORMAT: () => VSR_GLTF_IMPORT_FORMAT,
    decodeGltfImageToSpatialTexture: () => decodeGltfImageToSpatialTexture,
    decodeKtx2ToSpatialTexture: () => decodeKtx2ToSpatialTexture,
    importGlbToSpatialScene: () => importGlbToSpatialScene,
    importGlbToSpatialSceneAsync: () => importGlbToSpatialSceneAsync,
    importGltfToSpatialScene: () => importGltfToSpatialScene,
    importGltfToSpatialSceneAsync: () => importGltfToSpatialSceneAsync,
    parseGlb: () => parseGlb,
    resolveGltfTextureSource: () => resolveGltfTextureSource,
    verifyGltfImportReceipt: () => verifyGltfImportReceipt
  });

  // packages/spec/src/index.ts
  function canonicalize(value) {
    if (value === null) return "null";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite number.");
      return Number(value.toFixed(9)).toString();
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
    if (typeof value === "object") {
      const object = value;
      const keys = Object.keys(object).filter((k) => object[k] !== void 0).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(object[k])}`).join(",")}}`;
    }
    throw new Error(`Unsupported canonical value: ${typeof value}`);
  }
  function sha256Bytes(bytes) {
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const message = new Uint8Array(paddedLength);
    message.set(bytes);
    message[bytes.length] = 128;
    const view = new DataView(message.buffer);
    const high = Math.floor(bitLength / 4294967296);
    const low = bitLength >>> 0;
    view.setUint32(paddedLength - 8, high, false);
    view.setUint32(paddedLength - 4, low, false);
    const constants = new Uint32Array([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const w = new Uint32Array(64);
    const rotr = (value, shift) => value >>> shift | value << 32 - shift;
    for (let offset = 0; offset < message.length; offset += 64) {
      for (let index = 0; index < 16; index++) w[index] = view.getUint32(offset + index * 4, false);
      for (let index = 16; index < 64; index++) {
        const s0 = rotr(w[index - 15], 7) ^ rotr(w[index - 15], 18) ^ w[index - 15] >>> 3;
        const s1 = rotr(w[index - 2], 17) ^ rotr(w[index - 2], 19) ^ w[index - 2] >>> 10;
        w[index] = w[index - 16] + s0 + w[index - 7] + s1 >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let index = 0; index < 64; index++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = e & f ^ ~e & g;
        const t1 = hh + s1 + ch + constants[index] + w[index] >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = s0 + maj >>> 0;
        hh = g;
        g = f;
        f = e;
        e = d + t1 >>> 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 >>> 0;
      }
      h[0] = h[0] + a >>> 0;
      h[1] = h[1] + b >>> 0;
      h[2] = h[2] + c >>> 0;
      h[3] = h[3] + d >>> 0;
      h[4] = h[4] + e >>> 0;
      h[5] = h[5] + f >>> 0;
      h[6] = h[6] + g >>> 0;
      h[7] = h[7] + hh >>> 0;
    }
    return [...h].map((value) => value.toString(16).padStart(8, "0")).join("");
  }
  function sha256Hex(text) {
    return sha256Bytes(new TextEncoder().encode(text));
  }
  function cryptographicHash(value) {
    return sha256Hex(canonicalize(value));
  }

  // packages/spatial-reality-3d/src/index.ts
  var CRC32_TABLE = Array.from({ length: 256 }, (_, seed) => {
    let value = seed;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
    return value >>> 0;
  });
  var VSR_SPATIAL_SCENE_FORMAT = "vsr.spatial-scene.v0.4";
  function identityMat4() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  var VSR_SPATIAL_FRAGMENT_WGSL_V04 = `
 struct ShadowCamera { lightViewProjection:mat4x4<f32>, params:vec4<f32> };
 @group(0) @binding(1) var shadowSampler:sampler;
 @group(0) @binding(2) var shadowMap:texture_depth_2d;
 @group(0) @binding(3) var<uniform> shadowCamera:ShadowCamera;
 @group(0) @binding(4) var environmentSampler:sampler;
 @group(0) @binding(5) var environmentTexture:texture_2d<f32>;
 struct SpatialLight { positionOrDirection:vec4<f32>, colorIntensity:vec4<f32>, params:vec4<f32> };
 @group(0) @binding(6) var<storage,read> spatialLights:array<SpatialLight>;
 struct EnvironmentProbe { positionRadius:vec4<f32>, diffuseIntensity:vec4<f32>, specularIntensity:vec4<f32> };
 @group(0) @binding(7) var<storage,read> environmentProbes:array<EnvironmentProbe>;
  struct EnvironmentVolumeField { header:vec4<f32>, data:array<vec4<f32>> };
  @group(0) @binding(8) var<storage,read> environmentVolume:EnvironmentVolumeField;
 struct Material { baseColor: vec4<f32>, params:vec4<f32>, emissive:vec4<f32>, advanced:vec4<f32>, lightmap:vec4<f32>, reactive:vec4<f32> };
 @group(2) @binding(0) var<uniform> material:Material;
 @group(2) @binding(1) var baseColorSampler:sampler;
 @group(2) @binding(2) var baseColorTexture:texture_2d<f32>;
 @group(2) @binding(3) var metallicRoughnessSampler:sampler;
 @group(2) @binding(4) var metallicRoughnessTexture:texture_2d<f32>;
 @group(2) @binding(5) var normalSampler:sampler;
 @group(2) @binding(6) var normalTexture:texture_2d<f32>;
 @group(2) @binding(7) var occlusionSampler:sampler;
 @group(2) @binding(8) var occlusionTexture:texture_2d<f32>;
  @group(2) @binding(9) var emissiveSampler:sampler;
  @group(2) @binding(10) var emissiveTexture:texture_2d<f32>;
   @group(2) @binding(11) var lightmapSampler:sampler;
   @group(2) @binding(12) var lightmapTexture:texture_2d<f32>;
   @group(2) @binding(13) var reactiveSampler:sampler;
   @group(2) @binding(14) var reactiveTexture:texture_2d<f32>;
 const PI:f32=3.14159265359;
fn distributionGGX(nDotH:f32,roughness:f32)->f32{let a=roughness*roughness;let a2=a*a;let d=nDotH*nDotH*(a2-1.0)+1.0;return a2/max(PI*d*d,0.000001);}
fn geometrySchlickGGX(nDotV:f32,roughness:f32)->f32{let r=roughness+1.0;let k=(r*r)/8.0;return nDotV/max(nDotV*(1.0-k)+k,0.000001);}
fn geometrySmith(nDotV:f32,nDotL:f32,roughness:f32)->f32{return geometrySchlickGGX(nDotV,roughness)*geometrySchlickGGX(nDotL,roughness);}
fn fresnelSchlick(cosTheta:f32,f0:vec3<f32>)->vec3<f32>{return f0+(vec3<f32>(1.0)-f0)*pow(clamp(1.0-cosTheta,0.0,1.0),5.0);}
fn environmentUv(direction:vec3<f32>)->vec2<f32>{let d=normalize(direction);return vec2<f32>(0.5+atan2(d.z,d.x)/(PI*2.0),0.5+asin(clamp(d.y,-1.0,1.0))/PI);}
fn environmentSample(direction:vec3<f32>,fallback:vec3<f32>,roughness:f32)->vec3<f32>{return select(fallback,textureSampleLevel(environmentTexture,environmentSampler,environmentUv(direction),clamp(roughness,0.0,1.0)*camera.environmentParams.y).rgb,camera.environmentParams.x>0.5);}
 fn volumeIndex(x:u32,y:u32,z:u32,dimensions:vec3<u32>)->u32{return x+dimensions.x*(y+dimensions.y*z);}
 fn environmentVolumeSample(worldPosition:vec3<f32>,fallback:vec3<f32>,specular:bool)->vec3<f32>{let volumeCount=min(u32(environmentVolume.header.x),arrayLength(&environmentVolume.data)/4u);if(volumeCount==0u){return fallback;}var fieldWeighted=vec3<f32>(0.0);var fieldTotal=0.0;let blendDistance=max(environmentVolume.header.z,0.001);for(var volumeIndexValue:u32=0u;volumeIndexValue<volumeCount;volumeIndexValue=volumeIndexValue+1u){let record=volumeIndexValue*4u;let boundsMin=environmentVolume.data[record].xyz;let boundsMax=environmentVolume.data[record+1u].xyz;let dimensions=vec3<u32>(u32(environmentVolume.data[record+2u].x),u32(environmentVolume.data[record+2u].y),u32(environmentVolume.data[record+2u].z));let sampleOffset=u32(environmentVolume.data[record+2u].w);if(dimensions.x<2u||dimensions.y<2u||dimensions.z<2u){continue;}let clampedPosition=clamp(worldPosition,boundsMin,boundsMax);let distanceToBounds=distance(worldPosition,clampedPosition);let geometryWeight=select(clamp(1.0-distanceToBounds/blendDistance,0.0,1.0),1.0,distanceToBounds<=0.0001);let volumeBlend=geometryWeight*clamp(environmentVolume.data[record+3u].x,0.0,1.0);if(volumeBlend<=0.0001){continue;}let span=boundsMax-boundsMin;let safeSpan=vec3<f32>(max(span.x,0.0001),max(span.y,0.0001),max(span.z,0.0001));let normalized=clamp((clampedPosition-boundsMin)/safeSpan,vec3<f32>(0.0),vec3<f32>(1.0));let coordinate=normalized*vec3<f32>(f32(dimensions.x-1u),f32(dimensions.y-1u),f32(dimensions.z-1u));let low=vec3<u32>(u32(floor(coordinate.x)),u32(floor(coordinate.y)),u32(floor(coordinate.z)));let high=vec3<u32>(min(low.x+1u,dimensions.x-1u),min(low.y+1u,dimensions.y-1u),min(low.z+1u,dimensions.z-1u));let weights=coordinate-vec3<f32>(f32(low.x),f32(low.y),f32(low.z));var volumeWeighted=vec3<f32>(0.0);var sampleTotal=0.0;for(var z:u32=0u;z<2u;z=z+1u){for(var y:u32=0u;y<2u;y=y+1u){for(var x:u32=0u;x<2u;x=x+1u){let sampleIndex=volumeCount*4u+(sampleOffset+volumeIndex(select(low.x,high.x,x==1u),select(low.y,high.y,y==1u),select(low.z,high.z,z==1u),dimensions))*2u;let sampleColor=select(environmentVolume.data[sampleIndex].xyz,environmentVolume.data[sampleIndex+1u].xyz,specular);let sampleIntensity=select(environmentVolume.data[sampleIndex].w,environmentVolume.data[sampleIndex+1u].w,specular);let sampleWeight=select(1.0-weights.x,weights.x,x==1u)*select(1.0-weights.y,weights.y,y==1u)*select(1.0-weights.z,weights.z,z==1u);volumeWeighted=volumeWeighted+sampleColor*sampleIntensity*sampleWeight;sampleTotal=sampleTotal+sampleWeight;}}}if(sampleTotal>0.0001){fieldWeighted=fieldWeighted+(volumeWeighted/max(sampleTotal,0.0001))*volumeBlend;fieldTotal=fieldTotal+volumeBlend;}}if(fieldTotal<=0.0001){return fallback;}return mix(fallback,fieldWeighted/max(fieldTotal,0.0001),clamp(fieldTotal,0.0,1.0));}
fn environmentProbeSample(worldPosition:vec3<f32>,fallback:vec3<f32>,specular:bool)->vec3<f32>{var weighted=vec3<f32>(0.0);var total=0.0;let count=min(u32(camera.environmentParams.w),arrayLength(&environmentProbes));for(var index:u32=0u;index<count;index=index+1u){let probe=environmentProbes[index];let influence=clamp(1.0-distance(worldPosition,probe.positionRadius.xyz)/max(probe.positionRadius.w,0.0001),0.0,1.0);let color=select(probe.diffuseIntensity.rgb,probe.specularIntensity.rgb,specular);let intensity=select(probe.diffuseIntensity.a,probe.specularIntensity.a,specular);weighted=weighted+color*intensity*influence;total=total+influence;}if(total<=0.0001){return fallback;}return mix(fallback,weighted/max(total,0.0001),clamp(total,0.0,1.0));}
 fn shadowVisibility(worldPosition:vec3<f32>)->f32{
   if(shadowCamera.params.x<0.5){return 1.0;}
   let clip=shadowCamera.lightViewProjection*vec4<f32>(worldPosition,1.0);if(clip.w<=0.0){return 1.0;}
   let uv=vec2<f32>(clip.x/clip.w*0.5+0.5,1.0-(clip.y/clip.w*0.5+0.5));if(any(uv<vec2<f32>(0.0))||any(uv>vec2<f32>(1.0))){return 1.0;}
   let depth=clip.z/clip.w*0.5+0.5;let shadowDepth=textureSampleLevel(shadowMap,shadowSampler,uv,0u);let visible=select(0.0,1.0,depth-shadowCamera.params.y<=shadowDepth);return mix(0.2,1.0,visible);
 }
  struct SpatialFragmentOut { @location(0) color:vec4<f32>, @location(1) depth:f32, @location(2) reactive:vec4<f32>, @location(3) velocity:vec4<f32> };
 @fragment fn fs_main(@builtin(position) fragPosition:vec4<f32>,@location(0) worldPosition:vec3<f32>,@location(1) normal:vec3<f32>,@location(2) uv:vec2<f32>,@location(3) lightmapUv:vec2<f32>,@location(4) temporalReactive:f32,@location(5) motion:vec3<f32>)->SpatialFragmentOut{
   let n0=normalize(normal);let tangent=normalize(cross(select(vec3<f32>(1.0,0.0,0.0),vec3<f32>(0.0,1.0,0.0),abs(n0.y)>0.9),n0));let bitangent=normalize(cross(n0,tangent));let normalSample=textureSample(normalTexture,normalSampler,uv);let n=normalize(tangent*((normalSample.x*2.0-1.0))+bitangent*((normalSample.y*2.0-1.0))+n0*(normalSample.z*2.0-1.0));
   let baseSample=textureSample(baseColorTexture,baseColorSampler,uv);let baseColor=material.baseColor*baseSample;let metallicRoughness=textureSample(metallicRoughnessTexture,metallicRoughnessSampler,uv);let metallic=clamp(material.params.x*metallicRoughness.b,0.0,1.0);let roughness=max(material.params.y*metallicRoughness.g,0.04);let emissiveSample=textureSample(emissiveTexture,emissiveSampler,uv);let selectedLightmapUv=select(uv,lightmapUv,material.lightmap.y>0.5);let lightmapSample=textureSample(lightmapTexture,lightmapSampler,selectedLightmapUv);let aoSample=textureSample(occlusionTexture,occlusionSampler,uv);let reactiveSample=textureSample(reactiveTexture,reactiveSampler,uv);
   let v=normalize(camera.cameraPosition.xyz-worldPosition);let emissiveStrength=material.params.z;let opacity=material.params.w*baseColor.a;if(material.lightmap.z>0.5&&material.lightmap.z<1.5&&opacity<material.lightmap.w){discard;}let reactive=clamp(max(max(material.reactive.x,temporalReactive),reactiveSample.r),0.0,1.0);
   let ao=mix(1.0,aoSample.r,material.advanced.x);let clearcoat=material.advanced.y;let clearcoatRoughness=max(material.advanced.z,0.04);let ior=max(material.advanced.w,1.0);
   let nDotV=max(dot(n,v),0.0001);let dielectric=pow((ior-1.0)/(ior+1.0),2.0);let f0=mix(vec3<f32>(dielectric),baseColor.rgb,vec3<f32>(metallic));
   let environmentF=fresnelSchlick(nDotV,f0);let environmentKd=(vec3<f32>(1.0)-environmentF)*(1.0-metallic);let reflection=normalize(2.0*nDotV*n-v);let environmentDiffuseColor=environmentProbeSample(worldPosition,environmentVolumeSample(worldPosition,environmentSample(n,camera.environmentDiffuse.rgb,1.0),false),false);let environmentSpecularColor=environmentProbeSample(worldPosition,environmentVolumeSample(worldPosition,environmentSample(reflection,camera.environmentSpecular.rgb,roughness),true),true);let environmentDiffuse=environmentKd*baseColor.rgb/PI*environmentDiffuseColor*camera.environmentDiffuse.a*ao;let environmentSpecular=environmentSpecularColor*camera.environmentSpecular.a*environmentF*(0.35+0.65*(1.0-roughness));
   var direct=vec3<f32>(0.0);let lightCount=min(u32(camera.environmentParams.z),arrayLength(&spatialLights));
   for(var lightIndex:u32=0u;lightIndex<lightCount;lightIndex=lightIndex+1u){let light=spatialLights[lightIndex];let directional=light.params.y>0.5;let delta=light.positionOrDirection.xyz-worldPosition;let distance=max(length(delta),0.0001);let l=select(normalize(delta),normalize(-light.positionOrDirection.xyz),directional);let attenuation=select(pow(clamp(1.0-distance/max(light.params.x,0.0001),0.0,1.0),2.0),1.0,directional);let h=normalize(l+v);let nDotL=max(dot(n,l),0.0);let nDotH=max(dot(n,h),0.0);let vDotH=max(dot(v,h),0.0);let f=fresnelSchlick(vDotH,f0);let d=distributionGGX(nDotH,roughness);let g=geometrySmith(nDotV,nDotL,roughness);let specular=f*(d*g/max(4.0*nDotV*nDotL,0.0001));let kd=(vec3<f32>(1.0)-f)*(1.0-metallic);let diffuse=kd*baseColor.rgb/PI;let coatF=fresnelSchlick(vDotH,vec3<f32>(0.04));let coatD=distributionGGX(nDotH,clearcoatRoughness);let coatG=geometrySmith(nDotV,nDotL,clearcoatRoughness);let coat=coatF*(coatD*coatG/max(4.0*nDotV*nDotL,0.0001))*clearcoat;let shadowed=directional&&light.params.z>0.5;let visibility=select(1.0,shadowVisibility(worldPosition),shadowed);direct=direct+(diffuse+specular+coat)*light.colorIntensity.rgb*light.colorIntensity.a*nDotL*attenuation*visibility;}
   let ambient=baseColor.rgb*camera.ambient.rgb*camera.ambient.a*ao;
   let shadedColor=environmentDiffuse+environmentSpecular+ambient+direct+lightmapSample.rgb*baseColor.rgb*material.lightmap.x*ao+material.emissive.rgb*emissiveSample.rgb*emissiveStrength;var output:SpatialFragmentOut;output.color=vec4<f32>(shadedColor,opacity);output.depth=fragPosition.z;output.reactive=vec4<f32>(reactive,0.0,0.0,1.0);output.velocity=vec4<f32>(motion,1.0);return output;
 }`;
  var VSR_SPATIAL_OIT_FRAGMENT_WGSL_V04 = VSR_SPATIAL_FRAGMENT_WGSL_V04.replace("struct SpatialFragmentOut { @location(0) color:vec4<f32>, @location(1) depth:f32, @location(2) reactive:vec4<f32>, @location(3) velocity:vec4<f32> };", "struct SpatialOITFragmentOut { @location(0) accum:vec4<f32>, @location(1) reveal:vec4<f32>, @location(2) reactive:vec4<f32>, @location(3) velocity:vec4<f32> };").replace(")->SpatialFragmentOut{", ")->SpatialOITFragmentOut{").replace("var output:SpatialFragmentOut;output.color=vec4<f32>(shadedColor,opacity);output.depth=fragPosition.z;output.reactive=vec4<f32>(reactive,0.0,0.0,1.0);output.velocity=vec4<f32>(motion,1.0);return output;", "var output:SpatialOITFragmentOut;let weight=clamp(0.03/(0.00001+pow(fragPosition.z,4.0)),0.01,3000.0);output.accum=vec4<f32>(shadedColor*opacity*weight,opacity*weight);output.reveal=vec4<f32>(0.0,0.0,0.0,opacity);output.reactive=vec4<f32>(reactive*opacity,0.0,0.0,1.0);output.velocity=vec4<f32>(motion*opacity*weight,opacity*weight);return output;");

  // packages/gltf-asset/src/index.ts
  var VSR_GLTF_ASSET_VERSION = "0.2.0-alpha.1";
  var VSR_GLTF_IMPORT_FORMAT = "vsr.gltf-import-receipt.v0.2";
  var GLB_MAGIC = 1179937895;
  var GLB_VERSION = 2;
  var GLB_JSON_CHUNK = 1313821514;
  var GLB_BIN_CHUNK = 5130562;
  var componentSize = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  var componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  var readComponent = (view, offset, type) => {
    if (type === 5120) return view.getInt8(offset);
    if (type === 5121) return view.getUint8(offset);
    if (type === 5122) return view.getInt16(offset, true);
    if (type === 5123) return view.getUint16(offset, true);
    if (type === 5125) return view.getUint32(offset, true);
    if (type === 5126) return view.getFloat32(offset, true);
    throw new Error(`Unsupported glTF componentType ${type}.`);
  };
  function decodeDataUri(uri) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(uri);
    if (!match) throw new Error("Invalid data URI.");
    if (!match[2]) return new TextEncoder().encode(decodeURIComponent(match[3] ?? ""));
    const text = match[3] ?? "", decode = globalThis.atob;
    if (decode) {
      const binary = decode(text), bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
      return bytes;
    }
    return Uint8Array.from(Buffer.from(text, "base64"));
  }
  function loadBuffers(gltf, options) {
    return (gltf.buffers ?? []).map((buffer, index) => {
      if (typeof buffer.uri === "string") {
        if (buffer.uri.startsWith("data:")) return decodeDataUri(buffer.uri);
        const value2 = options.buffers?.[buffer.uri];
        if (value2) return value2;
        throw new Error(`Missing external glTF buffer ${buffer.uri}.`);
      }
      const value = options.buffers?.[`buffer:${index}`];
      if (value) return value;
      throw new Error(`Missing binary glTF buffer ${index}.`);
    });
  }
  function imageBytes(gltf, imageIndex, buffers, options) {
    const image = gltf.images?.[imageIndex];
    if (typeof image?.uri === "string") {
      if (image.uri.startsWith("data:")) return decodeDataUri(image.uri);
      const external = options.imageBytes?.[image.uri];
      if (external) return external;
    }
    if (image?.bufferView !== void 0) {
      const view = gltf.bufferViews?.[image.bufferView], buffer = buffers[view?.buffer];
      if (!view || !buffer) throw new Error(`Missing glTF image bufferView ${String(image.bufferView)}.`);
      const start = view.byteOffset ?? 0, end = start + (view.byteLength ?? 0);
      if (start < 0 || end > buffer.byteLength) throw new Error(`glTF image bufferView ${String(image.bufferView)} exceeds its buffer.`);
      return buffer.slice(start, end);
    }
    return void 0;
  }
  function parseGlb(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 12) throw new Error("Invalid GLB: header is truncated.");
    if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Invalid GLB: magic does not match glTF.");
    if (view.getUint32(4, true) !== GLB_VERSION) throw new Error(`Unsupported GLB version ${view.getUint32(4, true)}.`);
    const declaredLength = view.getUint32(8, true);
    if (declaredLength !== bytes.byteLength) throw new Error(`Invalid GLB: declared length ${declaredLength} does not match ${bytes.byteLength}.`);
    let offset = 12, jsonText = "", binaryChunk;
    while (offset < declaredLength) {
      if (offset + 8 > declaredLength) throw new Error("Invalid GLB: chunk header is truncated.");
      const chunkLength = view.getUint32(offset, true), chunkType = view.getUint32(offset + 4, true), chunkStart = offset + 8, chunkEnd = chunkStart + chunkLength;
      if (chunkEnd > declaredLength) throw new Error("Invalid GLB: chunk exceeds declared length.");
      if (chunkType === GLB_JSON_CHUNK) {
        if (jsonText) throw new Error("Invalid GLB: multiple JSON chunks are not supported.");
        if (offset !== 12) throw new Error("Invalid GLB: JSON chunk must be first.");
        jsonText = new TextDecoder().decode(bytes.subarray(chunkStart, chunkEnd)).replace(/\u0000+$/, "").trim();
      } else if (chunkType === GLB_BIN_CHUNK) {
        if (binaryChunk) throw new Error("Invalid GLB: multiple BIN chunks are not supported.");
        binaryChunk = bytes.slice(chunkStart, chunkEnd);
      }
      offset = chunkEnd;
    }
    if (!jsonText) throw new Error("Invalid GLB: JSON chunk is missing.");
    let gltf;
    try {
      gltf = JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Invalid GLB JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { gltf, binaryChunk };
  }
  function normalizedComponent(value, componentType) {
    if (componentType === 5121) return value / 255;
    if (componentType === 5123) return value / 65535;
    if (componentType === 5125) return value / 4294967295;
    if (componentType === 5120) return Math.max(value / 127, -1);
    if (componentType === 5122) return Math.max(value / 32767, -1);
    return value;
  }
  function readAccessorData(gltf, buffers, bufferView, count, type, componentType, byteOffset = 0, normalized = false) {
    const components = componentCount[type], size = componentSize[componentType];
    if (!components || !size) throw new Error(`Unsupported accessor layout ${type}/${componentType}.`);
    if (!bufferView) return new Array(count * components).fill(0);
    const buffer = buffers[bufferView.buffer];
    if (!buffer) throw new Error(`Missing glTF buffer ${bufferView.buffer}.`);
    const stride = bufferView.byteStride ?? components * size, base = (bufferView.byteOffset ?? 0) + byteOffset, view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength), values = [];
    for (let item = 0; item < count; item++) for (let component = 0; component < components; component++) {
      const value = readComponent(view, base + item * stride + component * size, componentType);
      values.push(normalized ? normalizedComponent(value, componentType) : value);
    }
    return values;
  }
  function accessorValues(gltf, buffers, index) {
    const accessor = gltf.accessors?.[index];
    if (!accessor) throw new Error(`Missing glTF accessor ${index}.`);
    const components = componentCount[accessor.type];
    if (!components) throw new Error(`Unsupported glTF accessor type ${accessor.type}.`);
    const values = readAccessorData(gltf, buffers, gltf.bufferViews?.[accessor.bufferView], accessor.count, accessor.type, accessor.componentType, accessor.byteOffset ?? 0, Boolean(accessor.normalized)), sparse = accessor.sparse;
    if (!sparse) return values;
    const sparseIndicesView = gltf.bufferViews?.[sparse.indices?.bufferView], sparseValuesView = gltf.bufferViews?.[sparse.values?.bufferView], sparseCount = Number(sparse.count ?? 0), indexType = Number(sparse.indices?.componentType);
    if (!sparseIndicesView || !sparseValuesView || !sparseCount) throw new Error(`Accessor ${index} sparse declaration is incomplete.`);
    const sparseIndices = readAccessorData(gltf, buffers, sparseIndicesView, sparseCount, "SCALAR", indexType, sparse.indices.byteOffset ?? 0), sparseValues = readAccessorData(gltf, buffers, sparseValuesView, sparseCount, accessor.type, accessor.componentType, sparse.values.byteOffset ?? 0, Boolean(accessor.normalized));
    for (let item = 0; item < sparseCount; item++) {
      const target = Math.trunc(sparseIndices[item]);
      if (target < 0 || target >= accessor.count) throw new Error(`Accessor ${index} sparse index ${target} is out of range.`);
      for (let component = 0; component < components; component++) values[target * components + component] = sparseValues[item * components + component];
    }
    return values;
  }
  var colorHex = (value, fallback = "#ffffff") => {
    if (!value) return fallback;
    const c = value.map((entry, index) => Math.max(0, Math.min(255, Math.round((index === 3 ? entry : Math.pow(entry, 1 / 2.2)) * 255))));
    return `#${c.slice(0, 4).map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };
  function quaternionValue(q) {
    if (!q) return void 0;
    return [q[0] ?? 0, q[1] ?? 0, q[2] ?? 0, q[3] ?? 1];
  }
  function matrixValue(matrix) {
    if (!matrix || matrix.length !== 16) return void 0;
    return [matrix[0], matrix[4], matrix[8], matrix[12], matrix[1], matrix[5], matrix[9], matrix[13], matrix[2], matrix[6], matrix[10], matrix[14], matrix[3], matrix[7], matrix[11], matrix[15]];
  }
  function textureSampling(sampler) {
    return { wrapU: sampler.wrapS === 33071 ? "clamp" : "repeat", wrapV: sampler.wrapT === 33071 ? "clamp" : "repeat", filter: sampler.magFilter === 9728 || sampler.minFilter === 9728 ? "nearest" : "linear" };
  }
  function resolveGltfTextureSource(texture) {
    const candidates = [["KHR_texture_basisu", texture.extensions?.KHR_texture_basisu?.source], ["EXT_texture_webp", texture.extensions?.EXT_texture_webp?.source], ["source", texture.source]];
    for (const [kind, value] of candidates) if (Number.isInteger(value) && Number(value) >= 0) return { imageIndex: Number(value), kind };
    return void 0;
  }
  function textureFromImage(gltf, imageIndex, id, warnings, sampler = {}, resolver) {
    const image = gltf.images?.[imageIndex];
    const resolved = resolver?.({ imageIndex, image, id, sampler });
    if (resolved) return { ...resolved, id };
    const raw = image?.extras?.vsrRGBA;
    if (raw && Number.isInteger(raw.width) && Number.isInteger(raw.height) && Array.isArray(raw.pixels)) return { id, width: raw.width, height: raw.height, pixels: raw.pixels, colorSpace: raw.colorSpace ?? "srgb", ...textureSampling(sampler) };
    warnings.push(`image:${imageIndex}:encoded-image-preserved-without-decoder`);
    return void 0;
  }
  var KTX2_IDENTIFIER = [171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10];
  function decodeKtx2ToSpatialTexture(input, id = "texture:ktx2") {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 104 || !KTX2_IDENTIFIER.every((value, index) => bytes[index] === value)) throw new Error("Invalid KTX2 identifier.");
    const vkFormat = view.getUint32(12, true), typeSize = view.getUint32(16, true), width = view.getUint32(20, true), height = view.getUint32(24, true), depth = view.getUint32(28, true), layers = view.getUint32(32, true), faces = view.getUint32(36, true), levelCount = Math.max(1, view.getUint32(40, true)), supercompression = view.getUint32(44, true);
    if (!width || !height || depth > 1 || layers > 1 || faces !== 1 || typeSize !== 1) throw new Error("Unsupported KTX2 dimensions or texel type.");
    if (vkFormat !== 37 && vkFormat !== 43) throw new Error(`KTX2 format ${vkFormat} requires a BasisU or host transcoder.`);
    if (supercompression !== 0) throw new Error(`KTX2 supercompression ${supercompression} requires a BasisU or host transcoder.`);
    const levels = [];
    for (let level = 0; level < levelCount; level++) {
      const entry = 80 + level * 24;
      if (entry + 24 > bytes.byteLength) throw new Error("KTX2 level index is truncated.");
      const offset = Number(view.getBigUint64(entry, true)), length = Number(view.getBigUint64(entry + 8, true)), expectedWidth = Math.max(1, width >> level), expectedHeight = Math.max(1, height >> level), expectedLength = expectedWidth * expectedHeight * 4;
      if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < expectedLength || offset + expectedLength > bytes.byteLength) throw new Error(`KTX2 level ${level} payload is truncated.`);
      levels.push({ width: expectedWidth, height: expectedHeight, pixels: Array.from(bytes.subarray(offset, offset + expectedLength)), colorSpace: vkFormat === 43 ? "srgb" : "linear", filter: "linear" });
    }
    const [base, ...mipmaps] = levels;
    return { id, width: base.width, height: base.height, pixels: base.pixels, colorSpace: base.colorSpace, mipmaps: mipmaps.length ? mipmaps : void 0, filter: "linear", wrapU: "repeat", wrapV: "repeat" };
  }
  async function decodeGltfImageToSpatialTexture(input) {
    if (input.mimeType === "image/ktx2" || input.image?.mimeType === "image/ktx2") return decodeKtx2ToSpatialTexture(input.bytes, input.id);
    if (typeof Blob !== "function" || typeof createImageBitmap !== "function") throw new Error("glTF image decoding requires Blob and createImageBitmap.");
    const bytes = input.bytes.slice().buffer, blob = new Blob([bytes], { type: input.mimeType ?? input.image?.mimeType ?? "application/octet-stream" }), bitmap = await createImageBitmap(blob);
    try {
      const canvas = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(bitmap.width, bitmap.height) : (() => {
        if (typeof document === "undefined") throw new Error("glTF image decoding requires OffscreenCanvas or document.");
        const element = document.createElement("canvas");
        element.width = bitmap.width;
        element.height = bitmap.height;
        return element;
      })();
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("glTF image decoder could not create a 2D context.");
      context.drawImage(bitmap, 0, 0);
      const pixels = Array.from(context.getImageData(0, 0, bitmap.width, bitmap.height).data);
      return { id: input.id, width: bitmap.width, height: bitmap.height, pixels, ...textureSampling(input.sampler) };
    } finally {
      bitmap.close();
    }
  }
  function importGltfToSpatialScene(gltf, options = {}) {
    if (gltf.asset?.version !== "2.0") throw new Error(`Unsupported glTF version ${String(gltf.asset?.version)}.`);
    const buffers = loadBuffers(gltf, options), warnings = [], textures = [], textureIds = /* @__PURE__ */ new Map();
    for (let index = 0; index < (gltf.textures ?? []).length; index++) {
      const texture = gltf.textures[index], source = resolveGltfTextureSource(texture), id = `texture:gltf:${index}`;
      if (!source) {
        warnings.push(`texture:${index}:missing-image-source`);
        continue;
      }
      const loaded = textureFromImage(gltf, source.imageIndex, id, warnings, gltf.samplers?.[texture.sampler] ?? {}, options.imageResolver);
      if (loaded) {
        textures.push(loaded);
        textureIds.set(index, id);
      }
    }
    const materials = (gltf.materials ?? []).map((material, index) => {
      const pbr = material.pbrMetallicRoughness ?? {};
      return {
        id: `material:gltf:${index}`,
        baseColor: colorHex(pbr.baseColorFactor, "#ffffff"),
        metallic: pbr.metallicFactor ?? 1,
        roughness: pbr.roughnessFactor ?? 1,
        emissive: colorHex([...material.emissiveFactor ?? [0, 0, 0], 1], "#000000"),
        emissiveStrength: material.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1,
        clearcoat: material.extensions?.KHR_materials_clearcoat?.clearcoatFactor ?? 0,
        clearcoatRoughness: material.extensions?.KHR_materials_clearcoat?.clearcoatRoughnessFactor ?? 0.12,
        ior: material.extensions?.KHR_materials_ior?.ior ?? 1.5,
        doubleSided: material.doubleSided ?? false,
        opacity: pbr.baseColorFactor?.[3] ?? 1,
        baseColorTextureId: textureIds.get(pbr.baseColorTexture?.index),
        metallicRoughnessTextureId: textureIds.get(pbr.metallicRoughnessTexture?.index),
        normalTextureId: textureIds.get(material.normalTexture?.index),
        normalScale: material.normalTexture?.scale ?? 1,
        occlusionTextureId: textureIds.get(material.occlusionTexture?.index),
        occlusionStrength: material.occlusionTexture?.strength ?? 1,
        emissiveTextureId: textureIds.get(material.emissiveTexture?.index),
        alphaMode: material.alphaMode ?? "OPAQUE",
        alphaCutoff: material.alphaCutoff ?? 0.5
      };
    });
    if (!materials.length) materials.push({ id: "material:gltf:default" });
    const skins = (gltf.skins ?? []).map((skin, index) => {
      const joints = (skin.joints ?? []).map((joint) => `node:gltf:${joint}`), flat = skin.inverseBindMatrices === void 0 ? [] : accessorValues(gltf, buffers, skin.inverseBindMatrices), inverseBindMatrices = joints.map((_, jointIndex) => flat.length ? matrixValue(flat.slice(jointIndex * 16, jointIndex * 16 + 16)) ?? identityMat4() : identityMat4());
      return { id: `skin:gltf:${index}`, joints, inverseBindMatrices };
    });
    const meshes = [], primitiveMaterial = /* @__PURE__ */ new Map();
    for (let meshIndex = 0; meshIndex < (gltf.meshes ?? []).length; meshIndex++) for (let primitiveIndex = 0; primitiveIndex < (gltf.meshes[meshIndex].primitives ?? []).length; primitiveIndex++) {
      const primitive = gltf.meshes[meshIndex].primitives[primitiveIndex];
      if ((primitive.mode ?? 4) !== 4) throw new Error("Only glTF TRIANGLES primitives are supported.");
      const id = `mesh:gltf:${meshIndex}:${primitiveIndex}`, positions = accessorValues(gltf, buffers, primitive.attributes.POSITION), normals = primitive.attributes.NORMAL === void 0 ? void 0 : accessorValues(gltf, buffers, primitive.attributes.NORMAL), uvs = primitive.attributes.TEXCOORD_0 === void 0 ? void 0 : accessorValues(gltf, buffers, primitive.attributes.TEXCOORD_0), uvs1 = primitive.attributes.TEXCOORD_1 === void 0 ? void 0 : accessorValues(gltf, buffers, primitive.attributes.TEXCOORD_1), indices = primitive.indices === void 0 ? Array.from({ length: positions.length / 3 }, (_, i) => i) : accessorValues(gltf, buffers, primitive.indices).map(Math.trunc), jointIndices = primitive.attributes.JOINTS_0 === void 0 ? void 0 : accessorValues(gltf, buffers, primitive.attributes.JOINTS_0).map(Math.trunc), jointWeights = primitive.attributes.WEIGHTS_0 === void 0 ? void 0 : accessorValues(gltf, buffers, primitive.attributes.WEIGHTS_0), morphTargets = (primitive.targets ?? []).map((target, targetIndex) => ({ id: `morph:gltf:${meshIndex}:${primitiveIndex}:${targetIndex}`, positions: target.POSITION === void 0 ? new Array(positions.length).fill(0) : accessorValues(gltf, buffers, target.POSITION), normals: target.NORMAL === void 0 ? void 0 : accessorValues(gltf, buffers, target.NORMAL), defaultWeight: gltf.meshes[meshIndex].weights?.[targetIndex] ?? 0 }));
      meshes.push({ id, positions, normals, uvs, uvs1, indices, jointIndices, jointWeights, morphTargets: morphTargets.length ? morphTargets : void 0 });
      primitiveMaterial.set(id, `material:gltf:${primitive.material ?? 0}`);
    }
    const nodes = [];
    for (let nodeIndex = 0; nodeIndex < (gltf.nodes ?? []).length; nodeIndex++) {
      const node = gltf.nodes[nodeIndex], base2 = { id: `node:gltf:${nodeIndex}`, transform: { ...matrixValue(node.matrix) ? { matrix: matrixValue(node.matrix) } : {}, translation: node.translation, rotationQuaternion: quaternionValue(node.rotation), scale: node.scale } }, skinId = node.skin === void 0 ? void 0 : `skin:gltf:${node.skin}`, morphWeights = node.weights;
      const primitives = node.mesh === void 0 ? [] : gltf.meshes[node.mesh]?.primitives ?? [];
      if (primitives.length <= 1) {
        const meshId = node.mesh === void 0 ? void 0 : `mesh:gltf:${node.mesh}:0`;
        nodes.push({ ...base2, meshId, materialId: meshId ? primitiveMaterial.get(meshId) : void 0, skinId, morphWeights });
      } else {
        nodes.push({ ...base2, skinId, morphWeights });
        for (let p = 0; p < primitives.length; p++) {
          const meshId = `mesh:gltf:${node.mesh}:${p}`;
          nodes.push({ id: `node:gltf:${nodeIndex}:primitive:${p}`, parentId: base2.id, meshId, materialId: primitiveMaterial.get(meshId), skinId, morphWeights });
        }
      }
    }
    for (let parent = 0; parent < (gltf.nodes ?? []).length; parent++) for (const child of gltf.nodes[parent].children ?? []) {
      const target = nodes.find((node) => node.id === `node:gltf:${child}`);
      if (target) target.parentId = `node:gltf:${parent}`;
    }
    const cameras = (gltf.cameras ?? []).map((camera, index) => {
      const nodeIndex = (gltf.nodes ?? []).findIndex((node2) => node2.camera === index), node = gltf.nodes?.[nodeIndex] ?? {};
      return { id: `camera:gltf:${index}`, projection: camera.type === "orthographic" ? "orthographic" : "perspective", fovYDeg: camera.perspective?.yfov === void 0 ? void 0 : camera.perspective.yfov * 180 / Math.PI, orthoHeight: camera.orthographic?.ymag === void 0 ? void 0 : camera.orthographic.ymag * 2, near: camera.perspective?.znear ?? camera.orthographic?.znear ?? 0.1, far: camera.perspective?.zfar ?? camera.orthographic?.zfar ?? 1e3, transform: { translation: node.translation, rotationQuaternion: quaternionValue(node.rotation), scale: node.scale } };
    });
    if (!cameras.length && options.defaultCamera !== false) cameras.push({ id: "camera:gltf:default", projection: "perspective", fovYDeg: 55, near: 0.1, far: 1e3, transform: { translation: [0, 1.5, 5] } });
    const punctual = gltf.extensions?.KHR_lights_punctual?.lights ?? [], lights = [{ id: "light:gltf:ambient", kind: "ambient", color: "#ffffff", intensity: 0.12 }];
    for (let nodeIndex = 0; nodeIndex < (gltf.nodes ?? []).length; nodeIndex++) {
      const node = gltf.nodes[nodeIndex], lightIndex = node.extensions?.KHR_lights_punctual?.light;
      if (lightIndex === void 0) continue;
      const light = punctual[lightIndex] ?? {}, kind = light.type === "directional" ? "directional" : "point";
      lights.push({ id: `light:gltf:${lightIndex}`, kind, color: colorHex([...light.color ?? [1, 1, 1], 1]), intensity: light.intensity ?? 1, range: light.range, position: node.translation, direction: kind === "directional" ? [0, -1, 0] : void 0, castShadow: true });
    }
    const animations = (gltf.animations ?? []).map((animation, animationIndex) => {
      const channels = [];
      let duration = 0;
      for (const channel of animation.channels ?? []) {
        const sampler = animation.samplers[channel.sampler], times = accessorValues(gltf, buffers, sampler.input), flat = accessorValues(gltf, buffers, sampler.output), path = channel.target.path === "rotation" ? "rotationQuaternion" : channel.target.path;
        if (!["translation", "rotationQuaternion", "scale"].includes(path)) {
          warnings.push(`animation:${animationIndex}:unsupported-path:${path}`);
          continue;
        }
        const dimension = path === "rotationQuaternion" ? 4 : 3, interpolation = sampler.interpolation === "STEP" ? "STEP" : sampler.interpolation === "CUBICSPLINE" ? "CUBICSPLINE" : "LINEAR", values = [], inTangents = [], outTangents = [], valueOf = (raw) => dimension === 4 ? raw : raw;
        if (interpolation === "CUBICSPLINE") {
          const stride = dimension * 3;
          if (flat.length !== times.length * stride) {
            warnings.push(`animation:${animationIndex}:invalid-cubic-output:${channel.target.path}`);
            continue;
          }
          for (let index = 0; index < times.length; index++) {
            const base2 = index * stride;
            inTangents.push(valueOf(flat.slice(base2, base2 + dimension)));
            values.push(valueOf(flat.slice(base2 + dimension, base2 + dimension * 2)));
            outTangents.push(valueOf(flat.slice(base2 + dimension * 2, base2 + stride)));
          }
        } else {
          if (flat.length !== times.length * dimension) {
            warnings.push(`animation:${animationIndex}:invalid-output:${channel.target.path}`);
            continue;
          }
          for (let index = 0; index < times.length; index++) values.push(valueOf(flat.slice(index * dimension, index * dimension + dimension)));
        }
        duration = Math.max(duration, ...times);
        channels.push({ nodeId: `node:gltf:${channel.target.node}`, path, times, values, interpolation, ...interpolation === "CUBICSPLINE" ? { inTangents, outTangents } : {} });
      }
      return { id: `animation:gltf:${animationIndex}`, duration, channels };
    });
    const sourceRoot = options.sourceRoot ?? cryptographicHash(gltf), sceneId = options.sceneId ?? `gltf:${sourceRoot.slice(0, 16)}`, scene = { format: VSR_SPATIAL_SCENE_FORMAT, sceneId, title: options.title ?? gltf.scene?.name ?? "glTF 2.0 Asset", activeCameraId: cameras[0].id, meshes, materials, textures, animations, skins, nodes, cameras, lights, reality: { worldId: `world:${sceneId}`, realityRoot: cryptographicHash({ asset: gltf.asset, scene: gltf.scene, nodes: gltf.nodes, sourceRoot }) } };
    const materialTextureBindingCount = materials.reduce((sum, material) => sum + [material.baseColorTextureId, material.metallicRoughnessTextureId, material.normalTextureId, material.occlusionTextureId, material.emissiveTextureId].filter(Boolean).length, 0), morphTargetCount = meshes.reduce((sum, mesh) => sum + (mesh.morphTargets?.length ?? 0), 0), base = { format: VSR_GLTF_IMPORT_FORMAT, assetVersion: VSR_GLTF_ASSET_VERSION, sceneId, meshCount: meshes.length, nodeCount: nodes.length, materialCount: materials.length, textureCount: textures.length, materialTextureBindingCount, animationCount: animations.length, skinCount: skins.length, morphTargetCount, sourceRoot, sceneRoot: cryptographicHash(scene), warnings };
    return { scene, receipt: { ...base, receiptRoot: cryptographicHash(base) } };
  }
  function importGlbToSpatialScene(input, options = {}) {
    const parsed = parseGlb(input), buffers = { ...options.buffers ?? {} };
    if (parsed.binaryChunk && !buffers["buffer:0"]) buffers["buffer:0"] = parsed.binaryChunk;
    const binaryRoot = parsed.binaryChunk ? cryptographicHash([...parsed.binaryChunk]) : cryptographicHash([]), sourceRoot = options.sourceRoot ?? cryptographicHash({ gltf: parsed.gltf, binaryRoot });
    return importGltfToSpatialScene(parsed.gltf, { ...options, buffers, sourceRoot });
  }
  async function importGltfToSpatialSceneAsync(gltf, options = {}) {
    const buffers = loadBuffers(gltf, options), decoded = /* @__PURE__ */ new Map(), imageRoots = [];
    if (options.imageDecoder) for (const texture of gltf.textures ?? []) {
      const source = resolveGltfTextureSource(texture);
      if (!source || !Number.isInteger(source.imageIndex) || decoded.has(source.imageIndex)) continue;
      const imageIndex = source.imageIndex, image = gltf.images?.[imageIndex], bytes = imageBytes(gltf, imageIndex, buffers, options);
      if (!image || !bytes) continue;
      const id = `texture:gltf:${imageIndex}`, sampler = gltf.samplers?.[texture.sampler] ?? {}, resolved = await options.imageDecoder({ imageIndex, image, id, sampler, bytes, mimeType: image.mimeType });
      if (resolved) {
        decoded.set(imageIndex, resolved);
        imageRoots.push([imageIndex, cryptographicHash([...bytes])]);
      }
    }
    const sourceRoot = options.sourceRoot ?? (imageRoots.length ? cryptographicHash({ gltf, imageRoots }) : cryptographicHash(gltf));
    return importGltfToSpatialScene(gltf, { ...options, sourceRoot, imageResolver: (input) => decoded.get(input.imageIndex) ?? options.imageResolver?.(input) });
  }
  async function importGlbToSpatialSceneAsync(input, options = {}) {
    const parsed = parseGlb(input), buffers = { ...options.buffers ?? {} };
    if (parsed.binaryChunk && !buffers["buffer:0"]) buffers["buffer:0"] = parsed.binaryChunk;
    const binaryRoot = parsed.binaryChunk ? cryptographicHash([...parsed.binaryChunk]) : cryptographicHash([]), sourceRoot = options.sourceRoot ?? cryptographicHash({ gltf: parsed.gltf, binaryRoot });
    return importGltfToSpatialSceneAsync(parsed.gltf, { ...options, buffers, sourceRoot });
  }
  function verifyGltfImportReceipt(receipt) {
    const { receiptRoot, ...base } = receipt;
    return cryptographicHash(base) === receiptRoot;
  }
  return __toCommonJS(index_exports);
})();
