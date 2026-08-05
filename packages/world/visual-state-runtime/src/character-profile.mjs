import {createHash} from 'node:crypto';

export const VSR_CHARACTER_VISUAL_PROFILE_FORMAT='vsr.character-visual-profile.v0.1';
export const VSR_CHARACTER_VISUAL_PROFILE_VERSION='0.1.0-alpha.1';

const normalize=value=>{if(value===null||typeof value==='string'||typeof value==='boolean')return value;if(typeof value==='number')return Number.isFinite(value)?(Object.is(value,-0)?0:value):null;if(Array.isArray(value))return value.map(normalize);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())if(value[key]!==undefined)out[key]=normalize(value[key]);return out}return String(value)};
const rootHash=value=>createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
const seal=(value,field='profile_root')=>{const source=structuredClone(value);delete source[field];return{...structuredClone(value),[field]:rootHash(source)}};

export function createCharacterVisualProfile({genome,identitySignature,projectionModes=[]}={}){
  if(!genome?.character_id||!identitySignature?.signature_root)throw Object.assign(new Error('VSR_CHARACTER_BINDING_INPUT_REQUIRED'),{code:'VSR_CHARACTER_BINDING_INPUT_REQUIRED'});
  const modes=Object.fromEntries(projectionModes.map(item=>[item.mode,{projection_root:item.projection_root,identity_signature_root:item.identity_signature_root}]));
  return seal({format:VSR_CHARACTER_VISUAL_PROFILE_FORMAT,version:VSR_CHARACTER_VISUAL_PROFILE_VERSION,profile_id:`character-visual:${genome.character_id}`,character_id:genome.character_id,genome_root:genome.genome_root,identity_root:genome.identity_root,identity_signature_root:identitySignature.signature_root,topology_family:genome.topology_family,modes,default_mode:'3d-assisted-2d',npr:{style_profile:genome.style_genome.style_profile,line_profile:genome.style_genome.line_profile,shadow_bands:3,anti_aliasing:'supersampled-deterministic',palette:structuredClone(genome.style_genome.palette)},render_passes:{color:'3d-assisted-2d/color.png',line:'3d-assisted-2d/line.png',shadow:'3d-assisted-2d/shadow.png',depth:'3d-assisted-2d/depth.png',normal:'3d-assisted-2d/normal.png',motion:'3d-assisted-2d/motion.png',correction:'3d-assisted-2d/correction-overlay.svg'},camera:{views:['front','side','back','closeup','turntable'],projection_units:'normalized-character-space'},authority:{identity:'RNCS Character Genome',presentation:'VSR',identity_mutation:'forbidden'},quality_boundary:'Deterministic reference raster and GLB profile; GPU target acceptance remains external',profile_root:''});
}

export function resolveCharacterVisualProjection(profile,{mode=profile?.default_mode??'3d-assisted-2d',view='front'}={}){
  const selected=profile?.modes?.[mode];if(!selected)throw Object.assign(new Error(`VSR_CHARACTER_MODE_UNAVAILABLE:${mode}`),{code:'VSR_CHARACTER_MODE_UNAVAILABLE'});
  const viewAsset=mode==='native-2d'?`native-2d/${view==='closeup'?'face':view}.svg`:mode==='2.5d'?'2.5d/manifest.json':view==='turntable'?'turntable/frame-01.png':profile.render_passes.color;
  const resolved={format:'vsr.character-projection-binding.v0.1',character_id:profile.character_id,identity_signature_root:profile.identity_signature_root,mode,view,projection_root:selected.projection_root,asset:viewAsset,profile_root:profile.profile_root,authority:'VSR presentation only'};return{...resolved,binding_root:rootHash(resolved)};
}

export function validateCharacterVisualProfile(profile){
  const errors=[];if(profile?.format!==VSR_CHARACTER_VISUAL_PROFILE_FORMAT)errors.push('VSR_CHARACTER_PROFILE_FORMAT_INVALID');if(profile?.version!==VSR_CHARACTER_VISUAL_PROFILE_VERSION)errors.push('VSR_CHARACTER_PROFILE_VERSION_INVALID');if(!profile?.identity_signature_root)errors.push('VSR_CHARACTER_IDENTITY_SIGNATURE_REQUIRED');for(const mode of ['native-2d','2.5d','3d-assisted-2d'])if(!profile?.modes?.[mode]?.projection_root)errors.push(`VSR_CHARACTER_MODE_REQUIRED:${mode}`);const copy=structuredClone(profile??{}),actual=copy.profile_root;delete copy.profile_root;if(actual!==rootHash(copy))errors.push('VSR_CHARACTER_PROFILE_ROOT_INVALID');if(profile?.authority?.identity_mutation!=='forbidden')errors.push('VSR_CHARACTER_IDENTITY_AUTHORITY_INVALID');return{valid:errors.length===0,errors,profile_root:profile?.profile_root??null};
}
