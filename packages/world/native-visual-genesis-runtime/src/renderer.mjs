import fs from 'node:fs';
import path from 'node:path';
import {clone, lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal} from './canonical.mjs';
import {compileStyleLaw} from './style.mjs';
import {resolveSceneFrame} from './scene.mjs';
import {createSurface, drawCapsule, drawPolygon, fillEllipse, fillPolygon, fillRect, grayscalePng, strokePolyline, writePng} from './raster.mjs';

const round = value => Number(Number(value).toFixed(6));
const mix = (a, b, amount) => {
  const parse = value => { const raw = String(value).replace('#', '').padEnd(6, '0'); return [0, 2, 4].map(i => parseInt(raw.slice(i, i + 2), 16)); };
  const left = parse(a), right = parse(b), t = Math.max(0, Math.min(1, amount));
  return `#${left.map((v, i) => Math.round(v + (right[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};
const darken = (color, amount=.2) => mix(color, '#000000', amount);
const lighten = (color, amount=.2) => mix(color, '#ffffff', amount);

function project(sceneFrame, point, width, height) {
  const camera = sceneFrame.camera;
  const focal = height * .34 * camera.zoom;
  const perspective = 1 + ((point[2] ?? .2) - .2) * .07;
  return [width * .5 + (point[0] - camera.x) * focal * perspective, height * .78 - (point[1] - camera.y) * focal * perspective];
}
function turnPoint(point, yaw, pivot=[0, 0, 0]) {
  const dx = point[0] - pivot[0], dz = (point[2] ?? 0) - (pivot[2] ?? 0), c = Math.cos(yaw), s = Math.sin(yaw);
  return [pivot[0] + dx * c + dz * s, point[1], pivot[2] - dx * s + dz * c];
}
function bodyPoint(x, y, z, torsoYaw, pivot, localYaw=0) { return turnPoint(turnPoint([x, y, z], torsoYaw, pivot), localYaw, [0, pivot[1], pivot[2]]); }
function screenPoints(scene, points, width, height) { return points.map(point => project(scene, point, width, height)); }
function worldEllipse(scene, center, rx, ry, width, height) {
  const [cx, cy] = project(scene, center, width, height), [rxp] = project(scene, [center[0] + rx, center[1], center[2]], width, height), [, ryp] = project(scene, [center[0], center[1] + ry, center[2]], width, height);
  return [cx, cy, Math.abs(rxp - cx), Math.abs(ryp - cy)];
}
function drawWorldPolygon(surface, scene, points, fill, depth, width, height, options={}) { drawPolygon(surface, screenPoints(scene, points, width, height), fill, depth, options); }
function drawWorldLine(surface, scene, points, color, lineWidth, depth, width, height, options={}) { strokePolyline(surface, screenPoints(scene, points, width, height), color, lineWidth, depth, options); }
function drawWorldEllipse(surface, scene, center, rx, ry, color, depth, width, height, options={}) { const [cx, cy, sx, sy] = worldEllipse(scene, center, rx, ry, width, height); fillEllipse(surface, cx, cy, sx, sy, color, depth, options); }
function drawWorldCapsule(surface, scene, a, b, radius, color, depth, width, height, options={}) {
  const pa = project(scene, a, width, height), pb = project(scene, b, width, height);
  drawCapsule(surface, pa, pb, radius * height * .45, color, depth, options);
}

function drawBackground(surface, scene, width, height) {
  fillRect(surface, 0, 0, width, height, '#d9e1e5', 0, {lightness: .7});
  const sky = screenPoints(scene, [[-3, .9, 1.2], [3, .9, 1.2], [3, 2.8, 1.2], [-3, 2.8, 1.2]], width, height);
  fillPolygon(surface, sky, '#cbd7de', .01, {lightness: .72});
  drawWorldPolygon(surface, scene, [[-2, .6, .95], [-1.3, 1.15, .95], [-.7, .75, .95], [0, 1.2, .95], [.7, .72, .95], [1.5, 1.12, .95], [2, .64, .95], [2, 0, .95], [-2, 0, .95]], '#92a2ad', .05, width, height, {outline: '#71828e', lineWidth: 2, lightness: .52});
  const buildings = [
    [-1.75, .2, .34, .7], [-1.28, .2, .27, .48], [-.78, .2, .38, .88], [-.16, .2, .25, .56], [.38, .2, .4, .78], [.96, .2, .28, .52], [1.42, .2, .42, .72]
  ];
  for (const [x, y, w, h] of buildings) {
    drawWorldPolygon(surface, scene, [[x, y, .78], [x + w, y, .78], [x + w, y + h, .78], [x, y + h, .78]], '#687983', .1, width, height, {outline: '#536672', lineWidth: 2, lightness: .46});
    for (let wx = x + .07; wx < x + w - .03; wx += .12) for (let wy = y + .13; wy < y + h - .06; wy += .16) drawWorldPolygon(surface, scene, [[wx, wy, .77], [wx + .045, wy, .77], [wx + .045, wy + .045, .77], [wx, wy + .045, .77]], '#c1d2dc', .12, width, height, {outline: null, lineWidth: 0, lightness: .78});
  }
  drawWorldPolygon(surface, scene, [[-2, .02, .42], [2, .02, .42], [1.55, .72, .42], [-1.55, .72, .42]], '#485866', .18, width, height, {outline: '#263946', lineWidth: 3, lightness: .32});
  for (let i = -4; i <= 4; i++) drawWorldLine(surface, scene, [[i * .48, .05, .43], [i * .37, .68, .43]], '#7f909a', 1.5, .19, width, height, {lightness: .48});
}

function drawContact(surface, scene, width, height, sceneFrame) {
  const [cx, cy, rx, ry] = worldEllipse(scene, [scene.anchors.character_contact[0] + sceneFrame.camera.x * .12, .025, .25], .31, .035, width, height);
  fillEllipse(surface, cx, cy, rx, ry, '#111923', .32, {alpha: .52, mask: 0, lightness: .16});
}

function drawCharacter(surface, {body, performance, scene, style, width, height}) {
  const p = performance.pose, d = body.dimensions, palette = style.compiled.palette;
  const torsoPivot = [p.weight_shift * .12, d.pelvis_y, .2];
  const torsoYaw = p.torso_yaw, headYaw = p.head_yaw, shoulderFollow = p.shoulder_follow;
  const headRx = d.head_radius * 1.02, headRy = d.head_radius * 1.18;
  const outline = palette.ink;
  const s = body.skeleton.bones;
  const boneById = id => s.find(item => item.bone_id === id);
  const transformedBone = (id, yawOffset=0) => { const item = boneById(id); return [bodyPoint(...item.rest_start, torsoYaw, torsoPivot, yawOffset), bodyPoint(...item.rest_end, torsoYaw, torsoPivot, yawOffset)]; };
  const headCenter = bodyPoint(0, body.rest_landmarks.head[1], .05, torsoYaw, torsoPivot, headYaw);
  const lightness = .66 + p.alertness * .04;

  const hairBack = [];
  const hairOffset = performance.secondary_motion.hair_follow_through;
  const hairTop = headCenter[1] + d.head_radius * 1.05;
  hairBack.push(bodyPoint(-d.head_radius * 1.05, hairTop, -.08, torsoYaw, torsoPivot, headYaw));
  hairBack.push(bodyPoint(d.head_radius * 1.05, hairTop, -.08, torsoYaw, torsoPivot, headYaw));
  hairBack.push(bodyPoint(d.head_radius * 1.15 + hairOffset, headCenter[1] - d.head_radius * 1.1, -.07, torsoYaw, torsoPivot, headYaw));
  hairBack.push(bodyPoint(-d.head_radius * 1.15 + hairOffset, headCenter[1] - d.head_radius * 1.1, -.07, torsoYaw, torsoPivot, headYaw));
  drawWorldPolygon(surface, scene, hairBack, palette.hair, .4, width, height, {outline, lineWidth: 4, lightness: .3});
  const tail = bodyPoint(0, d.pelvis_y - .14 + performance.secondary_motion.costume_follow_through, -.01, torsoYaw, torsoPivot);
  drawWorldPolygon(surface, scene, [bodyPoint(-d.shoulder_half_width, d.chest_y, .01, torsoYaw, torsoPivot), bodyPoint(d.shoulder_half_width, d.chest_y, .01, torsoYaw, torsoPivot), bodyPoint(d.pelvis_width ?? .29, d.pelvis_y, .02, torsoYaw, torsoPivot), tail, bodyPoint(-(d.pelvis_width ?? .29), d.pelvis_y, .02, torsoYaw, torsoPivot)], palette.coat, .48, width, height, {outline, lineWidth: 5, lightness: lightness});
  drawWorldPolygon(surface, scene, [bodyPoint(-.12, d.chest_y - .01, .08, torsoYaw, torsoPivot), bodyPoint(.12, d.chest_y - .01, .08, torsoYaw, torsoPivot), bodyPoint(.08, d.pelvis_y + .05, .09, torsoYaw, torsoPivot), bodyPoint(-.08, d.pelvis_y + .05, .09, torsoYaw, torsoPivot)], palette.coat_shadow, .51, width, height, {outline, lineWidth: 3, lightness: .28});
  drawWorldLine(surface, scene, [bodyPoint(0, d.chest_y - .03, .1, torsoYaw, torsoPivot), bodyPoint(0, d.pelvis_y + .05, .1, torsoYaw, torsoPivot)], palette.coat_light, 2.2, .54, width, height, {lightness: .78});

  const leftUpper = transformedBone('upper_arm_l', -.02 - shoulderFollow * .32), rightUpper = transformedBone('upper_arm_r', .02 + shoulderFollow * .32);
  const leftFore = transformedBone('forearm_l', -.02 - shoulderFollow * .25), rightFore = transformedBone('forearm_r', .02 + shoulderFollow * .25);
  const shoulderRadius = height * .45 * .065, armRadius = height * .45 * .045;
  drawWorldCapsule(surface, scene, ...leftUpper, .065, palette.coat, .55, width, height, {outline, lineWidth: 4, lightness: .52});
  drawWorldCapsule(surface, scene, ...rightUpper, .065, palette.coat, .55, width, height, {outline, lineWidth: 4, lightness: .58});
  drawWorldCapsule(surface, scene, ...leftFore, .05, palette.coat_shadow, .56, width, height, {outline, lineWidth: 3, lightness: .34});
  drawWorldCapsule(surface, scene, ...rightFore, .05, palette.coat_shadow, .56, width, height, {outline, lineWidth: 3, lightness: .39});
  for (const id of ['hand_l', 'hand_r']) { const boneItem = transformedBone(id); drawWorldEllipse(surface, scene, boneItem[1], .055, .07, palette.skin, .59, width, height, {mask: 255, lightness: .62}); }

  drawWorldPolygon(surface, scene, [bodyPoint(-.09, d.chest_y + .02, .16, torsoYaw, torsoPivot), bodyPoint(.09, d.chest_y + .02, .16, torsoYaw, torsoPivot), bodyPoint(.07, d.chest_y - .13, .16, torsoYaw, torsoPivot), bodyPoint(-.07, d.chest_y - .13, .16, torsoYaw, torsoPivot)], palette.skin, .58, width, height, {outline, lineWidth: 3, lightness: .65});
  const face = [];
  for (let i = 0; i < 16; i++) { const angle = Math.PI * 2 * i / 16; face.push(bodyPoint(Math.cos(angle) * headRx, headCenter[1] + Math.sin(angle) * headRy, .12, torsoYaw, torsoPivot, headYaw)); }
  drawWorldPolygon(surface, scene, face, palette.skin, .62, width, height, {outline, lineWidth: 4, lightness: .68});
  const shadowFace = face.filter(point => point[0] > headCenter[0] - .01).concat([headCenter, bodyPoint(headRx * .1, headCenter[1] - headRy, .13, torsoYaw, torsoPivot, headYaw)]);
  drawWorldPolygon(surface, scene, shadowFace, palette.skin_shadow, .625, width, height, {outline: null, lineWidth: 0, alpha: .55, lightness: .35});
  const faceAnchors = body.facial_rig.anchors;
  const eyeScale = p.eye_openness * (.72 + d.eye_size * .36);
  const eyeL = bodyPoint(faceAnchors.left_eye[0] * (.93 - headYaw * .2), faceAnchors.left_eye[1], .2, torsoYaw, torsoPivot, headYaw);
  const eyeR = bodyPoint(faceAnchors.right_eye[0] * (.93 + headYaw * .2), faceAnchors.right_eye[1], .2, torsoYaw, torsoPivot, headYaw);
  const eyeRadiusX = .033 + d.eye_size * .008, eyeRadiusY = .018 * Math.max(.12, eyeScale);
  for (const eye of [eyeL, eyeR]) {
    drawWorldEllipse(surface, scene, eye, eyeRadiusX, eyeRadiusY, '#f5f7f8', .66, width, height, {mask: 255, lightness: .92});
    const pupil = bodyPoint(eye[0] + p.gaze_x * .018, eye[1] + p.gaze_y * .008, .23, torsoYaw, torsoPivot, headYaw);
    drawWorldEllipse(surface, scene, pupil, .011, .014 * Math.max(.3, eyeScale), palette.eye, .68, width, height, {mask: 255, lightness: .38});
    drawWorldEllipse(surface, scene, [pupil[0], pupil[1], pupil[2] + .01], .004, .006, outline, .69, width, height, {mask: 255, lightness: .18});
  }
  const browL = bodyPoint(faceAnchors.left_brow[0], faceAnchors.left_brow[1] + p.brow_raise * .035, .22, torsoYaw, torsoPivot, headYaw), browR = bodyPoint(faceAnchors.right_brow[0], faceAnchors.right_brow[1] + p.brow_raise * .035, .22, torsoYaw, torsoPivot, headYaw);
  drawWorldLine(surface, scene, [[browL[0] - .035, browL[1], browL[2]], [browL[0] + .035, browL[1] + .006, browL[2]]], outline, 3, .7, width, height, {lightness: .18});
  drawWorldLine(surface, scene, [[browR[0] - .035, browR[1] + .006, browR[2]], [browR[0] + .035, browR[1], browR[2]]], outline, 3, .7, width, height, {lightness: .18});
  const nose = bodyPoint(faceAnchors.nose[0] + headYaw * .018, faceAnchors.nose[1], .24, torsoYaw, torsoPivot, headYaw);
  drawWorldLine(surface, scene, [[nose[0], nose[1] + .035, nose[2]], [nose[0] + .012, nose[1] - .01, nose[2]], [nose[0] + .03, nose[1] - .018, nose[2]]], palette.skin_shadow, 2, .71, width, height, {lightness: .32});
  const mouth = bodyPoint(faceAnchors.mouth[0] + headYaw * .02, faceAnchors.mouth[1], .24, torsoYaw, torsoPivot, headYaw);
  const mouthHeight = .008 + p.jaw_open * .05;
  drawWorldEllipse(surface, scene, mouth, .035 + d.mouth_width * .01, mouthHeight, p.mouth_shape === 'closed' ? palette.skin_shadow : outline, .72, width, height, {mask: 255, lightness: .22});
  if (p.mouth_shape !== 'closed') drawWorldLine(surface, scene, [[mouth[0] - .028, mouth[1], mouth[2] + .01], [mouth[0] + .028, mouth[1], mouth[2] + .01]], palette.skin, 1.5, .73, width, height, {lightness: .66});

  const bang = (x, offset, side) => [bodyPoint(x - side * .025, hairTop, .27, torsoYaw, torsoPivot, headYaw), bodyPoint(x + side * .035, headCenter[1] + .1 + offset, .28, torsoYaw, torsoPivot, headYaw), bodyPoint(x + side * .01, headCenter[1] + .055 + offset, .27, torsoYaw, torsoPivot, headYaw)];
  for (const [x, offset, side] of [[-.14, hairOffset * .18, -1], [-.07, hairOffset * .25, -1], [0, hairOffset * .3, 1], [.08, hairOffset * .22, 1], [.15, hairOffset * .1, 1]]) drawWorldPolygon(surface, scene, bang(x, offset, side), palette.hair, .75, width, height, {outline, lineWidth: 2, lightness: .32});
  drawWorldPolygon(surface, scene, [bodyPoint(-headRx * .98, headCenter[1] + .13, .26, torsoYaw, torsoPivot, headYaw), bodyPoint(-headRx * .76, headCenter[1] + .04, .27, torsoYaw, torsoPivot, headYaw), bodyPoint(-headRx * .9, headCenter[1] - .09, .26, torsoYaw, torsoPivot, headYaw)], palette.hair, .75, width, height, {outline, lineWidth: 2, lightness: .3});
  drawWorldPolygon(surface, scene, [bodyPoint(headRx * .98, headCenter[1] + .13, .26, torsoYaw, torsoPivot, headYaw), bodyPoint(headRx * .76, headCenter[1] + .04, .27, torsoYaw, torsoPivot, headYaw), bodyPoint(headRx * .9, headCenter[1] - .09, .26, torsoYaw, torsoPivot, headYaw)], palette.hair, .75, width, height, {outline, lineWidth: 2, lightness: .3});
  drawWorldLine(surface, scene, [bodyPoint(-.12, hairTop - .02, .3, torsoYaw, torsoPivot, headYaw), bodyPoint(-.05, hairTop + .035, .3, torsoYaw, torsoPivot, headYaw)], palette.hair_light, 2, .77, width, height, {lightness: .65});
  drawWorldLine(surface, scene, [bodyPoint(.02, hairTop + .005, .3, torsoYaw, torsoPivot, headYaw), bodyPoint(.1, hairTop + .035, .3, torsoYaw, torsoPivot, headYaw)], palette.hair_light, 2, .77, width, height, {lightness: .65});
  drawWorldPolygon(surface, scene, [bodyPoint(-.13, d.chest_y + .03, .25, torsoYaw, torsoPivot), bodyPoint(.13, d.chest_y + .03, .25, torsoYaw, torsoPivot), bodyPoint(.09, d.chest_y - .09, .26, torsoYaw, torsoPivot), bodyPoint(0, d.chest_y - .15, .26, torsoYaw, torsoPivot), bodyPoint(-.09, d.chest_y - .09, .26, torsoYaw, torsoPivot)], palette.coat_shadow, .79, width, height, {outline, lineWidth: 3, lightness: .25});
  drawWorldLine(surface, scene, [bodyPoint(-.09, d.chest_y - .01, .27, torsoYaw, torsoPivot), bodyPoint(0, d.chest_y - .07, .27, torsoYaw, torsoPivot), bodyPoint(.09, d.chest_y - .01, .27, torsoYaw, torsoPivot)], palette.coat_light, 2, .8, width, height, {lightness: .76});
  return {body_root: body.body_graph_root, identity_root: body.identity_root, rendered_regions: body.regions.map(item => item.region_id), contact: true};
}

function drawForeground(surface, scene, width, height, sceneFrame) {
  if (!sceneFrame.occlusion.some(item => item.active)) return false;
  drawWorldPolygon(surface, scene, [[-1.1, 0, .75], [-.88, 0, .75], [-.68, 2.25, .75], [-.9, 2.25, .75]], sceneFrame.occlusion[0].active ? '#1a2a37' : '#000000', .92, width, height, {outline: '#10202b', lineWidth: 4, alpha: .92, lightness: .2});
  drawWorldLine(surface, scene, [[-.82, 0, .78], [-.72, 2.15, .78]], '#91a6b5', 2, .94, width, height, {lightness: .65});
  return true;
}

export function renderNativeFrame({body, performance, scene, style, frameNumber, width=1280, height=720}) {
  const sceneFrame = resolveSceneFrame(scene, frameNumber);
  const resolvedScene = {...scene, ...sceneFrame};
  const surface = createSurface(width, height, {background: style.compiled.palette.background});
  drawBackground(surface, resolvedScene, width, height);
  drawContact(surface, resolvedScene, width, height, resolvedScene);
  const bodyReceipt = drawCharacter(surface, {body, performance, scene: resolvedScene, style, width, height});
  const occluded = drawForeground(surface, resolvedScene, width, height, resolvedScene);
  const styleFrame = compileStyleLaw(style, {lightness: .66 + performance.pose.alertness * .04, depth: .2});
  const layerManifest = ['sky', 'city', 'platform', 'character', ...(occluded ? ['foreground-occluder'] : [])].map((layer, index) => ({layer_id: layer, order: index, visible: true, root: rootHash({layer, frameNumber, scene_root: resolvedScene.scene_root ?? scene.scene_root})}));
  const frameState = {
    format: 'rncs.native-frame-state.v0.1', version: NATIVE_VISUAL_VERSION, frame_number: frameNumber, width, height, fps: 24,
    identity_root: body.identity_root, body_graph_root: body.body_graph_root, performance_frame_root: performance.performance_frame_root, scene_frame_root: resolvedScene.scene_frame_root ?? scene.scene_root, style_root: style.style_root,
    body_receipt: bodyReceipt, camera: clone(resolvedScene.camera), occlusion_active: occluded, style_band: styleFrame.band, layer_manifest: layerManifest,
    motion_vector: performance.motion_vector, depth_root: rootHash(Buffer.from(surface.depth)), mask_root: rootHash(Buffer.from(surface.mask)), line_root: rootHash(Buffer.from(surface.line)), light_root: rootHash(Buffer.from(surface.light)),
    render_backend: 'rncs-native-2d25d-cpu', render_root: ''
  };
  frameState.render_root = rootHash({...frameState, render_root: undefined});
  return {surface, frame_state: frameState, scene_frame: resolvedScene, native_frame_root: frameState.render_root};
}

export function writeNativeFrameArtifacts({outDir, frameNumber, rendered}) {
  const frameName = `frame-${String(frameNumber + 1).padStart(6, '0')}.png`;
  const paths = {color: path.join(outDir, 'frames', frameName), depth: path.join(outDir, 'depth', frameName), mask: path.join(outDir, 'masks', frameName), line: path.join(outDir, 'lines', frameName), light: path.join(outDir, 'lights', frameName)};
  writePng(paths.color, {width: rendered.surface.width, height: rendered.surface.height, pixels: rendered.surface.color});
  grayscalePng(paths.depth, rendered.surface.width, rendered.surface.height, rendered.surface.depth);
  grayscalePng(paths.mask, rendered.surface.width, rendered.surface.height, rendered.surface.mask);
  grayscalePng(paths.line, rendered.surface.width, rendered.surface.height, rendered.surface.line);
  grayscalePng(paths.light, rendered.surface.width, rendered.surface.height, rendered.surface.light);
  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, value.replaceAll('\\', '/')]))
}

export function createNativeRenderPlan({episodeIntentRoot, shotIntentRoot, body, performance, scene, style, width=1280, height=720, fps=24, frameCount=120}) {
  return seal({format: 'rncs.native-render-plan.v0.1', version: NATIVE_VISUAL_VERSION, render_plan_id: `render-plan:${shotIntentRoot}`, episode_intent_root: episodeIntentRoot, shot_intent_root: shotIntentRoot, body_graph_root: body.body_graph_root, performance_root: performance.performance_root, scene_root: scene.scene_root, style_root: style.style_root, backend: 'rncs-native-2d25d-cpu', resolution: {width, height}, fps, frame_count: frameCount, outputs: ['color', 'depth', 'mask', 'line', 'light'], ...lifecycleFields({provenance: {source: 'Native Visual Genesis Kernel', shot_intent_root: shotIntentRoot}, dependencies: [episodeIntentRoot, shotIntentRoot, body.body_graph_root, performance.performance_root, scene.scene_root, style.style_root], authority: 'RNCS derived native render plan', rollback: 'restore-shot-intent-root'}), render_plan_root: ''}, 'render_plan_root');
}
