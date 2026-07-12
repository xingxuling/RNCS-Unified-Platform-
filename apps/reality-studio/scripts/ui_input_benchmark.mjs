import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createDefaultUITree,createDefaultInputProfile,layoutUITree,InputActionRuntime,moveUIFocus,compileUIInputManifest} from '../src/ui-input.mjs';
import {UnifiedManufacturingSession} from '../src/scene-studio.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const project=JSON.parse(fs.readFileSync(path.join(root,'examples/冰境试炼.unified-project.json'),'utf8'));
const tree=createDefaultUITree(),profile=createDefaultInputProfile();
const data={project:{title:'冰境试炼'},globals:{score:655,message:'取得钥匙并前往出口',paused:false},entities:{player:{health:84}},device:{touch:false,kind:'desktop'}};
const rounds=(fn,n=30)=>{const a=[];for(let i=0;i<n;i++){const t=performance.now();fn();a.push(performance.now()-t);}a.sort((x,y)=>x-y);return{median_ms:+a[Math.floor(a.length/2)].toFixed(4),p95_ms:+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(4),min_ms:+a[0].toFixed(4),max_ms:+a.at(-1).toFixed(4),rounds:n};};
const desktopLayout=rounds(()=>layoutUITree(tree,{width:1280,height:720,data}),300);
const mobileLayout=rounds(()=>layoutUITree(tree,{width:360,height:640,safe_area:{left:0,top:28,right:0,bottom:20},data:{...data,device:{touch:true,kind:'mobile'}}}),300);
const input10k=rounds(()=>{const rt=new InputActionRuntime(profile);for(let i=0;i<10000;i++)rt.sample({keys:i%2?['KeyD']:['Space'],gamepads:[],touches:[]});},12);
const gamepad10k=rounds(()=>{const rt=new InputActionRuntime(profile);for(let i=0;i<10000;i++)rt.sample({keys:[],gamepads:[{axes:[i%2?0.8:-0.8,0],buttons:[{pressed:i%3===0,value:i%3===0?1:0}]}],touches:[]});},12);
const focus10k=rounds(()=>{const l=layoutUITree(tree,{width:360,height:640,data:{...data,device:{touch:true,kind:'mobile'}}});let f=null;for(let i=0;i<10000;i++)f=moveUIFocus(l,f,i%2?'right':'left');},20);
const sessionRaw300=rounds(()=>{const s=new UnifiedManufacturingSession(project);for(let i=0;i<300;i++){s.step({raw:{keys:i%3===0?['KeyD']:i%7===0?['Space']:[],gamepads:[],touches:[]}});s.behavior.runtime.paused=false;}},10);
const session=new UnifiedManufacturingSession(project),layout=session.compileUILayout({width:1280,height:720}),manifest=compileUIInputManifest({projectRoot:session.project.project_root,tree:session.activeUITree(),profile:session.activeInputProfile(),layout});
const result={
  format:'reality-studio.ui-input-benchmark.v1.2',version:'1.2.0-alpha.1',
  environment:{node:process.version,platform:process.platform,arch:process.arch,threading:'single-thread-reference'},
  ui:{nodes:tree.nodes.length,focusable_mobile:layoutUITree(tree,{width:360,height:640,data:{...data,device:{touch:true,kind:'mobile'}}}).focus_order.length,ui_root:tree.ui_root,layout_root:layout.layout_root},
  input:{actions:Object.keys(profile.actions).length,bindings:Object.values(profile.actions).reduce((n,a)=>n+a.bindings.length,0),input_root:profile.input_root},
  benchmarks:{desktop_layout_1280x720:desktopLayout,mobile_layout_360x640:mobileLayout,input_10000_keyboard_frames:input10k,input_10000_gamepad_frames:gamepad10k,focus_10000_moves:focus10k,session_300_raw_input_ticks:sessionRaw300},
  manifest_root:manifest.manifest_root,
  boundary:'Node.js single-thread reference timing. Browser event-loop latency, controller driver latency, physical touch latency and GPU frame time are not included.'
};
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence/UI_INPUT_BENCHMARK_v1.2.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(root,'evidence/UI_INPUT_BENCHMARK_OUTPUT_v1.2.txt'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
