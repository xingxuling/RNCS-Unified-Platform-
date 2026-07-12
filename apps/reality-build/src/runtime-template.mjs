import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from './canonical.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const vendor=path.dirname(fileURLToPath(import.meta.resolve('@taowind/reality-behavior-fabric')));

export function buildBrowserBehaviorRuntime(){
  const order=['canonical.mjs','contracts.mjs','expression.mjs','event-bus.mjs','authority.mjs','state-machine.mjs','behavior-tree.mjs','rules.mjs','runtime.mjs'];
  let code='/* Reality Behavior Fabric browser reference runtime · generated */\n(()=>{\n';
  for(const name of order){
    let src=fs.readFileSync(path.join(vendor,name),'utf8');
    src=src.replace(/^import .*?;\s*$/gm,'');
    src=src.replace(/\bexport\s+(?=(class|function|const|let|var)\b)/g,'');
    if(name==='canonical.mjs'){
      src=src.replace(/import \{createHash\} from 'node:crypto';\s*/,'');
      src=src.replace(/const rootHash=value=>createHash\('sha256'\)\.update\(canonicalJson\(value\)\)\.digest\('hex'\);/,
`const rootHash=value=>{const s=canonicalJson(value);let h1=0x811c9dc5,h2=0x9e3779b9;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,0x01000193)>>>0;h2=Math.imul(h2^(c+i),0x85ebca6b)>>>0;}const p=n=>n.toString(16).padStart(8,'0');return (p(h1)+p(h2)).repeat(4);};`);
    }
    code+=`\n/* ${name} */\n${src}\n`;
  }
  code+=`\nwindow.RNCSBehavior={BehaviorRuntime,normalizeProgram,validateProgram,replayProgram};\n})();\n`;
  return code;
}

export function buildGameSource(){return String.raw`/* Reality Build Fabric browser host */
(()=>{
const DATA=window.__REALITY_BUILD__;
const project=DATA.project, assetMap=DATA.assets, build=DATA.build;
const scene=project.scenes.find(s=>s.scene_id===project.active_scene_id)||project.scenes[0];
const rawProgram=structuredClone(project.behavior.programs[project.behavior.active_program_id]);delete rawProgram.program_root;
const {BehaviorRuntime,normalizeProgram}=window.RNCSBehavior;
const program=normalizeProgram(rawProgram);
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});canvas.width=scene.canvas.width;canvas.height=scene.canvas.height;
const keys=new Set(),images={},particles=[];let audioCtx=null,runtime=null,lastTick=0,acc=0,last=performance.now(),paused=false;
const statusEl=document.querySelector('#status'),rootEl=document.querySelector('#root'),messageEl=document.querySelector('#message');
for(const[id,a]of Object.entries(assetMap)){const img=new Image();img.decoding='async';img.src=a.uri;images[id]=img;}
function audioCue(cue='event'){try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();const n=[...String(cue)].reduce((a,c)=>a+c.charCodeAt(0),0);o.frequency.value=180+(n%420);o.type=['sine','triangle','square'][n%3];g.gain.setValueAtTime(.05,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.13);}catch{}}
function burst(input={}){const x=Number(input.x??input.target_x??320),y=Number(input.y??input.target_y??180);for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*(1+i%3),vy:Math.sin(a)*(1+i%3),life:28,color:i%2?'#7dd3fc':'#ffffff'});}}
function createRuntime(){
 runtime=new BehaviorRuntime(program,{providers:{'experience.audio.emit':({inputs})=>{audioCue(inputs.cue);return{played:true}},'experience.effect.emit':({inputs})=>{burst(inputs);return{emitted:true}}}});
 lastTick=runtime.state.tick;paused=false;statusEl.textContent='运行中';
}
createRuntime();
function inputState(){const input={};for(const action of program.input_actions??[])input[action.action_id]=(action.bindings??[]).some(k=>keys.has(k));return input;}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyR')createRuntime();if(e.code==='KeyP'){paused=!paused;statusEl.textContent=paused?'已暂停':'运行中';}});
addEventListener('keyup',e=>keys.delete(e.code));
for(const b of document.querySelectorAll('[data-action]')){const action=b.dataset.action;const bind=program.input_actions?.find(x=>x.action_id===action)?.bindings?.[0]??action;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(bind);audioCtx?.resume?.()});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>keys.delete(bind));}
function tick(){if(paused)return;runtime.tick(inputState());lastTick=runtime.state.tick;if(runtime.state.globals?.defeat||runtime.state.globals?.victory)statusEl.textContent=runtime.state.globals.victory?'胜利':'失败';}
function entityFor(node){const id=node.behavior_binding?.entity_id;return id?runtime.state.entities[id]:null;}
function drawNode(node){const e=entityFor(node),v=e?.variables??{},asset=assetMap[node.asset_id],img=images[node.asset_id];if(node.visible===false||e?.active===false||e?.alive===false)return;if(v.collected===true)return;const x=Number(v.x??node.transform.x),y=Number(v.y??node.transform.y),scale=(node.transform.scale_x_milli??1000)/1000;let w=48*scale,h=64*scale;if(asset?.kind==='prop-2d'){w=h=34*scale}if(asset?.kind==='environment-2d'){w=64*scale;h=88*scale}ctx.save();ctx.translate(x,y);ctx.rotate((node.transform.rotation_mdeg??0)/1000*Math.PI/180);if(img?.complete&&img.naturalWidth){ctx.globalAlpha=v.open===true?.55:1;ctx.drawImage(img,-w/2,-h,w,h);}else{ctx.fillStyle=v.color??'#7dd3fc';ctx.fillRect(-w/2,-h,w,h);}ctx.restore();if(typeof v.health==='number'&&v.max_health){ctx.fillStyle='#07111d';ctx.fillRect(x-22,y-h-8,44,5);ctx.fillStyle=v.health/v.max_health>.35?'#5eead4':'#fb7185';ctx.fillRect(x-22,y-h-8,44*Math.max(0,v.health/v.max_health),5);}}
function drawParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.life--;ctx.globalAlpha=Math.max(0,p.life/28);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);if(p.life<=0)particles.splice(i,1);}ctx.globalAlpha=1;}
function render(){ctx.fillStyle=scene.canvas.background??'#071426';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#17304a';ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=scene.canvas.grid_size??16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=0;y<canvas.height;y+=scene.canvas.grid_size??16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.fillStyle='#17324c';ctx.fillRect(0,canvas.height-60,canvas.width,60);for(const n of [...scene.nodes].sort((a,b)=>(a.z_index??0)-(b.z_index??0)))drawNode(n);drawParticles();ctx.fillStyle='#e6f5ff';ctx.font='bold 18px system-ui';ctx.fillText(project.identity.title,16,27);ctx.fillStyle='#b7d6ea';ctx.font='13px system-ui';const g=runtime.state.globals??{},p=runtime.state.entities.player?.variables??{},enemy=runtime.state.entities.enemy?.variables??{};ctx.fillText('生命 '+(p.health??'-')+'  敌人 '+Math.max(0,enemy.health??0)+'  分数 '+(g.score??0)+'  Tick '+runtime.state.tick,16,50);messageEl.textContent=g.message??g.quest??'';rootEl.textContent=runtime.stateRoot().slice(0,16);if(g.victory||g.defeat){ctx.fillStyle='#04101de8';ctx.fillRect(canvas.width/2-155,canvas.height/2-55,310,110);ctx.fillStyle=g.victory?'#74f2ce':'#fb7185';ctx.font='bold 30px system-ui';ctx.textAlign='center';ctx.fillText(g.victory?'现实闭环完成':'试炼失败',canvas.width/2,canvas.height/2+5);ctx.font='14px system-ui';ctx.fillStyle='#dceffd';ctx.fillText('按 R 重新开始',canvas.width/2,canvas.height/2+34);ctx.textAlign='left';}}
function frame(now){const dt=Math.min(100,now-last);last=now;acc+=dt;const step=1000/program.tick_rate;while(acc>=step){tick();acc-=step;}render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.__RNCS_GAME__={get runtime(){return runtime},reset:createRuntime,project,build};
})();`}

export function renderIndexHtml({title,inline=false,runtimeSource='',gameSource='',payload=null,manifestPath='manifest.webmanifest'}){
  const dataScript=inline?`<script>window.__REALITY_BUILD__=${canonicalJson(payload).replaceAll('<','\\u003c')}</script>`:`<script src="build-data.js"></script>`;
  const scripts=inline?`<script>${runtimeSource.replaceAll('</script>','<\\/script>')}</script><script>${gameSource.replaceAll('</script>','<\\/script>')}</script>`:`<script src="runtime.js"></script><script src="game.js"></script>`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071426"><title>${title}</title>${inline?'':`<link rel="manifest" href="${manifestPath}">`}<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#04080f;color:#e5f5ff;font-family:system-ui,"Microsoft YaHei",sans-serif}body{display:grid;place-items:center;background:radial-gradient(circle at 50% -10%,#193b5d,#04080f 62%)}.app{width:min(96vw,960px);padding:14px}.head{display:flex;justify-content:space-between;gap:14px;align-items:end;margin-bottom:10px}.title{font-size:22px;font-weight:800}.meta,.message{color:#8eabc2;font-size:12px}.stage{padding:10px;border:1px solid #2b4b67;border-radius:14px;background:#071426;box-shadow:0 22px 70px #000b}canvas{display:block;width:100%;height:auto;border-radius:9px;image-rendering:auto}.foot{display:flex;justify-content:space-between;gap:12px;margin-top:9px}.keys span,.touch button{border:1px solid #34526d;background:#0b1928;color:#dff4ff;border-radius:7px;padding:4px 8px}.touch{display:none;gap:8px;margin-top:12px}.touch button{font-size:18px;min-width:58px;min-height:44px}.badge{color:#67e8f9}@media(max-width:720px),(pointer:coarse){.touch{display:flex}.keys{display:none}.app{padding:6px}.head{align-items:start;flex-direction:column}}</style></head><body><main class="app"><div class="head"><div><div class="title">${title}</div><div id="message" class="message">现实原生构建正在启动</div></div><div class="meta">状态 <span id="status" class="badge">初始化</span> · State <span id="root">—</span></div></div><div class="stage"><canvas id="game" width="640" height="360"></canvas></div><div class="foot"><div class="keys"><span>A/D</span> 移动　<span>J/Space</span> 攻击　<span>R</span> 重置　<span>P</span> 暂停</div><div class="meta">Reality Build Fabric v0.1</div></div><div class="touch"><button data-action="move_left">◀</button><button data-action="move_right">▶</button><button data-action="attack">攻击</button></div></main>${dataScript}${scripts}</body></html>`;
}
