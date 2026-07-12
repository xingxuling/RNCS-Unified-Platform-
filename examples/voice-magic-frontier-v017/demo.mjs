import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFrontierGame,dispatchFrontierAction,inspectFrontierGame,verifyFrontierGame} from '../../packages/world/voice-magic-frontier-runtime/src/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function act(state,action){const r=dispatchFrontierAction(state,action);if(!r.ok)throw new Error(r.error.message);return r.state;}
function cooldown(state,ms){for(let n=0;n<ms;n+=250)state=act(state,{type:'tick',dt:Math.min(250,ms-n)});return state;}
let s=createFrontierGame({seed:'season-zero-demo',player:{name:'杜衡界',archetype:'spellsword'}});
s.player.x=10;s.player.y=14;s=act(s,{type:'talk',npcId:'lyra'});
const imps=s.enemies.filter(e=>e.type==='ash-imp').slice(0,3);s.player.x=28;s.player.y=15;s.player.maxMana=500;s.player.mana=500;
imps.forEach((e,i)=>{e.x=30+i*.35;e.y=15;e.hp=1;});
for(let i=0;i<3;i++){s=act(s,{type:'cast',phrase:'火焰 长枪 穿刺'});s=cooldown(s,1500);}
s.player.x=10;s.player.y=24;s=act(s,{type:'craft-focus'});
s.player.x=54;s.player.y=23;s=act(s,{type:'interact'});
const boss=s.enemies.find(e=>e.boss);boss.x=56.8;boss.y=23;boss.hp=24;s.player.x=55;s.player.y=23;s.player.mana=500;s=act(s,{type:'cast',spellId:'thunder-chain'});
const report={format:'rncs.voice-magic-frontier-demo-evidence.v0.1',inspection:inspectFrontierGame(s),verification:verifyFrontierGame(s),acceptance:{quest:s.quest.id,bossDefeated:s.world.bossDefeated,voiceCasts:s.metrics.voiceCasts,llmCalls:s.metrics.llmCalls,nextRegion:s.world.nextRegion,nextRegionAvailable:s.world.nextRegionAvailable}};
const out=path.join(root,'artifacts/voice-magic-frontier-v017/evidence.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
