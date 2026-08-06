import {lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal} from './canonical.mjs';

export const SCENE_FIELD_FORMAT = 'rncs.scene-structure-field.v0.1';
const round = value => Number(Number(value).toFixed(6));
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

export function createSceneStructureField({shotId='native-shot-001', width=1280, height=720, fps=24, duration=5}={}) {
  const camera = {
    format: 'rncs.camera-program.v0.1', version: NATIVE_VISUAL_VERSION, camera_id: `camera:${shotId}`, projection: 'perspective-2.5d',
    resolution: {width, height}, fps, lens_mm: 52, start: {x: -.02, y: .03, z: 4.2, yaw: -.025, pitch: .01, zoom: 1}, end: {x: .045, y: .045, z: 4.05, yaw: .035, pitch: .005, zoom: 1.06}, easing: 'smoothstep', camera_root: ''
  };
  camera.camera_root = rootHash({...camera, camera_root: undefined});
  const lights = [{light_id: 'key-cold', type: 'directional', direction: [-.35, .65, .7], intensity: .92, color: '#d8e8ff'}, {light_id: 'rim-silver', type: 'directional', direction: [.6, .3, -.25], intensity: .25, color: '#8bb0cf'}];
  const depthLayers = [
    {layer_id: 'sky', role: 'background', depth: 1.2, parallax: .04}, {layer_id: 'city', role: 'midground', depth: .8, parallax: .16},
    {layer_id: 'platform', role: 'contact-receiver', depth: .4, parallax: .48}, {layer_id: 'character', role: 'actor', depth: .2, parallax: 1},
    {layer_id: 'foreground-occluder', role: 'occlusion', depth: .08, parallax: 1.12}
  ];
  const field = {
    format: SCENE_FIELD_FORMAT, version: NATIVE_VISUAL_VERSION, scene_field_id: `scene:${shotId}`, shot_id: shotId,
    coordinate_system: {up: 'y', right: 'x', forward: 'z', units: 'meters'}, bounds: {min: [-2, 0, -1], max: [2, 2.2, 1]},
    projection: {kind: 'perspective-2.5d', focal_depth: .2, vanishing_point: [.52, .45]}, camera, depth_layers: depthLayers,
    anchors: {character_contact: [0, 0, .2], character_head: [0, 1.7, .2], platform_horizon: [0, .08, .4], occlusion_path: [-.82, .3, .08]},
    occlusion: [{occluder_id: 'foreground-occluder', z: .08, active_frames: [54, 96], shape: 'left-rail-crossing', coverage: .16}],
    atmosphere: {fog: .08, depth_desaturation: .2, wind_direction: [-.25, 0, .1]}, lights, shadow_receivers: ['platform', 'character-contact'],
    composition: {shot_size: 'medium-upper-body', view: 'three-quarter', safe_area: [.08, .06, .84, .88], contact_required: true, perspective_required: true},
    ...lifecycleFields({provenance: {source: 'Episode Shot Intent', shot_id: shotId}, dependencies: [shotId, camera.camera_root], authority: 'RNCS derived scene structure', rollback: 'restore-shot-intent-root'}),
    scene_root: ''
  };
  return seal(field, 'scene_root');
}

export function resolveSceneFrame(scene, frameNumber) {
  const total = Math.max(1, Math.round(scene.camera.fps * 5));
  const t = Math.max(0, Math.min(1, frameNumber / (total - 1)));
  const eased = smooth(t);
  const start = scene.camera.start, end = scene.camera.end;
  const camera = {frame: frameNumber, x: round(start.x + (end.x - start.x) * eased), y: round(start.y + (end.y - start.y) * eased), z: round(start.z + (end.z - start.z) * eased), yaw: round(start.yaw + (end.yaw - start.yaw) * eased), pitch: round(start.pitch + (end.pitch - start.pitch) * eased), zoom: round(start.zoom + (end.zoom - start.zoom) * eased), projection: scene.camera.projection};
  const occlusion = scene.occlusion.map(item => ({...item, active: frameNumber >= item.active_frames[0] && frameNumber <= item.active_frames[1]}));
  const parallax = Object.fromEntries(scene.depth_layers.map(item => [item.layer_id, round((camera.x + camera.y) * item.parallax)]));
  return seal({format: 'rncs.scene-frame.v0.1', version: NATIVE_VISUAL_VERSION, scene_root: scene.scene_root, frame: frameNumber, camera, parallax, occlusion, contact: {receiver: 'platform', actor_anchor: scene.anchors.character_contact, shadow_offset: [round(camera.x * .12), .012, 0], valid: true}, lighting: {light_root: rootHash(scene.lights), exposure: round(1 + eased * .035)}, depth_root: rootHash({depth_layers: scene.depth_layers, frame: frameNumber}), scene_frame_root: ''}, 'scene_frame_root');
}

export function validateSceneStructureField(scene) {
  const errors = [];
  if (scene?.format !== SCENE_FIELD_FORMAT) errors.push('SCENE_FIELD_FORMAT_INVALID');
  if (!scene?.camera?.camera_root) errors.push('SCENE_CAMERA_ROOT_MISSING');
  if ((scene?.depth_layers ?? []).length < 4) errors.push('SCENE_DEPTH_LAYERS_INCOMPLETE');
  if (!scene?.composition?.perspective_required) errors.push('SCENE_PERSPECTIVE_REQUIRED');
  if (!scene?.composition?.contact_required) errors.push('SCENE_CONTACT_REQUIRED');
  if (!scene?.occlusion?.length) errors.push('SCENE_OCCLUSION_REQUIRED');
  return {valid: errors.length === 0, errors, scene_root: scene?.scene_root ?? null, depth_layer_count: scene?.depth_layers?.length ?? 0};
}
