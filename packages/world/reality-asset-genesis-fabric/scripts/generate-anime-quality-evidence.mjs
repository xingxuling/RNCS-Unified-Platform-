import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {generateAnimeCharacterFamily,rootHash,seal,validateAnimeCharacterFamily} from '../src/index.mjs';

const DEFAULT_OUT='tmp/ragf-anime-quality-evidence-v0.4';
const option=(name)=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:null;};
const outputDirectory=resolve(process.cwd(),option('--out')??DEFAULT_OUT);
const writeJson=async(file,value)=>writeFile(file,`${JSON.stringify(value,null,2)}\n`,'utf8');
const sha256=content=>createHash('sha256').update(content).digest('hex');

async function writeFamily(directory,label,result){
  await mkdir(directory,{recursive:true});
  const artifacts=[];
  for(const [name,file] of Object.entries(result.files)){
    const target=resolve(directory,name);
    await mkdir(dirname(target),{recursive:true});
    const content=file.encoding==='base64'?Buffer.from(file.content,'base64'):Buffer.from(file.content,'utf8');
    await writeFile(target,content);
    artifacts.push({path:`${label}/${name}`,mime:file.mime,bytes:content.length,sha256:sha256(content)});
  }
  const familyPath=resolve(directory,'family.json');
  const familyContent=Buffer.from(`${JSON.stringify(result.family,null,2)}\n`,'utf8');
  await writeFile(familyPath,familyContent);
  artifacts.push({path:`${label}/family.json`,mime:'application/json',bytes:familyContent.length,sha256:sha256(familyContent)});
  return{label,family_root:result.family.family_root,asset_root:result.family.asset_root,state_root:result.family.state_root,artifacts};
}

const input={assetId:'character:ragf-quality-evidence',name:'蓝天临',seed:'ragf-anime-quality-v0.4',motion:{fps:12,frame_count:8,blink_frames:[3,4]}};
const idle=generateAnimeCharacterFamily({...input,state:{expression:'neutral',pose:'idle',mouth_shape:'closed',eye_state:'open',gaze_x:0,gaze_y:0}});
const resolved=generateAnimeCharacterFamily({...input,state:{expression:'resolve',pose:'raise',mouth_shape:'o',eye_state:'open',gaze_x:.45,gaze_y:-.1}});
const idleValidation=validateAnimeCharacterFamily(idle.family);
const resolvedValidation=validateAnimeCharacterFamily(resolved.family);

await mkdir(outputDirectory,{recursive:true});
const idleEvidence=await writeFamily(resolve(outputDirectory,'idle'), 'idle', idle);
const resolvedEvidence=await writeFamily(resolve(outputDirectory,'resolve'), 'resolve', resolved);
const evidence=seal({
  format:'ragf.anime-quality-evidence.v0.2',
  version:'0.2.0',
  status:'CANDIDATE',
  evidence_class:'EXECUTABLE_EVIDENCE',
  human_review:'REQUIRED',
  input,
  provider:{id:'ragf.anime-builtin-generator',version:'0.4.0',mode:'builtin-deterministic',authority:'candidate-only'},
  validation:{idle:idleValidation,resolved:resolvedValidation},
  artifacts:{idle:idleEvidence,resolved:resolvedEvidence},
  continuity:{
    identity_root_equal:idle.family.identity_root===resolved.family.identity_root,
    palette_root_equal:idle.family.palette_root===resolved.family.palette_root,
    proportion_root_equal:idle.family.proportion_root===resolved.family.proportion_root,
    appearance_root_equal:idle.family.continuity_bundle.appearance_root===resolved.family.continuity_bundle.appearance_root,
    state_root_changed:idle.family.state_root!==resolved.family.state_root,
    vector_media_changed:idle.family.media_manifest.primary_vector.root!==resolved.family.media_manifest.primary_vector.root,
    raster_media_changed:idle.family.media_manifest.primary_raster.root!==resolved.family.media_manifest.primary_raster.root,
    motion_root_equal:idle.family.motion_root===resolved.family.motion_root,
    motion_sequence_frame_count_equal:idle.family.media_manifest.motion_sequence.frame_count===resolved.family.media_manifest.motion_sequence.frame_count,
    idle_motion_varies:idle.family.quality.temporal.unique_frame_roots>1,
    resolved_motion_varies:resolved.family.quality.temporal.unique_frame_roots>1,
    asset_root_changed:idle.family.asset_root!==resolved.family.asset_root,
  },
  media:{
    idle_png:{file:'idle/front-view.png',bytes:idle.files['front-view.png'].byte_length,width:idle.family.render_contract.canvas.width,height:idle.family.render_contract.canvas.height,non_background_ratio:idle.family.quality.rendered_media.non_background_ratio},
    resolved_png:{file:'resolve/front-view.png',bytes:resolved.files['front-view.png'].byte_length,width:resolved.family.render_contract.canvas.width,height:resolved.family.render_contract.canvas.height,non_background_ratio:resolved.family.quality.rendered_media.non_background_ratio},
    idle_motion:{track:'idle/motion-track.json',frame_pattern:'idle/motion/frame-####.png',frame_count:idle.family.quality.temporal.frame_count,fps:idle.family.quality.temporal.fps,unique_frame_roots:idle.family.quality.temporal.unique_frame_roots},
    resolved_motion:{track:'resolve/motion-track.json',frame_pattern:'resolve/motion/frame-####.png',frame_count:resolved.family.quality.temporal.frame_count,fps:resolved.family.quality.temporal.fps,unique_frame_roots:resolved.family.quality.temporal.unique_frame_roots},
    real_media:true,
    placeholder_frame:false,
  },
  boundaries:{
    experimental_builtin_anime:true,
    commercial_anime_quality_proven:false,
    optional_3d_proxy:'not-implemented',
    human_visual_acceptance_required:true,
  },
  reproduction:{command:'npm run evidence:anime-quality --workspace @taowind/reality-asset-genesis-fabric'},
  evidence_root:'',
},'evidence_root');
await writeJson(resolve(outputDirectory,'evidence-ledger.json'),evidence);
const manifest=[...idleEvidence.artifacts,...resolvedEvidence.artifacts,{path:'evidence-ledger.json',mime:'application/json',bytes:Buffer.byteLength(JSON.stringify(evidence,null,2)+'\n'),sha256:sha256(Buffer.from(JSON.stringify(evidence,null,2)+'\n','utf8'))}].sort((a,b)=>a.path.localeCompare(b.path));
await writeJson(resolve(outputDirectory,'sha256-manifest.json'),{format:'ragf.sha256-manifest.v0.1',files:manifest,manifest_root:rootHash(manifest)});
console.log(JSON.stringify({output:relative(process.cwd(),outputDirectory),evidence_root:evidence.evidence_root,artifacts:manifest.length,valid:idleValidation.valid&&resolvedValidation.valid,continuity:evidence.continuity},null,2));
