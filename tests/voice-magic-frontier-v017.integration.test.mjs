import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createFrontierGame,dispatchFrontierAction,verifyFrontierGame,projectFrontier2_5D
} from '../packages/world/voice-magic-frontier-runtime/src/index.mjs';
function act(state,action){const r=dispatchFrontierAction(state,action);assert.equal(r.ok,true,r.error?.message);return r.state;}
function cool(state,ms){for(let n=0;n<ms;n+=250)state=act(state,{type:'tick',dt:Math.min(250,ms-n)});return state;}

test('v0.17 closes voice incantation → combat → materials → focus → ruins → boss → version gate',()=>{
  let s=createFrontierGame({seed:'v017-acceptance',player:{name:'杜衡界'}});
  s.player.x=10;s.player.y=14;s=act(s,{type:'talk',npcId:'lyra'});
  assert.ok(s.player.spells.includes('fire-lance'));
  const imps=s.enemies.filter(e=>e.type==='ash-imp').slice(0,3);s.player.x=28;s.player.y=15;s.player.maxMana=500;s.player.mana=500;
  imps.forEach((e,i)=>{e.x=30+i*.35;e.y=15;e.hp=1;});
  for(let i=0;i<3;i++){s=act(s,{type:'cast',phrase:'火焰 长枪 穿刺'});s=cool(s,1500);}
  assert.equal(s.quest.id,'forge-focus');
  assert.ok((s.player.inventory.ashwood||0)>=3);assert.ok((s.player.inventory.ironShard||0)>=2);assert.ok((s.player.inventory.runeDust||0)>=3);
  s.player.x=10;s.player.y=24;s=act(s,{type:'craft-focus'});assert.equal(s.player.focus,'初阶魔导器');
  s.player.x=54;s.player.y=23;s=act(s,{type:'interact'});assert.equal(s.world.ruinsOpen,true);
  const boss=s.enemies.find(e=>e.boss);boss.x=56.8;boss.y=23;boss.hp=24;s.player.x=55;s.player.y=23;s.player.mana=500;s=act(s,{type:'cast',spellId:'thunder-chain'});
  assert.equal(s.world.bossDefeated,true);assert.equal(s.quest.id,'season-complete');assert.ok(s.player.spells.includes('ember-nova'));
  assert.equal(s.world.nextRegion,'浮空学院');assert.equal(s.world.nextRegionAvailable,false);
  assert.equal(s.metrics.llmCalls,0);assert.ok(s.metrics.voiceCasts>=3);assert.equal(verifyFrontierGame(s).valid,true);
});

test('direct-open build contains art atlas, microphone adapter and playable world UI',()=>{
  const html=fs.readFileSync(new URL('../packages/world/voice-magic-frontier-runtime/examples/灰烬边境_Season0_声控魔法RPG_直接打开.html',import.meta.url),'utf8');
  for(const token of ['<canvas','SpeechRecognition','火焰·长枪·穿刺','灰烬边境','熔心守卫','浮空学院','localStorage','WASD','data:image/png;base64'])assert.ok(html.includes(token),token);
  assert.ok(html.length>90000);
  const p=projectFrontier2_5D(createFrontierGame());assert.equal(p.format,'vsr.voice-magic-frontier-2.5d.v0.1');assert.ok(p.enemies.length>=10);assert.ok(p.buildings.length>=7);
});
