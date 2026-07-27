/* Browser-only VSR executor. Keep this entry free of compiler and Node imports. */

export const VSR_REALTIME_WEBGPU_VERSION = '0.3.0-alpha.1';
export const VSR_REALTIME_WEBGPU_FORMAT = 'vsr.realtime-webgpu-frame.v0.3' as const;
const SOURCE_VERTEX_STRIDE = 11;
const TILE_LIGHT_CAPACITY = 16;
const TILE_RECORD_STRIDE = 1 + TILE_LIGHT_CAPACITY;
const PARTICLE_STRIDE = 12;

type RGBA = [number, number, number, number];
type VSRWebGPUBlendMode = 'normal' | 'additive';

export type VSRGPUExecutionMode = 'webgpu' | 'canvas-fallback' | 'plan-only';

export interface VSRGPUAtlasRegion {
  textureId: string; x: number; y: number; width: number; height: number;
  u0: number; v0: number; u1: number; v1: number; textureHash: string;
}
export interface VSRGPUTextureAtlasPlan {
  width: number; height: number; padding: number; data: Uint8Array;
  regions: VSRGPUAtlasRegion[]; atlasRoot: string;
}
export interface VSRGPUDrawPacket {
  id: string; pipeline: 'solid' | 'textured'; blendMode: VSRWebGPUBlendMode;
  sampling: 'linear' | 'nearest'; firstVertex: number; vertexCount: number;
  orderMin: number; orderMax: number; nodeIds: string[];
  scissor?: { x: number; y: number; width: number; height: number };
}
export interface VSRGPULightRecord {
  id: string; kind: 'ambient' | 'directional' | 'point'; kindCode: number;
  x: number; y: number; radius: number; color: RGBA; intensity: number;
  directionX: number; directionY: number; castsShadow: boolean;
}
export interface VSRGPUParticleSeed {
  id: string; x: number; y: number; vx: number; vy: number; life: number;
  maxLife: number; size: number; color: RGBA; seed: number;
}
export interface VSRGPUExecutionPass {
  id: string; kind: 'upload' | 'light-cull' | 'particle-sim' | 'scene' | 'particle-render' | 'postprocess' | 'evidence';
  enabled: boolean; dependsOn: string[]; reason?: string;
}
export interface VSRRealtimeGPUStats {
  sourceCommands: number; drawPackets: number; vertices: number; atlasTextures: number; atlasBytes: number;
  lights: number; lightTiles: number; particleSeeds: number; enabledPasses: number; estimatedDrawCalls: number;
}
export interface VSRRealtimeGPUFramePlan {
  format: typeof VSR_REALTIME_WEBGPU_FORMAT; version: string; sourceDisplayHash: string;
  visualPlanRoot: string; visualEvidenceRoot: string;
  viewport: { width: number; height: number; renderWidth: number; renderHeight: number; dpr: number };
  quality: string; atlas: VSRGPUTextureAtlasPlan; vertexData: Float32Array; drawPackets: VSRGPUDrawPacket[];
  lights: VSRGPULightRecord[]; lightData: Float32Array; tileData: Uint32Array;
  tileSize: number; tilesX: number; tilesY: number; particleSeeds: VSRGPUParticleSeed[];
  particleData: Float32Array; passes: VSRGPUExecutionPass[];
  shaders: { id: string; stage: 'vertex-fragment' | 'compute'; source: string; sourceRoot: string }[];
  stats: VSRRealtimeGPUStats; resourceRoot: string; commandRoot: string; framePlanRoot: string;
}
export interface VSRSerializedRealtimeGPUFrame {
  format: typeof VSR_REALTIME_WEBGPU_FORMAT; version: string; sourceDisplayHash: string;
  visualPlanRoot: string; visualEvidenceRoot: string;
  viewport: VSRRealtimeGPUFramePlan['viewport']; quality: string;
  atlas: Omit<VSRGPUTextureAtlasPlan, 'data'> & { data?: number[]; data_base64?: string };
  vertex_data: number[]; light_data: number[]; tile_data: number[]; particle_data: number[];
  drawPackets: VSRGPUDrawPacket[]; lights: VSRGPULightRecord[]; tileSize: number; tilesX: number; tilesY: number;
  particleSeeds: VSRGPUParticleSeed[]; passes: VSRGPUExecutionPass[];
  shaders: VSRRealtimeGPUFramePlan['shaders']; stats: VSRRealtimeGPUStats;
  resourceRoot: string; commandRoot: string; framePlanRoot: string; transport_format?: string;
}
export type VSRRealtimeGPUFrameInput = VSRRealtimeGPUFramePlan | VSRSerializedRealtimeGPUFrame;
export interface VSRRealtimeGPUPlanVerification { ok: boolean; diagnostics: string[] }
export interface VSRRealtimeGPUFrameReceipt {
  format: 'vsr.realtime-webgpu-frame-receipt.v0.3'; version: string;
  mode: VSRGPUExecutionMode; frameIndex: number; sourceDisplayHash: string;
  framePlanRoot: string; resourceRoot: string; commandRoot: string; adapterName?: string;
  deviceLost: boolean; submitted: boolean; drawCalls: number; computePasses: number;
  compileMs: number; uploadMs: number; encodeMs: number; submitMs: number; receiptRoot: string;
}
export interface VSRRealtimeWebGPUExecutorOptions {
  powerPreference?: 'low-power' | 'high-performance'; requiredFeatures?: string[];
  alphaMode?: 'opaque' | 'premultiplied'; captureErrors?: boolean;
}
export interface VSRRealtimeWebGPUCapabilities {
  format: 'vsr.realtime-webgpu-capabilities.v0.3'; available: boolean; secureContext: boolean;
  adapterName?: string; features: string[]; limits: Record<string, number>; reason?: string;
}
export interface VSRRealtimeWebGPUCacheStats {
  pipelinesCreated: number; pipelineHits: number; buffersCreated: number; texturesCreated: number; atlasUploads: number;
}

function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot canonicalize non-finite number.');
    return Number(value.toFixed(9)).toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).filter(key => object[key] !== undefined).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
  }
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}

function sha256Bytes(bytes: Uint8Array): string {
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const message = new Uint8Array(paddedLength); message.set(bytes); message[bytes.length] = 0x80;
  const view = new DataView(message.buffer), high = Math.floor(bitLength / 0x100000000), low = bitLength >>> 0;
  view.setUint32(paddedLength - 8, high, false); view.setUint32(paddedLength - 4, low, false);
  const constants = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ]);
  const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), w = new Uint32Array(64);
  const rotr = (value: number, shift: number): number => (value >>> shift) | (value << (32 - shift));
  for (let offset = 0; offset < message.length; offset += 64) {
    for (let index = 0; index < 16; index++) w[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index++) {
      const s0 = rotr(w[index - 15]!, 7) ^ rotr(w[index - 15]!, 18) ^ (w[index - 15]! >>> 3);
      const s1 = rotr(w[index - 2]!, 17) ^ rotr(w[index - 2]!, 19) ^ (w[index - 2]! >>> 10);
      w[index] = (w[index - 16]! + s0 + w[index - 7]! + s1) >>> 0;
    }
    let a=h[0]!,b=h[1]!,c=h[2]!,d=h[3]!,e=h[4]!,f=h[5]!,g=h[6]!,hh=h[7]!;
    for (let index = 0; index < 64; index++) {
      const s1 = rotr(e,6)^rotr(e,11)^rotr(e,25), ch = (e&f)^((~e)&g), t1 = (hh+s1+ch+constants[index]!+w[index]!)>>>0;
      const s0 = rotr(a,2)^rotr(a,13)^rotr(a,22), maj = (a&b)^(a&c)^(b&c), t2 = (s0+maj)>>>0;
      hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    h[0]=(h[0]!+a)>>>0;h[1]=(h[1]!+b)>>>0;h[2]=(h[2]!+c)>>>0;h[3]=(h[3]!+d)>>>0;
    h[4]=(h[4]!+e)>>>0;h[5]=(h[5]!+f)>>>0;h[6]=(h[6]!+g)>>>0;h[7]=(h[7]!+hh)>>>0;
  }
  return [...h].map(value => value.toString(16).padStart(8, '0')).join('');
}
function cryptographicHash(value: unknown): string { return sha256Bytes(new TextEncoder().encode(canonicalize(value))); }
function bytesRoot(data: Uint8Array | Float32Array | Uint32Array): string { return sha256Bytes(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)); }
function now(): number { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
export function hashRealtimeWebGPUValue(value: unknown): string { return cryptographicHash(value); }

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value), output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) output[index] = binary.charCodeAt(index);
  return output;
}
function numericArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) throw new Error(`Serialized GPU frame field ${label} must be an array.`);
  return value.map(item => Number(item));
}
function toFloat32(value: unknown, label: string): Float32Array {
  if (value instanceof Float32Array) return value;
  return new Float32Array(numericArray(value, label));
}
function toUint32(value: unknown, label: string): Uint32Array {
  if (value instanceof Uint32Array) return value;
  return new Uint32Array(numericArray(value, label));
}

export function normalizeRealtimeWebGPUFrame(input: VSRRealtimeGPUFrameInput): VSRRealtimeGPUFramePlan {
  const candidate = input as VSRSerializedRealtimeGPUFrame & Partial<VSRRealtimeGPUFramePlan>;
  const atlas = candidate.atlas as VSRSerializedRealtimeGPUFrame['atlas'] & { data?: Uint8Array };
  const data = atlas.data instanceof Uint8Array ? atlas.data : atlas.data_base64 ? decodeBase64(atlas.data_base64) : new Uint8Array(numericArray(atlas.data, 'atlas.data'));
  const plan = {
    ...candidate,
    atlas: { ...atlas, data },
    vertexData: candidate.vertexData instanceof Float32Array ? candidate.vertexData : toFloat32((candidate as any).vertex_data, 'vertex_data'),
    lightData: candidate.lightData instanceof Float32Array ? candidate.lightData : toFloat32((candidate as any).light_data, 'light_data'),
    tileData: candidate.tileData instanceof Uint32Array ? candidate.tileData : toUint32((candidate as any).tile_data, 'tile_data'),
    particleData: candidate.particleData instanceof Float32Array ? candidate.particleData : toFloat32((candidate as any).particle_data, 'particle_data'),
  } as VSRRealtimeGPUFramePlan;
  const verification = verifyRealtimeWebGPUFrame(plan);
  if (!verification.ok) throw new Error(`Invalid serialized realtime GPU frame: ${verification.diagnostics.join(', ')}`);
  return plan;
}

export const VSR_SCENE_SHADER_V03 = `
struct Frame { resolution: vec2f, tileSize: f32, tilesX: u32, lightCount: u32, tilesY: u32, exposure: f32, bloom: f32, vignette: f32, time: f32, particleCount: u32, padding: u32 };
struct Light { a: vec4f, b: vec4f, c: vec4f };
struct VertexOut { @builtin(position) position: vec4f, @location(0) uv: vec2f, @location(1) color: vec4f, @location(2) params: vec3f };
@group(0) @binding(0) var atlasSampler: sampler;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var<uniform> frame: Frame;
@group(0) @binding(3) var<storage, read> lights: array<Light>;
@group(0) @binding(4) var<storage, read> tileLights: array<u32>;
@vertex fn vs_main(@location(0) position: vec2f,@location(1) uv: vec2f,@location(2) color: vec4f,@location(3) params: vec3f)->VertexOut{var out:VertexOut;out.position=vec4f(position,0.0,1.0);out.uv=uv;out.color=color;out.params=params;return out;}
fn shapeAlpha(in:VertexOut)->f32{let shape=in.params.x;if(shape>3.5){return textureSample(atlas,atlasSampler,in.uv).a;}if(shape>2.5){return textureSample(atlas,atlasSampler,in.uv).a;}if(shape>1.5){let p=in.uv*2.0-vec2f(1.0);if(dot(p,p)>1.0){return 0.0;}}else if(shape>0.5){let r=max(in.params.y,in.params.z);let q=abs(in.uv*2.0-vec2f(1.0))-(vec2f(1.0)-vec2f(r*2.0));if(length(max(q,vec2f(0.0)))>r*2.0){return 0.0;}}return 1.0;}
@fragment fn fs_main(in:VertexOut,@builtin(position) frag:vec4f)->@location(0) vec4f{let alpha=shapeAlpha(in);if(alpha<=0.001){discard;}var sampled=textureSample(atlas,atlasSampler,in.uv);if(in.params.x<2.5){sampled=vec4f(1.0);}var lightEnergy=vec3f(0.10);let tx=u32(clamp(floor(frag.x/frame.tileSize),0.0,f32(frame.tilesX-1u)));let ty=u32(clamp(floor(frag.y/frame.tileSize),0.0,f32(frame.tilesY-1u)));let base=(ty*frame.tilesX+tx)*17u;let count=min(tileLights[base],16u);for(var i=0u;i<count;i++){let li=tileLights[base+1u+i];if(li>=frame.lightCount){continue;}let l=lights[li];let kind=l.a.x;if(kind<0.5){lightEnergy+=l.b.rgb*l.b.a;}else if(kind<1.5){lightEnergy+=l.b.rgb*l.b.a*0.25;}else{let delta=frag.xy-l.a.yz;let radius=max(1.0,l.a.w);let attenuation=pow(max(0.0,1.0-length(delta)/radius),2.0);lightEnergy+=l.b.rgb*l.b.a*attenuation;}}let rgb=sampled.rgb*in.color.rgb*max(lightEnergy,vec3f(0.05));return vec4f(rgb,in.color.a*sampled.a*alpha);}`;
export const VSR_LIGHT_CULL_SHADER_V03 = `
struct Frame { resolution: vec2f, tileSize: f32, tilesX: u32, lightCount: u32, tilesY: u32, exposure: f32, bloom: f32, vignette: f32, time: f32, particleCount: u32, padding: u32 };
struct Light { a: vec4f, b: vec4f, c: vec4f };
@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<storage, read> lights: array<Light>;
@group(0) @binding(2) var<storage, read_write> tileLights: array<u32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) gid:vec3u){let tileIndex=gid.x;if(tileIndex>=frame.tilesX*frame.tilesY){return;}let tx=tileIndex%frame.tilesX;let ty=tileIndex/frame.tilesX;let minP=vec2f(f32(tx)*frame.tileSize,f32(ty)*frame.tileSize);let maxP=min(minP+vec2f(frame.tileSize),frame.resolution);let base=tileIndex*17u;var count=0u;for(var i=0u;i<frame.lightCount;i++){let l=lights[i];let kind=l.a.x;var include=kind<1.5;if(kind>=1.5){let center=l.a.yz;let nearest=clamp(center,minP,maxP);include=distance(center,nearest)<=l.a.w;}if(include&&count<16u){tileLights[base+1u+count]=i;count++;}}tileLights[base]=count;}`;
export const VSR_PARTICLE_COMPUTE_SHADER_V03 = `
struct Frame { resolution: vec2f, tileSize: f32, tilesX: u32, lightCount: u32, tilesY: u32, exposure: f32, bloom: f32, vignette: f32, time: f32, particleCount: u32, padding: u32 };
struct Particle { p0:vec4f,p1:vec4f,p2:vec4f };
@group(0) @binding(0) var<uniform> frame:Frame;
@group(0) @binding(1) var<storage,read_write> particles:array<Particle>;
@compute @workgroup_size(64) fn simulate(@builtin(global_invocation_id) gid:vec3u){let i=gid.x;if(i>=frame.particleCount){return;}var p=particles[i];let dt=1.0/60.0;p.p0.xy+=p.p0.zw*dt;p.p0.w+=18.0*dt;p.p1.x-=dt;if(p.p1.x<=0.0||p.p0.x<0.0||p.p0.x>frame.resolution.x||p.p0.y<0.0||p.p0.y>frame.resolution.y){let seed=fract(sin(f32(i)*91.17+p.p2.w)*43758.5453);p.p0.xy=vec2f(frame.resolution.x*0.5,frame.resolution.y*0.5);p.p0.zw=vec2f((seed-0.5)*80.0,-30.0-seed*60.0);p.p1.x=p.p1.y;}particles[i]=p;}`;
export const VSR_PARTICLE_RENDER_SHADER_V03 = `
struct Frame { resolution: vec2f, tileSize: f32, tilesX: u32, lightCount: u32, tilesY: u32, exposure: f32, bloom: f32, vignette: f32, time: f32, particleCount: u32, padding: u32 };
struct Particle { p0:vec4f,p1:vec4f,p2:vec4f };
@group(0) @binding(0) var<uniform> frame:Frame;
@group(0) @binding(1) var<storage,read> particles:array<Particle>;
struct Out{@builtin(position) position:vec4f,@location(0) color:vec4f};
@vertex fn vs_particle(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->Out{let corners=array<vec2f,6>(vec2f(-1.0,-1.0),vec2f(1.0,-1.0),vec2f(1.0,1.0),vec2f(-1.0,-1.0),vec2f(1.0,1.0),vec2f(-1.0,1.0));let p=particles[ii];let pixel=p.p0.xy+corners[vi]*p.p1.z;let clip=vec2f(pixel.x/frame.resolution.x*2.0-1.0,1.0-pixel.y/frame.resolution.y*2.0);var out:Out;out.position=vec4f(clip,0.0,1.0);out.color=vec4f(p.p1.w,p.p2.x,p.p2.y,p.p2.z*clamp(p.p1.x/max(0.001,p.p1.y),0.0,1.0));return out;}
@fragment fn fs_particle(in:Out)->@location(0) vec4f{return in.color;}`;
export const VSR_PARTICLE_SHADER_V03 = VSR_PARTICLE_COMPUTE_SHADER_V03 + '\n' + VSR_PARTICLE_RENDER_SHADER_V03;
export const VSR_POST_SHADER_V03 = `
struct Frame { resolution: vec2f, tileSize: f32, tilesX: u32, lightCount: u32, tilesY: u32, exposure: f32, bloom: f32, vignette: f32, time: f32, particleCount: u32, padding: u32 };
@group(0) @binding(0) var sceneSampler:sampler;
@group(0) @binding(1) var sceneTex:texture_2d<f32>;
@group(0) @binding(2) var<uniform> frame:Frame;
struct Out{@builtin(position) position:vec4f,@location(0) uv:vec2f};
@vertex fn vs_full(@builtin(vertex_index) i:u32)->Out{let pos=array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));var out:Out;out.position=vec4f(pos[i],0.0,1.0);out.uv=pos[i]*0.5+vec2f(0.5);return out;}
fn tone(v:vec3f)->vec3f{let x=v*exp2(frame.exposure);return clamp((x*(2.51*x+vec3f(0.03)))/(x*(2.43*x+vec3f(0.59))+vec3f(0.14)),vec3f(0.0),vec3f(1.0));}
@fragment fn fs_full(in:Out)->@location(0) vec4f{let texel=1.0/frame.resolution;var base=textureSample(sceneTex,sceneSampler,in.uv);var glow=vec3f(0.0);for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){let c=textureSample(sceneTex,sceneSampler,in.uv+vec2f(f32(x),f32(y))*texel*2.0).rgb;let lum=dot(c,vec3f(0.2126,0.7152,0.0722));glow+=c*max(0.0,lum-0.65);}}glow/=9.0;var rgb=tone(base.rgb+glow*frame.bloom);let d=distance(in.uv,vec2f(0.5))*1.414;rgb*=1.0-frame.vignette*smoothstep(0.45,1.0,d);return vec4f(pow(rgb,vec3f(1.0/2.2)),base.a);}`;

export function verifyRealtimeWebGPUFrame(plan: VSRRealtimeGPUFramePlan): VSRRealtimeGPUPlanVerification {
  const diagnostics: string[] = [];
  if (plan.format !== VSR_REALTIME_WEBGPU_FORMAT) diagnostics.push('format-mismatch');
  if (plan.vertexData.length % SOURCE_VERTEX_STRIDE !== 0) diagnostics.push('vertex-stride-mismatch');
  if (plan.tileData.length !== plan.tilesX * plan.tilesY * TILE_RECORD_STRIDE) diagnostics.push('tile-buffer-size-mismatch');
  if (plan.lightData.length !== plan.lights.length * 12) diagnostics.push('light-buffer-size-mismatch');
  if (plan.particleData.length !== plan.particleSeeds.length * PARTICLE_STRIDE) diagnostics.push('particle-buffer-size-mismatch');
  for (const packet of plan.drawPackets) if (packet.firstVertex < 0 || packet.vertexCount < 0 || packet.firstVertex + packet.vertexCount > plan.vertexData.length / SOURCE_VERTEX_STRIDE) diagnostics.push(`draw-range:${packet.id}`);
  const passIds = new Set(plan.passes.map(pass => pass.id));
  for (const pass of plan.passes) for (const dependency of pass.dependsOn) if (!passIds.has(dependency)) diagnostics.push(`missing-pass:${pass.id}:${dependency}`);
  const resourceRoot = cryptographicHash({ atlasRoot: plan.atlas.atlasRoot, vertexRoot: bytesRoot(plan.vertexData), lightRoot: bytesRoot(plan.lightData), tileRoot: bytesRoot(plan.tileData), particleRoot: bytesRoot(plan.particleData) });
  if (resourceRoot !== plan.resourceRoot) diagnostics.push('resource-root-mismatch');
  const commandRoot = cryptographicHash({ drawPackets: plan.drawPackets, passes: plan.passes, shaders: plan.shaders.map(({ id, stage, sourceRoot }) => ({ id, stage, sourceRoot })) });
  if (commandRoot !== plan.commandRoot) diagnostics.push('command-root-mismatch');
  const base = { format: plan.format, version: plan.version, sourceDisplayHash: plan.sourceDisplayHash, visualPlanRoot: plan.visualPlanRoot, visualEvidenceRoot: plan.visualEvidenceRoot, viewport: plan.viewport, quality: plan.quality, atlas: { width: plan.atlas.width, height: plan.atlas.height, padding: plan.atlas.padding, regions: plan.atlas.regions, atlasRoot: plan.atlas.atlasRoot }, drawPackets: plan.drawPackets, lights: plan.lights, tileSize: plan.tileSize, tilesX: plan.tilesX, tilesY: plan.tilesY, particleSeeds: plan.particleSeeds, passes: plan.passes, shaders: plan.shaders, stats: plan.stats, resourceRoot: plan.resourceRoot, commandRoot: plan.commandRoot };
  if (cryptographicHash(base) !== plan.framePlanRoot) diagnostics.push('frame-plan-root-mismatch');
  return { ok: diagnostics.length === 0, diagnostics };
}

export function probeRealtimeWebGPU(): VSRRealtimeWebGPUCapabilities {
  const secureContext = typeof window === 'undefined' || window.isSecureContext;
  const nav = (typeof navigator === 'undefined' ? {} : navigator) as Navigator & { gpu?: unknown };
  if (!nav.gpu) return { format: 'vsr.realtime-webgpu-capabilities.v0.3', available: false, secureContext, features: [], limits: {}, reason: 'navigator.gpu unavailable' };
  return { format: 'vsr.realtime-webgpu-capabilities.v0.3', available: true, secureContext, features: [], limits: {} };
}

const BUFFER_USAGE = { COPY_DST: 0x08, VERTEX: 0x20, UNIFORM: 0x40, STORAGE: 0x80 };
const TEXTURE_USAGE = { COPY_SRC: 0x01, COPY_DST: 0x02, TEXTURE_BINDING: 0x04, RENDER_ATTACHMENT: 0x10 };
function paddedRows(data: Uint8Array, width: number, height: number): { data: Uint8Array; bytesPerRow: number } { const row = width * 4, padded = Math.ceil(row / 256) * 256; if (row === padded) return { data, bytesPerRow: row }; const output = new Uint8Array(padded * height); for (let y = 0; y < height; y++) output.set(data.subarray(y * row, (y + 1) * row), y * padded); return { data: output, bytesPerRow: padded }; }
function frameUniformData(plan: VSRRealtimeGPUFramePlan, time: number): ArrayBuffer { const buffer = new ArrayBuffer(48), view = new DataView(buffer); view.setFloat32(0, plan.viewport.renderWidth, true); view.setFloat32(4, plan.viewport.renderHeight, true); view.setFloat32(8, plan.tileSize, true); view.setUint32(12, plan.tilesX, true); view.setUint32(16, plan.lights.length, true); view.setUint32(20, plan.tilesY, true); view.setFloat32(24, 0, true); view.setFloat32(28, plan.quality === 'economy' ? 0 : 0.65, true); view.setFloat32(32, 0.12, true); view.setFloat32(36, time, true); view.setUint32(40, plan.particleSeeds.length, true); view.setUint32(44, 0, true); return buffer; }
function blendDescriptor(mode: VSRWebGPUBlendMode): Record<string, unknown> { return mode === 'additive' ? { color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } : { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' } }; }

export class VSRRealtimeWebGPUExecutor {
  readonly canvas: HTMLCanvasElement; readonly device: any; readonly adapter: any; readonly context: any; readonly format: string; readonly options: VSRRealtimeWebGPUExecutorOptions;
  private frameIndex = 0; private lost = false; private adapterName = 'unknown'; private pipelines = new Map<string, any>(); private resources = new Map<string, any>(); private dynamicBuffers = new Map<string, { buffer: any; size: number; root: string }>();
  private stats: VSRRealtimeWebGPUCacheStats = { pipelinesCreated: 0, pipelineHits: 0, buffersCreated: 0, texturesCreated: 0, atlasUploads: 0 };
  private constructor(canvas: HTMLCanvasElement, adapter: any, device: any, context: any, format: string, options: VSRRealtimeWebGPUExecutorOptions) { this.canvas = canvas; this.adapter = adapter; this.device = device; this.context = context; this.format = format; this.options = options; this.adapterName = String(adapter?.info?.description ?? adapter?.name ?? 'unknown'); void device.lost?.then?.(() => { this.lost = true; }); }
  static async create(canvas: HTMLCanvasElement, options: VSRRealtimeWebGPUExecutorOptions = {}): Promise<VSRRealtimeWebGPUExecutor> { const nav = navigator as Navigator & { gpu?: { requestAdapter: (options?: Record<string, unknown>) => Promise<any>; getPreferredCanvasFormat: () => string } }; if (!nav.gpu) throw new Error('WebGPU unavailable: navigator.gpu is missing.'); const adapter = await nav.gpu.requestAdapter({ powerPreference: options.powerPreference ?? 'high-performance' }); if (!adapter) throw new Error('WebGPU adapter unavailable.'); const device = await adapter.requestDevice({ requiredFeatures: options.requiredFeatures ?? [] }), context = canvas.getContext('webgpu') as any; if (!context) throw new Error('Unable to acquire webgpu canvas context.'); const format = nav.gpu.getPreferredCanvasFormat(); context.configure({ device, format, alphaMode: options.alphaMode ?? 'premultiplied' }); return new VSRRealtimeWebGPUExecutor(canvas, adapter, device, context, format, options); }
  cacheStats(): VSRRealtimeWebGPUCacheStats { return { ...this.stats }; }
  isLost(): boolean { return this.lost; }
  private pipeline(key: string, create: () => any): any { const cached = this.pipelines.get(key); if (cached) { this.stats.pipelineHits++; return cached; } const value = create(); this.pipelines.set(key, value); this.stats.pipelinesCreated++; return value; }
  private dynamicBuffer(key: string, data: ArrayBufferView, usage: number, root: string): any { const required = Math.max(4, Math.ceil(data.byteLength / 4) * 4), cached = this.dynamicBuffers.get(key); let entry = cached; if (!entry || entry.size < required) { entry?.buffer.destroy?.(); const buffer = this.device.createBuffer({ size: required, usage: usage | BUFFER_USAGE.COPY_DST }); entry = { buffer, size: required, root: '' }; this.dynamicBuffers.set(key, entry); this.stats.buffersCreated++; } if (entry.root !== root) { if (data.byteLength > 0) this.device.queue.writeBuffer(entry.buffer, 0, data.buffer, data.byteOffset, data.byteLength); entry.root = root; } return entry.buffer; }
  private atlas(plan: VSRRealtimeGPUFramePlan): any { const key = `atlas:${plan.atlas.atlasRoot}`, cached = this.resources.get(key); if (cached) return cached; const texture = this.device.createTexture({ size: [plan.atlas.width, plan.atlas.height, 1], format: 'rgba8unorm', usage: TEXTURE_USAGE.TEXTURE_BINDING | TEXTURE_USAGE.COPY_DST }), upload = paddedRows(plan.atlas.data, plan.atlas.width, plan.atlas.height); this.device.queue.writeTexture({ texture }, { data: upload.data, bytesPerRow: upload.bytesPerRow, rowsPerImage: plan.atlas.height }, { width: plan.atlas.width, height: plan.atlas.height, depthOrArrayLayers: 1 }); this.resources.set(key, texture); this.stats.texturesCreated++; this.stats.atlasUploads++; return texture; }
  async render(input: VSRRealtimeGPUFrameInput, time = 0): Promise<VSRRealtimeGPUFrameReceipt> {
    const plan = normalizeRealtimeWebGPUFrame(input), compileStart = now(), verification = verifyRealtimeWebGPUFrame(plan); if (!verification.ok) throw new Error(`Invalid realtime GPU frame: ${verification.diagnostics.join(', ')}`); if (this.lost) throw new Error('WebGPU device is lost.'); const compileMs = now() - compileStart, uploadStart = now();
    this.canvas.width = Math.max(1, Math.round(plan.viewport.renderWidth)); this.canvas.height = Math.max(1, Math.round(plan.viewport.renderHeight));
    const atlas = this.atlas(plan), vertex = this.dynamicBuffer('vertices', plan.vertexData, BUFFER_USAGE.VERTEX, bytesRoot(plan.vertexData)), lights = this.dynamicBuffer('lights', plan.lightData, BUFFER_USAGE.STORAGE, bytesRoot(plan.lightData)), tiles = this.dynamicBuffer('tiles', plan.tileData, BUFFER_USAGE.STORAGE, bytesRoot(plan.tileData)), particles = this.dynamicBuffer('particles', plan.particleData, BUFFER_USAGE.STORAGE, bytesRoot(plan.particleData)), uniformBytes = new Uint8Array(frameUniformData(plan, time)), uniform = this.dynamicBuffer('frame-uniform', uniformBytes, BUFFER_USAGE.UNIFORM, bytesRoot(uniformBytes));
    const uploadMs = now() - uploadStart, sceneModule = this.device.createShaderModule({ code: VSR_SCENE_SHADER_V03 }), lightModule = this.device.createShaderModule({ code: VSR_LIGHT_CULL_SHADER_V03 }), particleComputeModule = this.device.createShaderModule({ code: VSR_PARTICLE_COMPUTE_SHADER_V03 }), particleRenderModule = this.device.createShaderModule({ code: VSR_PARTICLE_RENDER_SHADER_V03 }), postModule = this.device.createShaderModule({ code: VSR_POST_SHADER_V03 });
    const scenePipelines = { normal: this.pipeline(`scene:${this.format}:normal`, () => this.device.createRenderPipeline({ layout: 'auto', vertex: { module: sceneModule, entryPoint: 'vs_main', buffers: [{ arrayStride: SOURCE_VERTEX_STRIDE * 4, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x2' }, { shaderLocation: 2, offset: 16, format: 'float32x4' }, { shaderLocation: 3, offset: 32, format: 'float32x3' }] }] }, fragment: { module: sceneModule, entryPoint: 'fs_main', targets: [{ format: 'rgba8unorm', blend: blendDescriptor('normal') }] }, primitive: { topology: 'triangle-list' } })), additive: this.pipeline(`scene:${this.format}:additive`, () => this.device.createRenderPipeline({ layout: 'auto', vertex: { module: sceneModule, entryPoint: 'vs_main', buffers: [{ arrayStride: SOURCE_VERTEX_STRIDE * 4, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x2' }, { shaderLocation: 2, offset: 16, format: 'float32x4' }, { shaderLocation: 3, offset: 32, format: 'float32x3' }] }] }, fragment: { module: sceneModule, entryPoint: 'fs_main', targets: [{ format: 'rgba8unorm', blend: blendDescriptor('additive') }] }, primitive: { topology: 'triangle-list' } })) };
    const lightPipeline = this.pipeline('light-cull-v03', () => this.device.createComputePipeline({ layout: 'auto', compute: { module: lightModule, entryPoint: 'main' } })), particleCompute = this.pipeline('particle-compute-v03', () => this.device.createComputePipeline({ layout: 'auto', compute: { module: particleComputeModule, entryPoint: 'simulate' } })), particleRender = this.pipeline('particle-render-v03', () => this.device.createRenderPipeline({ layout: 'auto', vertex: { module: particleRenderModule, entryPoint: 'vs_particle' }, fragment: { module: particleRenderModule, entryPoint: 'fs_particle', targets: [{ format: 'rgba8unorm', blend: blendDescriptor('additive') }] }, primitive: { topology: 'triangle-list' } })), postPipeline = this.pipeline(`post:${this.format}`, () => this.device.createRenderPipeline({ layout: 'auto', vertex: { module: postModule, entryPoint: 'vs_full' }, fragment: { module: postModule, entryPoint: 'fs_full', targets: [{ format: this.format }] }, primitive: { topology: 'triangle-list' } }));
    const linearSampler = this.resources.get('sampler:linear') ?? this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' }), nearestSampler = this.resources.get('sampler:nearest') ?? this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest' }); this.resources.set('sampler:linear', linearSampler); this.resources.set('sampler:nearest', nearestSampler); const sceneKey = `scene:${this.canvas.width}x${this.canvas.height}`; let sceneTexture = this.resources.get(sceneKey); if (!sceneTexture) { for (const [key, value] of this.resources) if (key.startsWith('scene:')) { value.destroy?.(); this.resources.delete(key); } sceneTexture = this.device.createTexture({ size: [this.canvas.width, this.canvas.height, 1], format: 'rgba8unorm', usage: TEXTURE_USAGE.RENDER_ATTACHMENT | TEXTURE_USAGE.TEXTURE_BINDING | TEXTURE_USAGE.COPY_SRC }); this.resources.set(sceneKey, sceneTexture); this.stats.texturesCreated++; }
    const sceneGroups = { linear: this.device.createBindGroup({ layout: scenePipelines.normal.getBindGroupLayout(0), entries: [{ binding: 0, resource: linearSampler }, { binding: 1, resource: atlas.createView() }, { binding: 2, resource: { buffer: uniform } }, { binding: 3, resource: { buffer: lights } }, { binding: 4, resource: { buffer: tiles } }] }), nearest: this.device.createBindGroup({ layout: scenePipelines.normal.getBindGroupLayout(0), entries: [{ binding: 0, resource: nearestSampler }, { binding: 1, resource: atlas.createView() }, { binding: 2, resource: { buffer: uniform } }, { binding: 3, resource: { buffer: lights } }, { binding: 4, resource: { buffer: tiles } }] }) };
    const encodeStart = now(), encoder = this.device.createCommandEncoder(); let computePasses = 0;
    if (plan.lights.length) { const pass = encoder.beginComputePass(); pass.setPipeline(lightPipeline); pass.setBindGroup(0, this.device.createBindGroup({ layout: lightPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniform } }, { binding: 1, resource: { buffer: lights } }, { binding: 2, resource: { buffer: tiles } }] })); pass.dispatchWorkgroups(plan.tilesX * plan.tilesY); pass.end(); computePasses++; }
    if (plan.particleSeeds.length) { const pass = encoder.beginComputePass(); pass.setPipeline(particleCompute); pass.setBindGroup(0, this.device.createBindGroup({ layout: particleCompute.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniform } }, { binding: 1, resource: { buffer: particles } }] })); pass.dispatchWorkgroups(Math.ceil(plan.particleSeeds.length / 64)); pass.end(); computePasses++; }
    const scenePass = encoder.beginRenderPass({ colorAttachments: [{ view: sceneTexture.createView(), clearValue: { r: 0.015, g: 0.025, b: 0.06, a: 1 }, loadOp: 'clear', storeOp: 'store' }] }); scenePass.setVertexBuffer(0, vertex); let activeBlend: VSRWebGPUBlendMode | undefined;
    for (const packet of plan.drawPackets) { if (activeBlend !== packet.blendMode) { activeBlend = packet.blendMode; scenePass.setPipeline(scenePipelines[activeBlend]); } scenePass.setBindGroup(0, sceneGroups[packet.sampling]); if (packet.scissor) { const x = Math.max(0, Math.floor(packet.scissor.x)), y = Math.max(0, Math.floor(packet.scissor.y)), right = Math.min(this.canvas.width, Math.ceil(packet.scissor.x + packet.scissor.width)), bottom = Math.min(this.canvas.height, Math.ceil(packet.scissor.y + packet.scissor.height)); scenePass.setScissorRect(x, y, Math.max(0, right - x), Math.max(0, bottom - y)); } else scenePass.setScissorRect(0, 0, this.canvas.width, this.canvas.height); scenePass.draw(packet.vertexCount, 1, packet.firstVertex, 0); }
    scenePass.end();
    if (plan.particleSeeds.length) { const pass = encoder.beginRenderPass({ colorAttachments: [{ view: sceneTexture.createView(), loadOp: 'load', storeOp: 'store' }] }); pass.setPipeline(particleRender); pass.setBindGroup(0, this.device.createBindGroup({ layout: particleRender.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniform } }, { binding: 1, resource: { buffer: particles } }] })); pass.draw(6, plan.particleSeeds.length, 0, 0); pass.end(); }
    const postPass = encoder.beginRenderPass({ colorAttachments: [{ view: this.context.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }] }); postPass.setPipeline(postPipeline); postPass.setBindGroup(0, this.device.createBindGroup({ layout: postPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: linearSampler }, { binding: 1, resource: sceneTexture.createView() }, { binding: 2, resource: { buffer: uniform } }] })); postPass.draw(3); postPass.end();
    const encoded = encoder.finish(), encodeMs = now() - encodeStart, submitStart = now(); this.device.queue.submit([encoded]); await this.device.queue.onSubmittedWorkDone?.(); const submitMs = now() - submitStart, frameIndex = this.frameIndex++, receiptBase = { format: 'vsr.realtime-webgpu-frame-receipt.v0.3' as const, version: VSR_REALTIME_WEBGPU_VERSION, mode: 'webgpu' as const, frameIndex, sourceDisplayHash: plan.sourceDisplayHash, framePlanRoot: plan.framePlanRoot, resourceRoot: plan.resourceRoot, commandRoot: plan.commandRoot, adapterName: this.adapterName, deviceLost: this.lost, submitted: true, drawCalls: plan.stats.estimatedDrawCalls, computePasses, compileMs, uploadMs, encodeMs, submitMs };
    return { ...receiptBase, receiptRoot: cryptographicHash(receiptBase) };
  }
  destroy(): void { for (const resource of this.resources.values()) resource.destroy?.(); for (const entry of this.dynamicBuffers.values()) entry.buffer.destroy?.(); this.resources.clear(); this.dynamicBuffers.clear(); this.pipelines.clear(); }
}

export function verifyRealtimeGPUReceipt(receipt: VSRRealtimeGPUFrameReceipt): boolean { const { receiptRoot, ...base } = receipt; return cryptographicHash(base) === receiptRoot; }
