import {assertValidCharacterGenome, createCharacterGenome} from '../../character-genome-runtime/src/contracts.mjs';
import {createCharacterIdentitySignature} from '../../character-genome-runtime/src/continuity.mjs';
import {clone, lifecycleFields, NATIVE_VISUAL_AUTHORITY, NATIVE_VISUAL_VERSION, rootHash, seal, verifySeal} from './canonical.mjs';

export const VISUAL_GENOME_FORMAT = 'rncs.character-visual-genome.v0.1';

const parameter = (genome, id, fallback) => Number(genome.semantic_morph_graph.parameters.find(item => item.parameter_id === id)?.normalized_value ?? fallback);
const positive = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

function paletteFor(genome) {
  const palette = genome.style_genome?.palette ?? {};
  return {
    skin: palette.skin ?? '#d8c7bd',
    skin_shadow: palette.skin_shadow ?? '#a67f78',
    hair: palette.hair ?? genome.appearance_loadout?.hair_color ?? '#11151d',
    hair_light: palette.hair_light ?? '#5d7287',
    eye: palette.eye ?? genome.appearance_loadout?.eye_color ?? '#4f86c6',
    coat: palette.base ?? '#17253d',
    coat_shadow: palette.secondary ?? '#0d1424',
    coat_light: palette.trim ?? '#d8e3ef',
    accent: palette.emblem ?? '#5f91c4',
    ink: palette.ink ?? '#0b111b',
    background: '#d9e1e5',
    background_deep: '#566875',
    foreground: '#162431'
  };
}

export function createCharacterVisualGenome({genome: inputGenome=null, seed='native-visual-v0.1', name='Native Actor', visualPatch={}}={}) {
  const genome = inputGenome ?? createCharacterGenome({seed, name});
  assertValidCharacterGenome(genome);
  const signature = createCharacterIdentitySignature(genome);
  const proportions = {
    height_m: positive(genome.physical_profile?.height_m, 1.82),
    head_body_ratio: Number(visualPatch.head_body_ratio ?? parameter(genome, 'body.head_body_ratio', .52)),
    shoulder_width: Number(visualPatch.shoulder_width ?? parameter(genome, 'body.shoulder_width', .55)),
    torso_length: Number(visualPatch.torso_length ?? parameter(genome, 'body.torso_length', .5)),
    limb_ratio: Number(visualPatch.limb_ratio ?? parameter(genome, 'body.limb_ratio', .56)),
    neck_length: .08 + parameter(genome, 'body.neck_length', .5) * .04,
    pelvis_width: .24 + parameter(genome, 'body.shoulder_width', .55) * .08,
    arm_thickness: .045 + parameter(genome, 'body.shoulder_width', .55) * .025,
    face_width: Number(visualPatch.face_width ?? parameter(genome, 'face.face_width', .47)),
    face_length: Number(visualPatch.face_length ?? parameter(genome, 'face.face_length', .56)),
    eye_size: Number(visualPatch.eye_size ?? parameter(genome, 'face.eye_size', .48)),
    eye_spacing: Number(visualPatch.eye_spacing ?? parameter(genome, 'face.eye_spacing', .48)),
    jaw_width: Number(visualPatch.jaw_width ?? parameter(genome, 'face.jaw_width', .42)),
    mouth_width: Number(visualPatch.mouth_width ?? parameter(genome, 'face.mouth_width', .51))
  };
  const visual = {
    format: VISUAL_GENOME_FORMAT,
    version: NATIVE_VISUAL_VERSION,
    visual_genome_id: `visual-genome:${rootHash({genome_root: genome.genome_root, seed}) .slice(0, 24)}`,
    character_id: genome.character_id,
    genome_id: genome.genome_id,
    source_genome_root: genome.genome_root,
    identity_root: genome.identity_root,
    identity_signature: signature,
    seed: String(genome.lineage?.seed ?? seed),
    proportions,
    face: {
      eye_style: genome.appearance_loadout?.eye_style ?? 'calm-sharp',
      brow_style: genome.appearance_loadout?.brow_style ?? 'restrained-straight',
      face_profile: genome.identity_genome?.face_profile ?? 'semantic-parameterized',
      eye_depth: parameter(genome, 'face.eye_depth', .5),
      nose_bridge: parameter(genome, 'face.nose_bridge', .5),
      jaw_definition: parameter(genome, 'face.jaw_definition', .5),
      chin_projection: parameter(genome, 'face.chin_projection', .5)
    },
    hair: {
      family: genome.appearance_loadout?.hair_family ?? 'black-wavy-medium',
      color: genome.appearance_loadout?.hair_color ?? '#11151d',
      front_groups: 5,
      back_groups: 3,
      follow_through: 'lagged-angle-spring',
      front_strand_clearance: Number(visualPatch.front_strand_clearance ?? .024)
    },
    costume: {
      family: genome.appearance_loadout?.costume_family ?? 'lan-default-v1',
      variant: genome.appearance_loadout?.costume_variant ?? 'default',
      panels: ['collar', 'chest', 'sleeve_l', 'sleeve_r', 'coat_tail'],
      follow_through: 'delayed-body-chain'
    },
    palette: paletteFor(genome),
    materials: {
      skin: {response: 'soft-cel', shadow_mix: .28},
      hair: {response: 'graphic-highlight', shadow_mix: .44},
      cloth: {response: 'matte-cel', shadow_mix: .36},
      metal: {response: 'sharp-accent', shadow_mix: .55}
    },
    line_law: {profile: genome.style_genome?.line_profile ?? 'stable-ink-v0.1', base_px: 4, depth_falloff: .32, curvature_gain: .18},
    deformation_law: {mode: 'bounded-joint-deformation', max_joint_angle_rad: .62, preserve_identity: true},
    invariants: {
      character_id: genome.character_id,
      identity_root: genome.identity_root,
      topology_family: genome.topology_family,
      palette_root: rootHash(paletteFor(genome)),
      immutable: ['character_id', 'identity_root', 'topology_family', 'identity_signature.signature_root']
    },
    ...lifecycleFields({
      provenance: {source: 'Character Genome Runtime', source_genome_root: genome.genome_root, generator: 'native-visual-genesis-runtime'},
      dependencies: [genome.genome_root, genome.identity_root, signature.signature_root],
      authority: `${NATIVE_VISUAL_AUTHORITY} derived visual projection`,
      rollback: 'restore-character-genome-root'
    }),
    visual_genome_root: ''
  };
  return seal(visual, 'visual_genome_root');
}

export function validateCharacterVisualGenome(visual) {
  const errors = [];
  if (visual?.format !== VISUAL_GENOME_FORMAT) errors.push('VISUAL_GENOME_FORMAT_INVALID');
  for (const field of ['visual_genome_id', 'character_id', 'source_genome_root', 'identity_root', 'identity_signature', 'proportions', 'palette', 'invariants', 'visual_genome_root']) if (!visual?.[field]) errors.push(`VISUAL_GENOME_REQUIRED:${field}`);
  if (visual && !verifySeal(visual, 'visual_genome_root')) errors.push('VISUAL_GENOME_ROOT_MISMATCH');
  if (visual?.invariants?.identity_root !== visual?.identity_root) errors.push('VISUAL_GENOME_IDENTITY_INVARIANT_MISMATCH');
  if (visual?.identity_signature?.character_id !== visual?.character_id) errors.push('VISUAL_GENOME_SIGNATURE_CHARACTER_MISMATCH');
  return {valid: errors.length === 0, errors, visual_genome_root: visual?.visual_genome_root ?? null, identity_root: visual?.identity_root ?? null};
}

export function assertValidCharacterVisualGenome(visual) {
  const result = validateCharacterVisualGenome(visual);
  if (!result.valid) throw new Error(`CHARACTER_VISUAL_GENOME_INVALID:${result.errors.join(',')}`);
  return visual;
}

export function cloneVisualGenome(visual, patch={}) {
  const next = clone(visual);
  Object.assign(next, patch);
  next.visual_genome_root = '';
  return seal(next, 'visual_genome_root');
}
