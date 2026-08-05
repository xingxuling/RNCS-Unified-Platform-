#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {analyzeCharacterGenomeImpact,compareCharacterIdentitySignatures,validateCharacterGenome} from '../../../world/character-genome-runtime/src/index.mjs';
import {compileCharacterPhenotype,rebuildCharacterPhenotype,replayCharacterAsset,rollbackCharacterAsset,snapshotCharacterAsset,verifyCharacterAssetDirectory} from '../../../world/character-phenotype-compiler/src/index.mjs';
import {resolveCharacterVisualProjection} from '../../../world/visual-state-runtime/src/character-profile.mjs';
import {bindCharacterAssetFamily} from '../../../world/anime-production-runtime/src/index.mjs';
import {commitCharacterAsset,compileCharacterGenomeSource,compileCharacterSourceToAssets,tryCompileCharacterGenomeSource} from './index.mjs';

const raw=process.argv.slice(2),nested=raw[0]==='genome',command=nested?raw[1]:raw[0],offset=nested?2:1;
const flag=(name,fallback=null)=>{const index=raw.indexOf(`--${name}`);return index>=0?(raw[index+1]&&!raw[index+1].startsWith('--')?raw[index+1]:true):fallback};
const arg=index=>raw[offset+index];
const json=value=>process.stdout.write(`${JSON.stringify(value,null,2)}\n`);
const readJson=file=>JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`)};
const directory=value=>fs.statSync(path.resolve(value)).isDirectory()?path.resolve(value):path.dirname(path.resolve(value));
const familyAt=value=>{const base=directory(value),file=fs.statSync(path.resolve(value)).isDirectory()?path.join(base,'family.json'):path.resolve(value);return{base,family:readJson(file)}};
const genomeFrom=file=>path.extname(file).toLowerCase()==='.rcl'?compileCharacterGenomeSource(fs.readFileSync(file,'utf8')).genome:readJson(file);
const fail=error=>{json({ok:false,error:{code:error.code??'RNCS_CHARACTER_CLI_ERROR',message:error.message,location:error.location??null,details:error.details??{}}});process.exitCode=1};

try{
  if(!command)throw Object.assign(new Error('Usage: rncs-character [genome] <validate|compile|inspect|generate|preview|project|continuity|impact|rebuild|verify|snapshot|replay|rollback|commit|send-to-anime> ...'),{code:'USAGE'});
  if(command==='validate'){
    const file=arg(0);if(!file)throw Object.assign(new Error('Genome RCL or JSON required'),{code:'GENOME_REQUIRED'});if(path.extname(file).toLowerCase()==='.rcl'){const result=tryCompileCharacterGenomeSource(fs.readFileSync(file,'utf8'));json({ok:result.ok,diagnostics:result.diagnostics??[],genome:result.ok?{character_id:result.genome.character_id,genome_root:result.genome.genome_root,identity_root:result.genome.identity_root,face_parameters:Object.keys(result.genome.identity_genome.identity_parameters).length}:null});if(!result.ok)process.exitCode=1}else{const validation=validateCharacterGenome(readJson(file));json({ok:validation.valid,...validation});if(!validation.valid)process.exitCode=1}
  }else if(command==='compile'){
    const file=arg(0),out=path.resolve(String(flag('out','output/character-genome')));if(!file)throw Object.assign(new Error('Character RCL source required'),{code:'SOURCE_REQUIRED'});const result=compileCharacterSourceToAssets(fs.readFileSync(file,'utf8'),{outDir:out,provider:String(flag('provider','reference'))});json({ok:result.generated.validation.valid,out,character_id:result.compiled.genome.character_id,genome_root:result.compiled.genome.genome_root,identity_root:result.compiled.genome.identity_root,asset_root:result.generated.family.asset_root,family_root:result.generated.family.family_root,provider_receipt_root:result.generated.family.provider_receipt.receipt_root,commit:false});
  }else if(command==='inspect'){
    const genome=genomeFrom(arg(0)),validation=validateCharacterGenome(genome);json({ok:validation.valid,character_id:genome.character_id,genome_id:genome.genome_id,genome_root:genome.genome_root,identity_root:genome.identity_root,topology_family:genome.topology_family,appearance:genome.appearance_loadout,counts:{face_parameters:Object.keys(genome.identity_genome.identity_parameters).length,body_parameters:Object.keys(genome.morphology_genome.body_parameters).length,expressions:genome.expression_profile.morphs.length,visemes:genome.voice_binding.visemes.length},validation});
  }else if(command==='generate'){
    const genome=genomeFrom(arg(0)),out=path.resolve(String(flag('out','output/character-generated'))),result=compileCharacterPhenotype(genome,{outDir:out,provider:String(flag('provider','reference'))});json({ok:result.validation.valid,out,asset_root:result.family.asset_root,family_root:result.family.family_root,quality:result.family.quality,commit:false});
  }else if(command==='preview'){
    const {base,family}=familyAt(arg(0));json({ok:true,character_id:family.character_id,identity_signature_root:family.identity_signature.signature_root,quality_tier:family.quality_tier,artifacts:{portrait:path.join(base,'portrait-preview.png'),anime:path.join(base,'anime-projection.png'),model_sheet:path.join(base,'model-sheet.svg'),turntable:path.join(base,'turntable')},modes:family.cross_media.modes});
  }else if(command==='project'){
    const {base}=familyAt(arg(0)),profile=readJson(path.join(base,'vsr-character-profile.json')),binding=resolveCharacterVisualProjection(profile,{mode:String(flag('mode','native-2d')),view:String(flag('view','front'))}),out=flag('out');if(out)writeJson(path.resolve(String(out)),binding);json({ok:true,...binding,absolute_asset:path.resolve(base,binding.asset)});
  }else if(command==='continuity'){
    const a=familyAt(arg(0)).family,b=familyAt(arg(1)).family,report=compareCharacterIdentitySignatures(a.identity_signature,b.identity_signature,{reason:String(flag('reason','asset-family-comparison'))});json({ok:report.pass,...report});if(!report.pass)process.exitCode=1;
  }else if(command==='impact'){
    const genome=genomeFrom(arg(0)),report=analyzeCharacterGenomeImpact(genome,{change_path:String(flag('change',''))});json({ok:true,...report});
  }else if(command==='rebuild'){
    const workspace=path.resolve(arg(0)),before=readJson(path.join(workspace,'genome.json')),afterFile=flag('genome');if(!afterFile)throw Object.assign(new Error('--genome <updated.json|rcl> required'),{code:'UPDATED_GENOME_REQUIRED'});const after=genomeFrom(String(afterFile)),result=rebuildCharacterPhenotype(before,after,{outDir:workspace,changePath:String(flag('change','full'))});json({ok:result.validation.valid&&result.rebuild_receipt.valid,scope:result.impact.scope,asset_root:result.family.asset_root,rebuild_receipt:result.rebuild_receipt});
  }else if(command==='verify'){
    const report=verifyCharacterAssetDirectory(directory(arg(0)));json({ok:report.ok,...report});if(!report.ok)process.exitCode=1;
  }else if(command==='snapshot'){
    const receipt=snapshotCharacterAsset(directory(arg(0)),String(flag('id','snapshot')));json({ok:true,...receipt});
  }else if(command==='replay'){
    const workspace=directory(arg(0)),genome=readJson(path.join(workspace,'genome.json')),report=replayCharacterAsset(genome,{outDir:workspace,replayDir:path.resolve(String(flag('out',path.join(workspace,'.replay'))))});json({ok:report.valid,...report});if(!report.valid)process.exitCode=1;
  }else if(command==='rollback'){
    const receipt=rollbackCharacterAsset(directory(arg(0)),String(flag('snapshot','')));json({ok:true,...receipt});
  }else if(command==='commit'){
    const workspace=directory(arg(0)),library=path.resolve(String(flag('library','output/character-library'))),receipt=commitCharacterAsset({workspaceDir:workspace,libraryDir:library,approved:flag('approve')===true||flag('approve')==='true'});json({ok:true,...receipt});
  }else if(command==='send-to-anime'){
    const {base,family}=familyAt(arg(0)),productionFile=flag('production');if(!productionFile)throw Object.assign(new Error('--production <production.ir.json> required'),{code:'ANIME_PRODUCTION_REQUIRED'});
    const production=readJson(String(productionFile)),visual=readJson(path.join(base,'vsr-character-profile.json')),body=readJson(path.join(base,'rsr-character-body-profile.json')),bound=bindCharacterAssetFamily(production,family,{actorId:flag('actor'),cutId:flag('cut'),visualProfile:visual,bodyProfile:body});
    const defaultOut=path.join(path.dirname(path.resolve(String(productionFile))),'production.character-bound.ir.json'),out=path.resolve(String(flag('out',defaultOut)));writeJson(out,bound);json({ok:true,out,production_root:bound.production_root,cut_id:bound.cut.cut_id,character_id:family.character_id,family_root:family.family_root,identity_root:family.identity_root});
  }else throw Object.assign(new Error(`Unknown command: ${command}`),{code:'COMMAND_UNKNOWN'});
}catch(error){fail(error)}
