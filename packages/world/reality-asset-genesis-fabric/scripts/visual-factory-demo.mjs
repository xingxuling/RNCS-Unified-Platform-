import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createVisualIR, createAssetProviderManifest, createVisualCapabilityProfile, planVisualFactory, executeVisualFactoryRCL, toOppVisualCapabilities} from '../src/index.mjs';
import {rootHash} from '../src/canonical.mjs';

const out=resolve(process.argv[2]??'artifacts/visual-factory-v01');
const manifest=createAssetProviderManifest({id:'local:triangle-svg',version:'1',executionMode:'local',capabilities:['visual.rendering'],inputFormats:['ragf.visual-ir.v0.1'],outputFormats:['ragf.visual-ir.v0.1'],representation:{kinds:['character-mesh']},license:'Apache-2.0'});
const profile=createVisualCapabilityProfile(manifest,{operations:[{operation:'rendering',capability_id:'visual.rendering',input_formats:manifest.inputFormats,output_formats:manifest.outputFormats,representation_kinds:['character-mesh'],deterministic:true}]});
const input=createVisualIR({character_id:'fixture:triangle-avatar',identity_root:rootHash({fixture:'triangle-avatar-v1'}),representation_kind:'character-mesh',geometry:{vertices:[[64,8,0],[88,40,0],[40,40,0],[64,42,0],[112,116,0],[16,116,0]],triangles:[[0,1,2],[3,4,5]],material_ids:['blue','blue']},materials:[{id:'blue',color:'#51a8ff'}],provenance:{seed:'42',generator:'fixture',version:'1'}});
let rendered;
const render=({input})=>{
  rendered=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#162032"/>'+input.geometry.triangles.map(t=>'<polygon points="'+t.map(i=>input.geometry.vertices[i].slice(0,2).join(',')).join(' ')+'" fill="#51a8ff"/>').join('')+'</svg>');
  return {ir:createVisualIR({...input,provenance:{seed:input.provenance.seed,generator:manifest.id,version:manifest.version},artifacts:[{id:'preview.svg',sha256:createHash('sha256').update(rendered).digest('hex'),byte_length:rendered.length}]}),artifacts:[{id:'preview.svg',bytes:rendered}]};
};
const plan=planVisualFactory(input,[{manifest,profile}],['rendering']);
const rcl=await executeVisualFactoryRCL(plan,{[manifest.id]:render},{policy:{subjects:{builder:['visual.execute@visual','visual.factory@visual']}}});
const result=rcl.factory_result;
if(result.status!=='LOCAL_CANDIDATE_EXECUTED') throw new Error(JSON.stringify(result));
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'preview.svg'),rendered);
await writeFile(resolve(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
await writeFile(resolve(out,'result.json'),JSON.stringify(result,null,2)+'\n');
await writeFile(resolve(out,'rcl-execution.json'),JSON.stringify(rcl,null,2)+'\n');
await writeFile(resolve(out,'visual-factory.rcl'),rcl.source+'\n');
await writeFile(resolve(out,'opp-capabilities.json'),JSON.stringify(toOppVisualCapabilities(manifest,profile,{issuedAt:'2026-09-08T00:00:00Z'}),null,2)+'\n');
console.log(JSON.stringify({status:result.status,result_root:result.result_root,output:out,visual_acceptance:result.visual_acceptance}));
