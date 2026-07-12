import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTownGame,dispatchTownAction,verifyTownGame,projectTown2_5D} from '../packages/world/town-life-industry-runtime/src/index.mjs';

function act(state,action){const result=dispatchTownAction(state,action);assert.equal(result.ok,true,result.error?.message);return result.state;}
function place(state,x,y){state.player.x=x;state.player.y=y;return state;}

test('v0.16 closes player life → material → manufacturing → technology → market → town impact',()=>{
  let s=createTownGame({seed:'v016-acceptance',player:{name:'杜衡界',identity:'apprentice',background:'工匠家庭'}});
  s.player.money=1200;
  s=place(s,11,5);
  for(let i=0;i<4;i++)s=act(s,{type:'study',domain:'materials'});
  s=act(s,{type:'research'});
  s=place(s,9,9);s=act(s,{type:'buy',item:'clay',count:18});s=act(s,{type:'buy',item:'wood',count:3});
  s=place(s,15,8);s=act(s,{type:'rent-workshop'});
  for(let i=0;i<6;i++)s=act(s,{type:'craft',recipe:'porousCeramic'});
  for(let i=0;i<3;i++)s=act(s,{type:'craft',recipe:'ceramicFilter'});
  s=place(s,12,9);s=act(s,{type:'rent-stall'});s=act(s,{type:'launch-product'});
  s=act(s,{type:'wait',minutes:2880});
  assert.equal(s.metrics.llmCalls,0);
  assert.equal(s.technologies['porous-ceramic-filtration'].stage,5);
  assert.ok(s.economy.waterQuality>=70);
  assert.ok(s.player.sales>=3);
  assert.ok(s.history.some(e=>e.code==='MATERIAL_EVOLVED'));
  assert.ok(s.history.some(e=>e.code==='TECH_PROTOTYPE'));
  assert.ok(s.history.some(e=>e.code==='PRODUCT_LAUNCHED'));
  assert.ok(s.history.some(e=>e.code==='TECH_ADOPTED'));
  assert.equal(verifyTownGame(s).valid,true);
});

test('2.5D direct-open build exposes detailed playable town systems',()=>{
  const state=createTownGame({seed:'projection'});const p=projectTown2_5D(state);
  assert.equal(p.map.buildings.length,9);assert.equal(p.npcs.length,18);assert.equal(state.households.length,3);
  const html=fs.readFileSync(new URL('../packages/world/town-life-industry-runtime/examples/潮汐工坊镇_v0.1_直接打开.html',import.meta.url),'utf8');
  for(const token of ['<canvas','初始身份','家庭背景','商店街','学校','住宅','食物','多孔陶瓷','陶瓷净水器','localStorage','WASD'])assert.ok(html.includes(token),token);
  assert.ok(html.length>40000);
});
