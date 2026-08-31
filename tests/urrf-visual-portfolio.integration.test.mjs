import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {
  createRepresentationPortfolio,
  createRepresentationSlot,
  rootHash,
  verifyRepresentationPortfolio
} from '../packages/kernel/rncs-core-contract/src/index.mjs';
import {
  RealityRepresentationPortfolioRuntime,
  verifyPortfolioRuntimeSnapshot,
  verifyVisualEvidence
} from '../packages/world/reality-representation-fabric/src/index.mjs';
import {
  createCubeMesh,
  createPlaneMesh,
  createUVSphereMesh,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialFrame
} from '../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_VISUAL_PORTFOLIO_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_V03_VISUAL_PORTFOLIO'));
const profiles = [
  {
    id: 'proxy',
    quality: 'PROXY',
    kind: 'world-proxy',
    style: 'ABSTRACT',
    material: 'FLAT',
    lighting: 'DAYLIGHT',
    environmentVariant: 'COASTAL',
    motionVariant: 'STATIC',
    animation: null,
    view: 'WIDE',
    resolution: [320, 180],
    renderer: {qualityTier: 'economy', enableShadows: false, shadowMapSize: 64},
    background: '#06101d',
    environment: {diffuseColor: '#1b4260', specularColor: '#6aa9c8', intensity: 0.38},
    colors: {blue: '#4cc9f0', red: '#f72585', ground: '#122238', emissive: '#72efdd'},
    postProcess: {exposure: -0.1, contrast: 1.05, saturation: 1.3, vignette: 0.1},
    costs: {GPU_MILLI: 30, VRAM_MB: 48, NETWORK_KB: 80, ENERGY_MILLI: 20}
  },
  {
    id: 'mobile',
    quality: 'MOBILE',
    kind: 'mesh',
    style: 'CLEAN',
    material: 'PBR-LITE',
    lighting: 'DAYLIGHT',
    environmentVariant: 'FOREST',
    motionVariant: 'WIND-SOFT',
    animation: {clipId: 'anim:wind', timeSeconds: 0.35, loop: false},
    view: 'HERO',
    resolution: [480, 270],
    renderer: {qualityTier: 'balanced', enableShadows: false, shadowMapSize: 128},
    background: '#0d1726',
    environment: {diffuseColor: '#2d5575', specularColor: '#c2d8ec', intensity: 0.52},
    colors: {blue: '#3b82f6', red: '#fb7185', ground: '#1e293b', emissive: '#5eead4'},
    postProcess: {exposure: 0, contrast: 1.03, saturation: 1.08, vignette: 0.06},
    costs: {GPU_MILLI: 90, VRAM_MB: 128, NETWORK_KB: 180, ENERGY_MILLI: 48}
  },
  {
    id: 'standard',
    quality: 'STANDARD',
    kind: 'mesh',
    style: 'REALISTIC',
    material: 'PBR',
    lighting: 'GOLDEN-HOUR',
    environmentVariant: 'DESERT',
    motionVariant: 'WIND-GUST',
    animation: {clipId: 'anim:wind', timeSeconds: 1.35, loop: false},
    view: 'HERO',
    resolution: [640, 360],
    renderer: {qualityTier: 'balanced', enableShadows: true, shadowMapSize: 256},
    background: '#1b1322',
    environment: {diffuseColor: '#6a3c48', specularColor: '#f7d2a0', intensity: 0.68},
    colors: {blue: '#2563eb', red: '#dc2626', ground: '#33283a', emissive: '#2dd4bf'},
    postProcess: {exposure: 0.15, contrast: 1.08, saturation: 1.02, vignette: 0.12, ssaoIntensity: 0.24, ssaoRadius: 2},
    costs: {GPU_MILLI: 170, VRAM_MB: 256, NETWORK_KB: 320, ENERGY_MILLI: 90}
  },
  {
    id: 'cinematic',
    quality: 'CINEMATIC',
    kind: 'gaussian-splats',
    style: 'FILMIC',
    material: 'VOLUMETRIC',
    lighting: 'NOCTURNE',
    environmentVariant: 'NOCTURNE',
    motionVariant: 'BEACON-PULSE',
    animation: {clipId: 'anim:pulse', timeSeconds: 0.5, loop: false},
    view: 'DYNAMIC-HERO',
    resolution: [960, 540],
    renderer: {qualityTier: 'quality', enableShadows: true, shadowMapSize: 512},
    background: '#020617',
    environment: {diffuseColor: '#202c4d', specularColor: '#b9d4ff', intensity: 0.72},
    colors: {blue: '#38bdf8', red: '#e879f9', ground: '#101827', emissive: '#22d3ee'},
    postProcess: {exposure: 0.28, contrast: 1.16, saturation: 1.12, vignette: 0.2, bloomThreshold: 0.72, bloomIntensity: 0.48, bloomRadius: 2, ssaoIntensity: 0.35, ssaoRadius: 2.4, ssgiIntensity: 0.22, ssgiRadius: 3, ssgiSteps: 6},
    costs: {GPU_MILLI: 420, VRAM_MB: 640, NETWORK_KB: 720, ENERGY_MILLI: 220}
  },
  {
    id: 'reference',
    quality: 'REFERENCE',
    kind: 'mesh',
    style: 'STYLIZED',
    material: 'PBR-CLEARCOAT',
    lighting: 'STUDIO',
    environmentVariant: 'STUDIO',
    motionVariant: 'ORBIT-HERO',
    animation: {clipId: 'anim:orbit', timeSeconds: 0.75, loop: false},
    view: 'ORBIT',
    resolution: [800, 450],
    renderer: {qualityTier: 'quality', enableShadows: true, shadowMapSize: 512},
    background: '#111827',
    environment: {diffuseColor: '#354b6b', specularColor: '#f8fafc', intensity: 0.8},
    colors: {blue: '#60a5fa', red: '#f97316', ground: '#273449', emissive: '#a7f3d0'},
    postProcess: {exposure: 0.05, contrast: 1.12, saturation: 1.2, vignette: 0.08, ssaoIntensity: 0.3, ssaoRadius: 2.2, bloomThreshold: 1.1, bloomIntensity: 0.18},
    costs: {GPU_MILLI: 320, VRAM_MB: 512, NETWORK_KB: 560, ENERGY_MILLI: 170}
  }
];

function createPortfolioShowcaseScene() {
  const base = structuredClone(createSpatialShowcaseScene());
  return {
    ...base,
    meshes: [
      createPlaneMesh('mesh:ground', 18, 14),
      createCubeMesh('mesh:cube', 1),
      createCubeMesh('mesh:cube-low', 1),
      createUVSphereMesh('mesh:sphere', 0.9, 28, 18)
    ],
    materials: [
      {id: 'mat:stone', baseColor: '#334155', metallic: 0.12, roughness: 0.74},
      {id: 'mat:metal', baseColor: '#3b82f6', metallic: 0.72, roughness: 0.24},
      {id: 'mat:foliage', baseColor: '#ef4444', metallic: 0.08, roughness: 0.56},
      {id: 'mat:ground', baseColor: '#253449', metallic: 0.05, roughness: 0.85, doubleSided: true},
      {id: 'mat:beacon', baseColor: '#5eead4', metallic: 0.2, roughness: 0.3, emissive: '#14b8a6', emissiveStrength: 0.75}
    ],
    nodes: [
      {id: 'ground', meshId: 'mesh:ground', materialId: 'mat:ground', receiveShadow: true, castShadow: false},
      {id: 'platform', meshId: 'mesh:cube', materialId: 'mat:stone', transform: {translation: [0, 0.22, 0], scale: [6.4, 0.42, 4.2]}, receiveShadow: true, castShadow: true},
      {id: 'tower-base', meshId: 'mesh:cube', materialId: 'mat:stone', transform: {translation: [0, 0.95, -0.45], scale: [2.1, 1.15, 1.75]}, receiveShadow: true, castShadow: true},
      {id: 'tower-mid', meshId: 'mesh:cube', materialId: 'mat:metal', transform: {translation: [0, 2.08, -0.45], scale: [1.45, 1.15, 1.25]}, receiveShadow: true, castShadow: true},
      {id: 'tower-cap', meshId: 'mesh:cube', materialId: 'mat:beacon', transform: {translation: [0, 2.82, -0.45], scale: [1.85, 0.18, 1.62]}, receiveShadow: true, castShadow: true},
      {id: 'pillar-left', meshId: 'mesh:cube', materialId: 'mat:metal', transform: {translation: [-3.2, 1.12, 0.65], scale: [0.48, 1.78, 0.48]}, receiveShadow: true, castShadow: true},
      {id: 'pillar-right', meshId: 'mesh:cube', materialId: 'mat:metal', transform: {translation: [3.2, 1.12, 0.65], scale: [0.48, 1.78, 0.48]}, receiveShadow: true, castShadow: true},
      {id: 'tree-left-trunk', meshId: 'mesh:cube', materialId: 'mat:stone', transform: {translation: [-3.75, 0.84, -1.2], scale: [0.36, 1.28, 0.36]}, receiveShadow: true, castShadow: true},
      {id: 'tree-left-crown', meshId: 'mesh:sphere', materialId: 'mat:foliage', transform: {translation: [-3.75, 2.0, -1.2], scale: [1.05, 1.15, 1.05]}, receiveShadow: true, castShadow: true},
      {id: 'tree-right-trunk', meshId: 'mesh:cube', materialId: 'mat:stone', transform: {translation: [3.7, 0.72, -1.55], scale: [0.32, 1.02, 0.32]}, receiveShadow: true, castShadow: true},
      {id: 'tree-right-crown', meshId: 'mesh:sphere', materialId: 'mat:foliage', transform: {translation: [3.7, 1.72, -1.55], scale: [0.86, 0.95, 0.86]}, receiveShadow: true, castShadow: true},
      {id: 'beacon-left', meshId: 'mesh:cube', materialId: 'mat:beacon', transform: {translation: [-2.25, 0.82, 2.25], scale: [0.28, 1.18, 0.28]}, receiveShadow: true, castShadow: true},
      {id: 'beacon-right', meshId: 'mesh:cube', materialId: 'mat:beacon', transform: {translation: [2.25, 0.82, 2.25], scale: [0.28, 1.18, 0.28]}, receiveShadow: true, castShadow: true}
    ],
    animations: [
      {
        id: 'anim:wind',
        duration: 2,
        channels: [
          {nodeId: 'tree-left-crown', path: 'rotationEulerDeg', interpolation: 'LINEAR', times: [0, 1, 2], values: [[0, -6, -4], [0, 6, 4], [0, -6, -4]]},
          {nodeId: 'tree-right-crown', path: 'rotationEulerDeg', interpolation: 'LINEAR', times: [0, 1, 2], values: [[0, 6, 3], [0, -6, -3], [0, 6, 3]]}
        ]
      },
      {
        id: 'anim:pulse',
        duration: 1,
        channels: [
          {nodeId: 'beacon-left', path: 'scale', interpolation: 'LINEAR', times: [0, 0.5, 1], values: [[0.28, 1.18, 0.28], [0.42, 1.52, 0.42], [0.28, 1.18, 0.28]]},
          {nodeId: 'beacon-right', path: 'scale', interpolation: 'LINEAR', times: [0, 0.5, 1], values: [[0.28, 1.18, 0.28], [0.42, 1.52, 0.42], [0.28, 1.18, 0.28]]},
          {nodeId: 'tower-cap', path: 'scale', interpolation: 'LINEAR', times: [0, 0.5, 1], values: [[1.85, 0.18, 1.62], [2.05, 0.24, 1.8], [1.85, 0.18, 1.62]]}
        ]
      },
      {
        id: 'anim:orbit',
        duration: 1.5,
        channels: [
          {nodeId: 'tower-mid', path: 'rotationEulerDeg', interpolation: 'LINEAR', times: [0, 0.75, 1.5], values: [[0, 0, 0], [0, 36, 0], [0, 72, 0]]},
          {nodeId: 'tower-cap', path: 'rotationEulerDeg', interpolation: 'LINEAR', times: [0, 0.75, 1.5], values: [[0, 0, 0], [0, -30, 0], [0, -60, 0]]}
        ]
      }
    ],
    environment: {...base.environment, probes: [
      {id: 'probe:platform', position: [0, 1.4, 0], radius: 8, diffuseColor: '#54749b', specularColor: '#dbeafe', intensity: 1.15},
      {id: 'probe:trees', position: [-3, 1.5, -1], radius: 5, diffuseColor: '#355f5a', specularColor: '#8bd5ca', intensity: 0.85}
    ]},
    cameras: [{id: 'camera:main', projection: 'perspective', fovYDeg: 52, near: 0.1, far: 100, transform: {translation: [5.8, 3.8, 7.6], rotationEulerDeg: [-18, 38, 0]}}]
  };
}

function variantScene(profile) {
  const scene = structuredClone(createPortfolioShowcaseScene());
  scene.sceneId = `urrf-portfolio:${profile.id}`;
  scene.title = `URRF Portfolio ${profile.quality}`;
  scene.background = profile.background;
  scene.environment = {...scene.environment, ...profile.environment};
  const environmentProbe = {
    COASTAL: {id: 'probe:coastal', position: [0, 2.4, 3.4], radius: 7, diffuseColor: '#2f7aa0', specularColor: '#c6f1ff', intensity: 0.8},
    FOREST: {id: 'probe:forest', position: [-2.8, 2.2, -1.2], radius: 6, diffuseColor: '#356b52', specularColor: '#b6e3b8', intensity: 0.9},
    DESERT: {id: 'probe:desert', position: [2.8, 2.1, 1.5], radius: 7, diffuseColor: '#b8794f', specularColor: '#ffe0ae', intensity: 0.85},
    NOCTURNE: {id: 'probe:nocturne', position: [0, 3.2, -2.2], radius: 8, diffuseColor: '#243d85', specularColor: '#94b8ff', intensity: 1.1},
    STUDIO: {id: 'probe:studio', position: [0, 4.2, 2.5], radius: 8, diffuseColor: '#9bb7d9', specularColor: '#ffffff', intensity: 0.95}
  }[profile.environmentVariant];
  if (environmentProbe) scene.environment.probes = [...(scene.environment.probes ?? []), environmentProbe];
  const colors = profile.colors;
  const materialColors = {'mat:stone': colors.ground, 'mat:metal': colors.blue, 'mat:foliage': colors.red, 'mat:ground': colors.ground, 'mat:beacon': colors.emissive};
  scene.materials = scene.materials.map(material => ({...material, ...(materialColors[material.id] ? {baseColor: materialColors[material.id]} : {})}));
  scene.lights = scene.lights.map(light => {
    if (profile.lighting === 'NOCTURNE' && light.kind === 'directional') return {...light, color: '#9bbcff', intensity: 1.35, direction: [-0.25, -1, 0.5]};
    if (profile.lighting === 'GOLDEN-HOUR' && light.kind === 'directional') return {...light, color: '#ffd0a8', intensity: 2.35, direction: [-0.75, -1, -0.15]};
    if (profile.lighting === 'STUDIO' && light.kind === 'directional') return {...light, color: '#f8fafc', intensity: 2.55, direction: [-0.25, -1, -0.9]};
    if (profile.lighting === 'STUDIO' && light.kind === 'point') return {...light, color: '#fbbf24', intensity: 7.5, position: [2.8, 3.4, 1.5], range: 9};
    return light;
  });
  if (profile.view === 'ORBIT') scene.cameras[0].transform = {translation: [5.8, 2.8, 4.8], rotationEulerDeg: [-14, 50, 0]};
  if (profile.view === 'WIDE') scene.cameras[0].transform = {translation: [5.8, 3.4, 7.8], rotationEulerDeg: [-18, 35, 0]};
  if (profile.view === 'DYNAMIC-HERO') scene.cameras[0].transform = {translation: [4.2, 2.7, 5.4], rotationEulerDeg: [-14, 38, 0]};
  scene.reality = {...scene.reality, realityRoot: rootHash({profile: profile.id, environment: profile.environmentVariant, motion: profile.motionVariant, base: scene.reality?.realityRoot ?? null})};
  return scene;
}

function makePortfolio() {
  const slots = profiles.map(profile => createRepresentationSlot({
    slot_id: `slot:${profile.id}`,
    representation_id: `representation:portfolio:${profile.id}`,
    representation_root: rootHash({portfolio: 'urrf-visual-v03', profile: profile.id}),
    representation_kind: profile.kind,
    quality_profile: profile.quality,
    required_for_minimum: profile.quality === 'PROXY',
    diversity_axes: {MODALITY: profile.kind, DETAIL: profile.quality, MATERIAL: profile.material, LIGHTING: profile.lighting, ENVIRONMENT: profile.environmentVariant, STYLE: profile.style, MOTION: profile.motionVariant, VIEW: profile.view},
    render_profile: {renderer_id: 'vsr-spatial-reference', shading_model: 'pbr', lighting_profile: profile.lighting, camera_profile: profile.view, resolution_class: profile.quality.toLowerCase(), width: profile.resolution[0], height: profile.resolution[1], post_process: profile.id === 'proxy' ? 'none' : 'spatial-post-process', options: profile.renderer},
    resource_costs: profile.costs
  }));
  return createRepresentationPortfolio({
    portfolio_id: 'portfolio:urrf-visual-v03-showcase',
    object_id: 'reality-object:urrf-visual-v03-showcase',
    canonical_state_root: rootHash({world: 'urrf-visual-v03-showcase', generation: 1}),
    slots,
    active_slot_id: 'slot:standard',
    composition: {
      mode: 'DIVERSE',
      min_slots: 4,
      max_slots: 5,
      required_kinds: ['world-proxy', 'mesh', 'gaussian-splats'],
      required_quality_profiles: ['PROXY', 'MOBILE', 'STANDARD', 'CINEMATIC'],
      quality_ladder: ['PROXY', 'MOBILE', 'STANDARD', 'CINEMATIC', 'REFERENCE'],
      diversity_targets: {MODALITY: 3, DETAIL: 5, MATERIAL: 4, LIGHTING: 4, ENVIRONMENT: 4, STYLE: 4, MOTION: 4, VIEW: 3}
    },
    evidence_refs: []
  });
}

test('renders and records a diverse URRF representation portfolio', () => {
  mkdirSync(outputDir, {recursive: true});
  const portfolio = makePortfolio();
  assert.equal(verifyRepresentationPortfolio(portfolio).valid, true);
  assert.equal(portfolio.composition_result.composition_status, 'READY');
  const runtime = new RealityRepresentationPortfolioRuntime({portfolios: [portfolio]});
  const reports = [];
  for (const profile of profiles) {
    const scene = variantScene(profile);
    const options = {...profile.renderer, width: profile.resolution[0], height: profile.resolution[1], postProcess: profile.postProcess, visualIntentRoot: rootHash({portfolio: portfolio.portfolio_root, profile: profile.id}), ...(profile.animation ? {animation: profile.animation} : {})};
    const rendered = renderSpatialReference(scene, options);
    assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
    const imagePath = join(outputDir, `${profile.id}.png`);
    writeFileSync(imagePath, rendered.png);
    const evidence = runtime.recordVisualEvidence({
      portfolio_id: portfolio.portfolio_id,
      slot_id: `slot:${profile.id}`,
      evidence_id: `visual:${profile.id}:local-reference`,
      status: 'LOCAL_RENDERED',
      quality_status: 'OBSERVED_NOT_GRADED',
      width: rendered.framePlan.viewport.width,
      height: rendered.framePlan.viewport.height,
      png_bytes: rendered.png.byteLength,
      triangles: rendered.framePlan.stats.triangleCount,
      draw_calls: rendered.framePlan.stats.visibleDraws,
      pixel_root: rendered.pixelRoot,
      frame_root: rendered.framePlan.frameRoot,
      environment_root: rendered.framePlan.environmentRoot,
      animation_root: rendered.framePlan.animationRoot,
      diversity_observation: portfolio.slots.find(slot => slot.slot_id === `slot:${profile.id}`).diversity_axes,
      notes: 'Deterministic CPU reference render; visual quality is observed but not subjectively graded or promoted.'
    });
    assert.equal(verifyVisualEvidence(evidence).valid, true);
    reports.push({
      profile: profile.id,
      quality_profile: profile.quality,
      representation_kind: profile.kind,
      diversity_axes: evidence.diversity_observation,
      image_path: `${profile.id}.png`,
      image_bytes: evidence.png_bytes,
      width: evidence.width,
      height: evidence.height,
      triangles: evidence.triangles,
      draw_calls: evidence.draw_calls,
      pixel_root: evidence.pixel_root,
      frame_root: evidence.frame_root,
      environment_root: evidence.environment_root,
      animation_root: evidence.animation_root,
      animation: profile.animation ? {clip_id: profile.animation.clipId, time_seconds: String(profile.animation.timeSeconds), loop: profile.animation.loop ?? true} : null,
      evidence_root: evidence.evidence_root,
      quality_status: evidence.quality_status,
      visual_status: evidence.status
    });
  }
  const runtimeVerification = runtime.verify();
  assert.equal(runtimeVerification.valid, true);
  assert.equal(verifyPortfolioRuntimeSnapshot(runtimeVerification.snapshot), true);
  const report = {
    format: 'urrf.visual-portfolio-report.v0.3',
    version: '0.3.0',
    portfolio_id: portfolio.portfolio_id,
    portfolio_root: portfolio.portfolio_root,
    composition: portfolio.composition,
    composition_result: portfolio.composition_result,
    samples: reports,
    runtime_root: runtimeVerification.snapshot.runtime_root,
    status: 'LOCAL_RENDERED_OBSERVED_NOT_GRADED',
    authority: {canonical_write_authorized: false, candidate_only: true},
    report_root: null
  };
  delete report.report_root;
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'visual-portfolio-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const evidenceLines = [
    '# URRF v0.3 Visual Representation Portfolio — Local Evidence',
    '',
    `- portfolio_root: \`${portfolio.portfolio_root}\``,
    `- report_root: \`${report.report_root}\``,
    `- composition: \`${portfolio.composition_result.composition_status}\` (${portfolio.slots.length} slots; ${portfolio.composition.min_slots}-${portfolio.composition.max_slots} allowed)`,
    '- status: `LOCAL_RENDERED / OBSERVED_NOT_GRADED`',
    '',
    '| Profile | Kind | Size | Triangles | Draw calls | Environment | Motion | Style | Lighting | Image |',
    '|---|---|---:|---:|---:|---|---|---|---|---|',
    ...reports.map(item => `| ${item.quality_profile} | ${item.representation_kind} | ${item.width}×${item.height} | ${item.triangles} | ${item.draw_calls} | ${item.diversity_axes.ENVIRONMENT} | ${item.diversity_axes.MOTION} | ${item.diversity_axes.STYLE} | ${item.diversity_axes.LIGHTING} | [${item.profile}.png](./${item.profile}.png) |`),
    '',
    'The PNGs are deterministic VSR CPU-reference projections attached to candidate slots. They demonstrate renderable quality tiers and composition diversity; they do not prove production GPU/WebGPU quality, browser presentation, subjective art direction, or canonical-world promotion.'
  ];
  writeFileSync(join(outputDir, 'README.md'), `${evidenceLines.join('\n')}\n`, 'utf8');
  assert.equal(reports.length, profiles.length);
  assert.equal(reports.every(item => !item.image_path.includes('\\') && !item.image_path.includes(':')), true);
  assert.equal(new Set(reports.map(item => item.diversity_axes.STYLE)).size >= 4, true);
  assert.equal(new Set(reports.map(item => item.diversity_axes.ENVIRONMENT)).size >= 4, true);
  assert.equal(new Set(reports.map(item => item.diversity_axes.MOTION)).size >= 4, true);
  assert.equal(new Set(reports.map(item => item.animation_root)).size >= 4, true);
});
