import {lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal} from './canonical.mjs';

export const STYLE_LAW_FORMAT = 'rncs.style-law-set.v0.1';

export function createStyleLawSet({visualGenome, profile='anime-npr-native-v0.1'}={}) {
  const laws = {
    contour: {base_width_px: visualGenome.line_law.base_px, depth_falloff: visualGenome.line_law.depth_falloff, silhouette_priority: 1},
    internal_line: {base_width_px: 2, curvature_gain: visualGenome.line_law.curvature_gain, facial_priority: .92},
    palette: visualGenome.palette,
    cel_shade: {bands: [{threshold: .28, role: 'shadow'}, {threshold: .62, role: 'mid'}, {threshold: .86, role: 'light'}], light_threshold: .62, shadow_threshold: .28},
    rim_light: {enabled: true, intensity: .16, color: visualGenome.palette.hair_light},
    material_response: visualGenome.materials,
    facial_simplification: {eye_scale: 1, mouth_scale: 1, nose_line: true, preserve_anchor_root: visualGenome.identity_signature.signature_root},
    hair_highlight: {direction: 'key-light', bands: 2, temporal_stability: 'rooted'},
    costume_fold: {direction: 'bone-and-light', panels: visualGenome.costume.panels},
    background_detail: {foreground: 1, midground: .72, background: .38},
    depth_desaturation: .2,
    composition: {shot_size: 'medium-upper-body', three_quarter: true},
    exposure: {fps: 24, no_implicit_frame_rewrite: true},
    temporal_stability: {max_palette_delta: .04, max_line_width_delta: .8, preserve_identity_root: true}
  };
  const compiled = {
    profile, contour_width_px: laws.contour.base_width_px, internal_width_px: laws.internal_line.base_width_px,
    cel_thresholds: laws.cel_shade.bands.map(item => item.threshold), palette: laws.palette, light_direction: [-.35, .65, .7],
    shader_policy: 'cpu-raster-cel-quantized', post_policy: 'depth-desaturate-and-rim', compiled_root: rootHash(laws)
  };
  const style = {
    format: STYLE_LAW_FORMAT, version: NATIVE_VISUAL_VERSION, style_law_id: `style:${profile}`, profile, laws, compiled,
    identity_anchor_root: visualGenome.identity_root,
    ...lifecycleFields({provenance: {source: 'Visual Genome Style Law', visual_genome_root: visualGenome.visual_genome_root, identity_root: visualGenome.identity_root}, dependencies: [visualGenome.visual_genome_root, visualGenome.invariants.palette_root], authority: 'RNCS visual projection law', rollback: 'restore-visual-genome-style-root'}),
    style_root: ''
  };
  return seal(style, 'style_root');
}

export function compileStyleLaw(style, {lightness=.72, depth=0}={}) {
  const thresholds = style.laws.cel_shade.bands;
  const band = lightness < thresholds[0].threshold ? 'shadow' : lightness < thresholds[1].threshold ? 'mid' : lightness < thresholds[2].threshold ? 'light' : 'highlight';
  return {style_root: style.style_root, band, line_width_px: Math.max(1, style.compiled.contour_width_px * (1 - depth * style.laws.contour.depth_falloff)), palette: style.compiled.palette, rim: style.laws.rim_light.enabled && lightness > .72};
}

export function validateStyleLawSet(style) {
  const errors = [];
  if (style?.format !== STYLE_LAW_FORMAT) errors.push('STYLE_LAW_FORMAT_INVALID');
  for (const key of ['contour', 'internal_line', 'palette', 'cel_shade', 'temporal_stability']) if (!style?.laws?.[key]) errors.push(`STYLE_LAW_MISSING:${key}`);
  if (style?.identity_anchor_root !== style?.provenance?.identity_root && style?.provenance?.identity_root) errors.push('STYLE_IDENTITY_ANCHOR_MISMATCH');
  return {valid: errors.length === 0, errors, style_root: style?.style_root ?? null, compiled_root: style?.compiled?.compiled_root ?? null};
}
