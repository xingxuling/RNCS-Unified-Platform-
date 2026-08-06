import {clone, lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal, verifySeal} from './canonical.mjs';
import {assertValidCharacterVisualGenome} from './visual-genome.mjs';

export const BODY_GRAPH_FORMAT = 'rncs.character-body-graph.v0.1';
const point = (x, y, z=0) => [Number(x.toFixed(6)), Number(y.toFixed(6)), Number(z.toFixed(6))];

function bone(id, parent, a, b, limits={}) {
  return {bone_id: id, parent_bone_id: parent, rest_start: point(...a), rest_end: point(...b), length: Number(Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0)).toFixed(6)), limits: {min: limits.min ?? -.62, max: limits.max ?? .62, axes: limits.axes ?? ['z']}};
}

export function morphogenizeVisualGenome(visualGenome) {
  assertValidCharacterVisualGenome(visualGenome);
  const p = visualGenome.proportions;
  const head = .25 * (.9 + p.head_body_ratio * .2);
  const shoulder = .28 + p.shoulder_width * .18;
  const torso = .45 + p.torso_length * .18;
  const pelvisY = .78;
  const chestY = pelvisY + torso;
  const neckY = chestY + .12;
  const headY = neckY + head * .65;
  const arm = .32 + p.limb_ratio * .20;
  const forearm = .28 + p.limb_ratio * .16;
  const skeleton = {
    format: 'rncs.skeleton-rig.v0.1', version: NATIVE_VISUAL_VERSION, rig_id: `skeleton:${visualGenome.visual_genome_id}`,
    root_bone_id: 'root',
    bones: [
      bone('root', null, [0, 0, 0], [0, .06, 0]), bone('pelvis', 'root', [0, .06, 0], [0, pelvisY, 0]),
      bone('spine', 'pelvis', [0, pelvisY, 0], [0, chestY, 0]), bone('neck', 'spine', [0, chestY, 0], [0, neckY, 0]),
      bone('head', 'neck', [0, neckY, 0], [0, headY, 0], {min: -.48, max: .48}),
      bone('shoulder_l', 'spine', [-.04, chestY - .02, 0], [-shoulder, chestY + .01, 0], {axes: ['z', 'y']}),
      bone('upper_arm_l', 'shoulder_l', [-shoulder, chestY + .01, 0], [-shoulder - .06, chestY - arm, .01], {min: -.85, max: .65}),
      bone('forearm_l', 'upper_arm_l', [-shoulder - .06, chestY - arm, .01], [-shoulder - .04, chestY - arm - forearm, .02], {min: -.95, max: .15}),
      bone('hand_l', 'forearm_l', [-shoulder - .04, chestY - arm - forearm, .02], [-shoulder - .03, chestY - arm - forearm - .09, .02]),
      bone('shoulder_r', 'spine', [.04, chestY - .02, 0], [shoulder, chestY + .01, 0], {axes: ['z', 'y']}),
      bone('upper_arm_r', 'shoulder_r', [shoulder, chestY + .01, 0], [shoulder + .06, chestY - arm, .01], {min: -.65, max: .85}),
      bone('forearm_r', 'upper_arm_r', [shoulder + .06, chestY - arm, .01], [shoulder + .04, chestY - arm - forearm, .02], {min: -.15, max: .95}),
      bone('hand_r', 'forearm_r', [shoulder + .04, chestY - arm - forearm, .02], [shoulder + .03, chestY - arm - forearm - .09, .02])
    ],
    joints: [
      {joint_id: 'neck-turn', bone_id: 'head', type: 'ball', limits: {yaw: [-.62, .62], pitch: [-.35, .35]}},
      {joint_id: 'shoulder-l', bone_id: 'shoulder_l', type: 'hinge', limits: {swing: [-.75, .45]}},
      {joint_id: 'shoulder-r', bone_id: 'shoulder_r', type: 'hinge', limits: {swing: [-.45, .75]}},
      {joint_id: 'elbow-l', bone_id: 'forearm_l', type: 'hinge', limits: {bend: [0, .95]}},
      {joint_id: 'elbow-r', bone_id: 'forearm_r', type: 'hinge', limits: {bend: [0, .95]}}
    ],
    sockets: [{socket_id: 'face-root', bone_id: 'head'}, {socket_id: 'hair-root', bone_id: 'head'}, {socket_id: 'costume-root', bone_id: 'spine'}],
    rig_root: ''
  };
  skeleton.rig_root = rootHash({...skeleton, rig_root: undefined});
  const topology = seal({
    format: 'rncs.body-topology.v0.1', version: NATIVE_VISUAL_VERSION, topology_id: `topology:${visualGenome.visual_genome_id}`,
    family: visualGenome.invariants.topology_family,
    nodes: ['root', 'pelvis', 'spine', 'neck', 'head', 'face', 'eyes', 'brows', 'mouth', 'hair_back', 'hair_front', 'collar', 'coat', 'sleeves', 'hands'],
    edges: skeleton.bones.map(item => ({from: item.parent_bone_id, to: item.bone_id})).filter(item => item.from),
    invariants: {connected: true, manifold_regions: true, preserve_identity_root: visualGenome.identity_root},
    topology_root: ''
  }, 'topology_root');
  const faceRig = seal({format: 'rncs.facial-rig.v0.1', version: NATIVE_VISUAL_VERSION, rig_id: `face-rig:${visualGenome.visual_genome_id}`, head_bone_id: 'head', anchors: {
    left_eye: [-.075, headY + .035, .05], right_eye: [.065, headY + .035, .05], left_brow: [-.075, headY + .085, .045], right_brow: [.065, headY + .085, .045], nose: [.01, headY - .015, .09], mouth: [.015, headY - .085, .065], jaw: [0, headY - .145, 0]
  }, controls: ['gaze_x', 'gaze_y', 'blink', 'brow_raise', 'jaw_open', 'mouth_shape', 'alertness'], facial_anchor_root: ''}, 'facial_anchor_root');
  const hairRig = seal({format: 'rncs.hair-rig.v0.1', version: NATIVE_VISUAL_VERSION, rig_id: `hair-rig:${visualGenome.visual_genome_id}`, parent_bone_id: 'head', groups: [
    {group_id: 'hair_back_l', points: [[-.12, headY + .1, -.04], [-.2, headY - .18, -.03], [-.17, headY - .3, -.02]], stiffness: .65},
    {group_id: 'hair_back_r', points: [[.12, headY + .1, -.04], [.2, headY - .18, -.03], [.17, headY - .3, -.02]], stiffness: .65},
    {group_id: 'bangs_center', points: [[-.08, headY + .16, .05], [0, headY + .04, .08], [.07, headY + .12, .05]], stiffness: .72},
    {group_id: 'bangs_l', points: [[-.16, headY + .14, .04], [-.09, headY - .01, .07], [-.12, headY - .1, .06]], stiffness: .68},
    {group_id: 'bangs_r', points: [[.15, headY + .14, .04], [.08, headY + .01, .07], [.12, headY - .09, .06]], stiffness: .68}
  ], clearance: visualGenome.hair.front_strand_clearance, secondary_motion_chain_id: 'hair-follow-through', hair_rig_root: ''}, 'hair_rig_root');
  const costumeRig = seal({format: 'rncs.costume-rig.v0.1', version: NATIVE_VISUAL_VERSION, rig_id: `costume-rig:${visualGenome.visual_genome_id}`, parent_bone_id: 'spine', panels: [
    {panel_id: 'collar', anchors: ['neck', 'shoulder_l', 'shoulder_r'], stiffness: .88}, {panel_id: 'chest', anchors: ['shoulder_l', 'shoulder_r', 'pelvis'], stiffness: .92},
    {panel_id: 'sleeve_l', anchors: ['shoulder_l', 'upper_arm_l', 'forearm_l'], stiffness: .7}, {panel_id: 'sleeve_r', anchors: ['shoulder_r', 'upper_arm_r', 'forearm_r'], stiffness: .7},
    {panel_id: 'coat_tail', anchors: ['pelvis', 'spine'], stiffness: .58, lag_frames: 5}
  ], costume_rig_root: ''}, 'costume_rig_root');
  const deformation = seal({format: 'rncs.deformation-graph.v0.1', version: NATIVE_VISUAL_VERSION, graph_id: `deformation:${visualGenome.visual_genome_id}`, regions: [
    {region_id: 'torso', influences: ['pelvis', 'spine'], mode: 'volume-preserving'}, {region_id: 'head', influences: ['neck', 'head'], mode: 'ellipsoid-preserving'},
    {region_id: 'sleeves', influences: ['shoulder_l', 'upper_arm_l', 'forearm_l', 'shoulder_r', 'upper_arm_r', 'forearm_r'], mode: 'capsule-chain'},
    {region_id: 'hair', influences: ['head'], mode: 'secondary-chain'}, {region_id: 'coat_tail', influences: ['pelvis', 'spine'], mode: 'secondary-chain'}
  ], constraints: ['preserve-head-eye-line', 'avoid-joint-gap', 'preserve-contact-shadow', 'preserve-identity-silhouette'], deformation_root: ''}, 'deformation_root');
  const regions = [
    {region_id: 'hair_back', layer: 10, material: 'hair', topology: 'ribbon-cluster', depth: -.08}, {region_id: 'torso', layer: 20, material: 'cloth', topology: 'volume-polygon', depth: .02},
    {region_id: 'sleeves', layer: 30, material: 'cloth', topology: 'capsule-chain', depth: .04}, {region_id: 'neck', layer: 40, material: 'skin', topology: 'capsule', depth: .07},
    {region_id: 'head', layer: 50, material: 'skin', topology: 'ellipsoid', depth: .1}, {region_id: 'face_features', layer: 60, material: 'face', topology: 'anchor-glyphs', depth: .13},
    {region_id: 'hair_front', layer: 70, material: 'hair', topology: 'ribbon-cluster', depth: .16}, {region_id: 'costume_detail', layer: 80, material: 'cloth-light', topology: 'panel-lines', depth: .18}
  ];
  const body = {
    format: BODY_GRAPH_FORMAT, version: NATIVE_VISUAL_VERSION, body_graph_id: `body:${visualGenome.visual_genome_id}`, character_id: visualGenome.character_id,
    identity_root: visualGenome.identity_root, visual_genome_root: visualGenome.visual_genome_root,
    dimensions: {height_m: p.height_m, head_radius: head, shoulder_half_width: shoulder, chest_y: chestY, pelvis_y: pelvisY, arm_length: arm + forearm, eye_size: p.eye_size, mouth_width: p.mouth_width, pelvis_width: p.pelvis_width},
    rest_landmarks: {pelvis: point(0, pelvisY, 0), chest: point(0, chestY, 0), head: point(0, headY, 0), contact: point(0, 0, 0)},
    regions, topology, skeleton, facial_rig: faceRig, hair_rig: hairRig, costume_rig: costumeRig, deformation_graph: deformation,
    material_bindings: regions.map(item => ({region_id: item.region_id, material: item.material, palette_root: visualGenome.invariants.palette_root})),
    line_bindings: regions.map(item => ({region_id: item.region_id, law: item.region_id === 'face_features' ? 'facial-internal' : 'contour'})),
    secondary_motion_chains: [{chain_id: 'hair-follow-through', target: 'hair_rig', driver: 'head_yaw_velocity', lag_frames: 3, damping: .72}, {chain_id: 'costume-follow-through', target: 'costume_rig', driver: 'torso_yaw_velocity', lag_frames: 5, damping: .58}],
    invariants: {identity_root: visualGenome.identity_root, topology_root: topology.topology_root, skeleton_root: skeleton.rig_root, connected: true, rest_pose_stable: true},
    ...lifecycleFields({provenance: {source: 'CharacterVisualGenome', visual_genome_root: visualGenome.visual_genome_root}, dependencies: [visualGenome.visual_genome_root, topology.topology_root, skeleton.rig_root, faceRig.facial_anchor_root, hairRig.hair_rig_root, costumeRig.costume_rig_root, deformation.deformation_root], authority: 'RNCS derived renderable body', rollback: 'restore-visual-genome-root'}),
    body_graph_root: ''
  };
  return seal(body, 'body_graph_root');
}

export function validateBodyGraph(body) {
  const errors = [];
  if (body?.format !== BODY_GRAPH_FORMAT) errors.push('BODY_GRAPH_FORMAT_INVALID');
  for (const field of ['body_graph_root', 'identity_root', 'visual_genome_root', 'topology', 'skeleton', 'facial_rig', 'hair_rig', 'costume_rig', 'deformation_graph']) if (!body?.[field]) errors.push(`BODY_GRAPH_REQUIRED:${field}`);
  if (body && !verifySeal(body, 'body_graph_root')) errors.push('BODY_GRAPH_ROOT_MISMATCH');
  const bones = new Set((body?.skeleton?.bones ?? []).map(item => item.bone_id));
  if (!bones.has(body?.skeleton?.root_bone_id)) errors.push('SKELETON_ROOT_MISSING');
  for (const item of body?.skeleton?.bones ?? []) if (item.parent_bone_id && !bones.has(item.parent_bone_id)) errors.push(`SKELETON_PARENT_MISSING:${item.bone_id}`);
  if (body?.invariants?.identity_root !== body?.identity_root) errors.push('BODY_IDENTITY_INVARIANT_MISMATCH');
  return {valid: errors.length === 0, errors, body_graph_root: body?.body_graph_root ?? null, bone_count: body?.skeleton?.bones?.length ?? 0, region_count: body?.regions?.length ?? 0};
}

export function applyBodyRepair(body, patch={}) {
  const next = clone(body);
  if (patch.hair_clearance !== undefined) next.hair_rig.clearance = Number(patch.hair_clearance);
  next.hair_rig.hair_rig_root = '';
  next.hair_rig = seal(next.hair_rig, 'hair_rig_root');
  next.dependencies = next.dependencies.map(root => root === body.hair_rig.hair_rig_root ? next.hair_rig.hair_rig_root : root);
  next.body_graph_root = '';
  return seal(next, 'body_graph_root');
}
