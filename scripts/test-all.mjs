import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'rncs.modules.json'),'utf8'));
const results=[];
const skip=new Set(['autorag','aetherfusion']);
const seenCommands=new Set();
const timeoutMs=Number(process.env.RNCS_TEST_COMMAND_TIMEOUT_MS??240000);
const only=new Set((process.env.RNCS_TEST_ONLY??'').split(',').map(x=>x.trim()).filter(Boolean));
const childEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.toLowerCase().startsWith('npm_')&&!['INIT_CWD','NODE_CHANNEL_FD'].includes(key)));

function tokenize(command){
  const tokens=[];let current='';let quote=null;
  for(const char of command){
    if(quote){if(char===quote)quote=null;else current+=char;continue;}
    if(char==='"'||char==="'"){quote=char;continue;}
    if(/\s/.test(char)){if(current){tokens.push(current);current='';}}else current+=char;
  }
  if(current)tokens.push(current);
  return tokens;
}
async function run(id,command){
  const [rawExecutable,...args]=tokenize(command);
  const executable=process.platform==='win32'&&rawExecutable==='npm'?'npm.cmd':rawExecutable;
  const started=performance.now();
  console.log(`\n===== ${id} =====\n$ ${command}`);
  const result=await new Promise(resolve=>{
    const child=spawn(executable,args,{cwd:root,stdio:'inherit',env:childEnv,windowsHide:true});
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),5000).unref();},timeoutMs);
    child.once('error',error=>{clearTimeout(timer);resolve({status:1,signal:null,timedOut,error:error.message});});
    child.once('close',(code,signal)=>{clearTimeout(timer);resolve({status:timedOut?124:(code??1),signal:signal??null,timedOut,error:null});});
  });
  const elapsedMs=Math.round((performance.now()-started)*1000)/1000;
  const record={id,command,elapsedMs,...result};results.push(record);return record;
}
for(const module of registry.modules.filter(item=>!skip.has(item.id)&&(!only.size||only.has(item.id)))){
  if(seenCommands.has(module.test))continue;
  seenCommands.add(module.test);
  if((await run(module.id,module.test)).status!==0)break;
}
if(!only.size&&results.every(item=>item.status===0)){
  for(const command of ['npm run test:integration','npm run test:e2e']) if((await run(command,command)).status!==0)break;
}
const report={format:'rncs.test-orchestration-report.v0.6',suiteVersion:registry.suiteVersion,commandTimeoutMs:timeoutMs,results,passed:results.filter(item=>item.status===0).length,total:results.length,elapsedMs:Math.round(results.reduce((sum,item)=>sum+item.elapsedMs,0)*1000)/1000};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/test-results.json'),JSON.stringify(report,null,2)+'\n');
if(results.some(item=>item.status!==0))process.exitCode=1;
