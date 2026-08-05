import fs from 'node:fs';
import path from 'node:path';
import {compileAnimeSource,buildAnimeControlPlaneCandidate} from './index.mjs';

const args=process.argv.slice(2),sourceFile=args[0],outFlag=args.indexOf('--out'),out=path.resolve(outFlag>=0?(args[outFlag+1]??'output/anime-control-plane'):path.join(path.dirname(sourceFile??'.'),'anime-control-plane'));
if(!sourceFile){console.error('Usage: rncs-anime-control-plane <source.anime.rcl> [--out <dir>]');process.exit(1)}
try{
  const compiled=compileAnimeSource(fs.readFileSync(sourceFile,'utf8')),candidate=await buildAnimeControlPlaneCandidate(compiled,{verifyParity:false});fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'candidate.json'),JSON.stringify(candidate,null,2));fs.writeFileSync(path.join(out,'authority-plan.json'),JSON.stringify(candidate.authority_plan,null,2));
  console.log(JSON.stringify({ok:true,status:candidate.status,candidate_root:candidate.candidate_root,plan_id:candidate.plan_id,candidate_branch:candidate.candidate_branch,state_root:candidate.state_root,commit_permitted:candidate.commit_permitted,out},null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:{code:error.code??'ANIME_CONTROL_PLANE_FAILURE',message:error.message,details:error.details??{}}},null,2));process.exit(1)}
