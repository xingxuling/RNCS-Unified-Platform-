#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
import {buildProject,inspectBuild,normalizeBuildRequest,readJson,doctorReport,SUPPORTED_TARGETS} from './index.mjs';
function args(argv){const out={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const k=a.slice(2).replaceAll('-','_'),n=argv[i+1];if(!n||n.startsWith('--'))out[k]=true;else{out[k]=n;i++;}}else out._.push(a);}return out;}
const a=args(process.argv.slice(2)),cmd=a._[0]??'help';
try{
 if(cmd==='build'){
  const config=a.config?readJson(path.resolve(a.config)):{};const targets=a.targets?String(a.targets).split(',').map(x=>x.trim()).filter(Boolean):config.targets;
  const request=normalizeBuildRequest({...config,project_file:a.project??config.project_file,output_dir:a.out??config.output_dir,targets,mode:a.mode??config.mode,quality_profile:a.quality??config.quality_profile,app:{...(config.app??{}),title:a.title??config.app?.title,app_id:a.app_id??config.app?.app_id,version_name:a.version??config.app?.version_name,version_code:a.version_code?Number(a.version_code):config.app?.version_code}});
  const r=buildProject(request);console.log(JSON.stringify(r,null,2));
 }else if(cmd==='verify'){console.log(JSON.stringify(inspectBuild(path.resolve(a.out??'output/build')),null,2));}
 else if(cmd==='doctor'){console.log(JSON.stringify(doctorReport(),null,2));}
 else if(cmd==='targets'){console.log(JSON.stringify({version:'0.2.0-alpha.1',targets:SUPPORTED_TARGETS},null,2));}
 else if(cmd==='init'){
  const file=path.resolve(a.out??'reality-build.json');const config={project_file:'examples/冰境试炼.unified-project.json',output_dir:'output/release',targets:['web-release','web-single','windows-native','android-project'],mode:'release',quality_profile:'balanced',app:{app_id:'com.taowind.frosttrial',title:'冰境试炼',version_name:'0.2.0',version_code:2,orientation:'landscape',fullscreen:true},policy:{missing_asset:'fallback',embed_assets:true,deterministic:true},build_time:'2026-07-02T00:00:00.000Z'};fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');console.log(file);
 }else{console.log(`Reality Build Fabric v0.2\n\n  build --project <unified-project.json> --out <dir> --targets ${SUPPORTED_TARGETS.join(',')}\n  verify --out <dir>\n  doctor\n  targets\n  init --out reality-build.json`);}
}catch(e){console.error(JSON.stringify({ok:false,code:e.code??'ERROR',message:e.message,details:e.details??null},null,2));process.exitCode=1;}
