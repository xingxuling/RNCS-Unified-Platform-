import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFrontierGame,dispatchFrontierAction,compileIncantation,verifyFrontierGame,
  projectFrontier2_5D,exportFrontierSave,importFrontierSave,health
} from '../src/index.mjs';

function cast(state,spellId){return dispatchFrontierAction(state,{type:'cast',spellId});}
function tick(state,dt=2000){let current=state;for(let elapsed=0;elapsed<dt;elapsed+=250)current=dispatchFrontierAction(current,{type:'tick',dt:Math.min(250,dt-elapsed)}).state;return current;}

test('same seed creates deterministic zero-LLM world',()=>{
  const a=createFrontierGame({seed:'same'}),b=createFrontierGame({seed:'same'});
  assert.equal(a.state_root,b.state_root);
  assert.equal(a.metrics.llmCalls,0);
  assert.equal(verifyFrontierGame(a).valid,true);
});

test('player spawns outside buildings and can move immediately',()=>{
  const s=createFrontierGame(),r=dispatchFrontierAction(s,{type:'move',dx:-1,dy:0});
  assert.equal(r.ok,true);assert.ok(r.state.player.x<s.player.x);
});

test('deterministic grammar recognizes Chinese and English incantations',()=>{
  assert.equal(compileIncantation('火焰，长枪，穿刺').spellId,'fire-lance');
  assert.equal(compileIncantation('frost shield').spellId,'frost-aegis');
  assert.equal(compileIncantation('雷霆锁链追踪').spellId,'thunder-chain');
  assert.equal(compileIncantation('随便说一句').ok,false);
});

test('talking to Lyra unlocks first spell and advances quest',()=>{
  let s=createFrontierGame();s.player.x=10;s.player.y=14;
  const r=dispatchFrontierAction(s,{type:'talk',npcId:'lyra'});
  assert.equal(r.ok,true);
  assert.ok(r.state.player.spells.includes('fire-lance'));
  assert.equal(r.state.quest.id,'field-test');
});

test('sword attack damages an enemy in facing cone',()=>{
  let s=createFrontierGame();s.player.x=26;s.player.y=12;s.player.facing='e';
  const enemy=s.enemies.find(e=>e.type==='ash-imp');enemy.x=27.2;enemy.y=12;
  const before=enemy.hp;
  const r=dispatchFrontierAction(s,{type:'sword'});
  assert.equal(r.ok,true);assert.equal(r.state.lastCombatResult.hit,true);
  assert.ok(r.state.enemies.find(e=>e.id===enemy.id).hp<before);
});

test('voice spell damages a target and records voice casting',()=>{
  let s=createFrontierGame();s.player.spells=['fire-lance'];s.player.x=26;s.player.y=12;
  const enemy=s.enemies.find(e=>e.type==='ash-imp');enemy.x=29;enemy.y=12;
  const r=dispatchFrontierAction(s,{type:'cast',phrase:'火焰 长枪 穿刺'});
  assert.equal(r.ok,true);assert.equal(r.state.metrics.voiceCasts,1);
  assert.ok(r.state.enemies.find(e=>e.id===enemy.id).hp<enemy.hp);
});

test('frost shield absorbs hostile damage',()=>{
  let s=createFrontierGame();s.player.spells=['frost-aegis'];s.player.x=27;s.player.y=12;
  const e=s.enemies.find(x=>x.type==='ash-imp');e.x=27.5;e.y=12;e.attackCooldown=0;
  let r=cast(s,'frost-aegis');assert.equal(r.ok,true);const shield=r.state.player.shield;
  r=dispatchFrontierAction(r.state,{type:'tick',dt:200});
  assert.ok(r.state.player.shield<shield||r.state.player.hp===r.state.player.maxHp);
});

test('three imp kills advance field test and unlock frost magic',()=>{
  let s=createFrontierGame();s.player.spells=['fire-lance'];s.quest={id:'field-test',progress:0,completed:['meet-lyra']};s.player.x=28;s.player.y=15;s.player.maxMana=500;s.player.mana=500;
  const imps=s.enemies.filter(e=>e.type==='ash-imp').slice(0,3);
  imps.forEach((e,i)=>{e.x=30+i*.4;e.y=15;e.hp=1;});
  for(let i=0;i<3;i++){
    let r=dispatchFrontierAction(s,{type:'cast',spellId:'fire-lance'});assert.equal(r.ok,true);s=r.state;s=tick(s,1500);
  }
  assert.equal(s.quest.id,'forge-focus');assert.ok(s.player.spells.includes('frost-aegis'));
});

test('focus crafting consumes materials and unlocks advanced spells',()=>{
  let s=createFrontierGame();s.quest={id:'forge-focus',progress:0,completed:['meet-lyra','field-test']};s.player.x=10;s.player.y=24;s.player.inventory={ashwood:3,ironShard:2,runeDust:3};
  const r=dispatchFrontierAction(s,{type:'craft-focus'});
  assert.equal(r.ok,true);assert.equal(r.state.player.focus,'初阶魔导器');
  assert.ok(r.state.player.spells.includes('thunder-chain'));assert.equal(r.state.quest.id,'open-ruins');
});

test('runic focus opens ruins gate',()=>{
  let s=createFrontierGame();s.player.focus='初阶魔导器';s.player.x=54;s.player.y=23;s.quest={id:'open-ruins',progress:0,completed:['meet-lyra','field-test','forge-focus']};
  const r=dispatchFrontierAction(s,{type:'interact'});
  assert.equal(r.ok,true);assert.equal(r.state.world.ruinsOpen,true);assert.equal(r.state.quest.id,'defeat-warden');
});

test('boss defeat unlocks season completion and unique spell',()=>{
  let s=createFrontierGame({scenario:'boss-ready'});const boss=s.enemies.find(e=>e.boss);boss.x=63;boss.y=24;boss.hp=40;s.player.spells.push('thunder-chain');
  const r=dispatchFrontierAction(s,{type:'cast',spellId:'thunder-chain'});
  assert.equal(r.ok,true);assert.equal(r.state.world.bossDefeated,true);assert.equal(r.state.quest.id,'season-complete');assert.ok(r.state.player.spells.includes('ember-nova'));
});

test('projection exposes region, entities and version-gated world',()=>{
  const p=projectFrontier2_5D(createFrontierGame());
  assert.equal(p.format,'vsr.voice-magic-frontier-2.5d.v0.1');
  assert.ok(p.buildings.length>=7);assert.ok(p.enemies.length>=10);assert.equal(p.world.nextRegion,'浮空学院');
});

test('save/load preserves authoritative state root',()=>{
  const s=createFrontierGame({seed:'save'}),loaded=importFrontierSave(exportFrontierSave(s));
  assert.equal(loaded.state_root,s.state_root);assert.equal(verifyFrontierGame(loaded).valid,true);
});

test('health reports sword, voice, boss and shared-world systems',()=>{
  const h=health();assert.equal(h.status,'ok');assert.equal(h.llm_required,false);
  for(const system of ['sword-combat','voice-incantation','boss-phases','shared-world-ghosts'])assert.ok(h.systems.includes(system));
});
