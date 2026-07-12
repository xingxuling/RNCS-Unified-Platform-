export const VOICE_MAGIC_VERSION = '0.1.0-alpha.1';
export const VOICE_MAGIC_PROTOCOL = 'rncs.voice-magic-frontier.v0.1';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const clone=value=>JSON.parse(JSON.stringify(value));
const round=(v,n=2)=>Number(Number(v).toFixed(n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const id=(p,n)=>`${p}:${String(n).padStart(3,'0')}`;
function hashString(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function stableRoot(value){const copy=clone(value);delete copy.state_root;return hashString(JSON.stringify(copy));}
function rngFrom(seed){let x=parseInt(hashString(String(seed)),16)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1000000)/1000000;};}
function pick(rng,list){return list[Math.floor(rng()*list.length)%list.length];}

export const SPELLS={
  'fire-lance':{name:'火焰长枪',incantation:'火焰·长枪·穿刺',element:'fire',form:'projectile',mana:18,cooldown:1250,range:8,damage:42,color:'#ff7a3d',description:'凝聚火焰为穿刺长枪，命中后附加灼烧。'},
  'frost-aegis':{name:'寒霜护壁',incantation:'寒霜·护盾·环绕',element:'frost',form:'shield',mana:22,cooldown:5000,shield:52,duration:7200,color:'#70d8ff',description:'生成可吸收伤害的霜环，并减缓近敌。'},
  'thunder-chain':{name:'雷霆锁链',incantation:'雷霆·锁链·追踪',element:'thunder',form:'chain',mana:28,cooldown:3600,range:7,damage:30,color:'#d7a7ff',description:'在最多三个目标间跳跃的追踪雷链。'},
  'wind-step':{name:'风行步',incantation:'疾风·步伐·前行',element:'wind',form:'dash',mana:14,cooldown:2400,distance:4,color:'#8dffc5',description:'沿面向方向瞬移并获得短暂无敌。'},
  'healing-light':{name:'治愈之光',incantation:'辉光·生命·复苏',element:'light',form:'heal',mana:24,cooldown:7000,heal:46,color:'#ffe58a',description:'恢复生命并清除一层灼烧。'},
  'ember-nova':{name:'余烬新星',incantation:'余烬·星环·爆裂',element:'fire',form:'nova',mana:36,cooldown:9000,range:5,damage:58,color:'#ffb14a',description:'击败灰烬守卫后获得的范围爆裂法术。'}
};

export const ITEMS={
  bread:{name:'边境硬面包',kind:'food',value:8},
  potion:{name:'赤草药剂',kind:'consumable',value:35},
  ashwood:{name:'灰烬木枝',kind:'material',value:5},
  ironShard:{name:'陨铁碎片',kind:'material',value:8},
  runeDust:{name:'符文尘',kind:'material',value:12},
  runicFocus:{name:'初阶魔导器',kind:'equipment',value:80},
  cinderCore:{name:'熔心核心',kind:'relic',value:240}
};

export const ENEMY_ARCHETYPES={
  'ash-imp':{name:'灰烬小鬼',maxHp:64,damage:8,speed:1.4,aggro:8,attackRange:1.2,xp:18,gold:4,color:'#d85a39',loot:[['runeDust',0.72],['ashwood',0.45]]},
  'moss-wolf':{name:'苔原猎狼',maxHp:92,damage:12,speed:2.0,aggro:10,attackRange:1.35,xp:26,gold:7,color:'#66856b',loot:[['ashwood',0.85],['potion',0.18]]},
  'ruin-sentinel':{name:'遗迹哨兵',maxHp:138,damage:16,speed:1.0,aggro:9,attackRange:1.5,xp:42,gold:12,color:'#7a829a',loot:[['ironShard',0.9],['runeDust',0.8]]},
  'cinder-warden':{name:'熔心守卫',maxHp:720,damage:24,speed:1.15,aggro:14,attackRange:2.0,xp:360,gold:120,color:'#9b3d2e',boss:true,loot:[['cinderCore',1]]}
};

export const QUESTS={
  'meet-lyra':{name:'第一句咏唱',summary:'前往魔法师莱拉处学习第一句咏唱。'},
  'field-test':{name:'灰烬试炼',summary:'击败3只灰烬小鬼，验证火焰长枪。',goal:3},
  'forge-focus':{name:'魔导器的骨架',summary:'收集3灰烬木枝、2陨铁碎片和3符文尘，在铁匠铺制造初阶魔导器。'},
  'open-ruins':{name:'封锁遗迹',summary:'携带魔导器前往遗迹门，解除封印。'},
  'defeat-warden':{name:'熔心之战',summary:'进入遗迹核心，击败熔心守卫。'},
  'season-complete':{name:'灰烬边境·序章完成',summary:'下一版本区域“浮空学院”已被记录为待开放世界分支。'}
};

export const WORLD_BUILDINGS=[
  {id:'guild',name:'边境法师公会',kind:'guild',x:7,y:7,w:6,h:5,height:3,color:'#56608d'},
  {id:'forge',name:'赤铁锻坊',kind:'forge',x:7,y:18,w:6,h:5,height:2,color:'#7a4937'},
  {id:'inn',name:'远行者旅店',kind:'inn',x:2,y:18,w:5,h:6,height:2,color:'#765a45'},
  {id:'keep',name:'灰烬边堡',kind:'keep',x:13,y:10,w:6,h:7,height:4,color:'#4e5966'},
  {id:'waystone',name:'传送碑',kind:'waystone',x:15,y:22,w:2,h:2,height:2,color:'#557e86'},
  {id:'ruin-gate',name:'封锁遗迹门',kind:'gate',x:55,y:20,w:2,h:7,height:4,color:'#4e4a57'},
  {id:'version-gate',name:'浮空学院航道',kind:'version-gate',x:69,y:20,w:2,h:7,height:5,color:'#586c8e'}
];

export const WORLD_NPCS=[
  {id:'lyra',name:'莱拉',role:'咏唱导师',x:10,y:13,color:'#9a78d6',dialogue:['声音不是魔法本身，结构才是。','先说出：火焰·长枪·穿刺。']},
  {id:'garrick',name:'加里克',role:'边境铁匠',x:10,y:24,color:'#b77a4a',dialogue:['没有材料承载的魔法，只是一阵漂亮的风。','把灰烬木、陨铁和符文尘带来。']},
  {id:'sera',name:'塞拉',role:'边堡队长',x:16,y:17,color:'#6a87b8',dialogue:['遗迹封印正在变弱。','别让熔心守卫踏出峡谷。']},
  {id:'mira',name:'米拉',role:'旅店老板',x:5,y:25,color:'#b06c80',dialogue:['旅店可以恢复你的状态。','边境最近来了不少冒险者。']}
];

function createEnemy(type,n,x,y){const a=ENEMY_ARCHETYPES[type];return{id:id(type,n),type,name:a.name,x,y,spawnX:x,spawnY:y,hp:a.maxHp,maxHp:a.maxHp,damage:a.damage,speed:a.speed,aggro:a.aggro,attackRange:a.attackRange,xp:a.xp,gold:a.gold,color:a.color,boss:!!a.boss,state:'idle',attackCooldown:0,status:{burn:0,slow:0},phase:1,alive:true};}

function createEnemies(rng){const out=[];let n=1;
  for(const [x,y] of [[27,12],[31,16],[35,10],[29,25],[38,28]])out.push(createEnemy('ash-imp',n++,x+rng()*1.2,y+rng()*1.2));
  n=1;for(const [x,y] of [[36,18],[43,12],[46,29],[40,34]])out.push(createEnemy('moss-wolf',n++,x+rng(),y+rng()));
  n=1;for(const [x,y] of [[59,15],[61,29],[64,14]])out.push(createEnemy('ruin-sentinel',n++,x+rng(),y+rng()));
  out.push(createEnemy('cinder-warden',1,65,24));
  return out;
}

function createScenery(rng){const out=[];let n=1;
  for(let i=0;i<48;i++){const zone=i<16?'meadow':i<36?'ashwood':'ruins';let x=zone==='meadow'?20+rng()*19:zone==='ashwood'?40+rng()*14:58+rng()*10;let y=4+rng()*39;out.push({id:id('scenery',n++),kind:zone==='meadow'?(rng()>.35?'tree':'rock'):zone==='ashwood'?(rng()>.45?'ash-tree':'ember-rock'):(rng()>.5?'pillar':'rubble'),x:round(x),y:round(y),blocking:rng()>.25});}
  return out;
}

function inventoryCount(state,item){return Number(state.player.inventory[item]||0);}
function give(state,item,count=1){state.player.inventory[item]=(state.player.inventory[item]||0)+count;}
function take(state,item,count=1){if(inventoryCount(state,item)<count)throw new Error(`${ITEMS[item]?.name||item}不足`);state.player.inventory[item]-=count;if(state.player.inventory[item]<=0)delete state.player.inventory[item];}
function log(state,code,message,data={}){state.history.push({seq:state.history.length+1,timeMs:state.timeMs,day:state.day,code,message,data});if(state.history.length>240)state.history.splice(0,state.history.length-240);}
function seal(state){state.state_root=stableRoot(state);return state;}
function roll(state,key){const h=parseInt(hashString(`${state.seed}:${state.metrics.rolls++}:${key}`),16);return(h%100000)/100000;}

function buildingContains(b,x,y,pad=0){return x>=b.x-pad&&x<=b.x+b.w+pad&&y>=b.y-pad&&y<=b.y+b.h+pad;}
function isBlocked(state,x,y){if(x<1||y<1||x>70||y>46)return true;for(const b of WORLD_BUILDINGS){if(b.kind==='gate'&&state.world.ruinsOpen)continue;if(buildingContains(b,x,y,0.1))return true;}for(const o of state.scenery){if(o.blocking&&dist(o,{x,y})<0.72)return true;}return false;}
function directionVector(facing){return facing==='n'?{x:0,y:-1}:facing==='s'?{x:0,y:1}:facing==='w'?{x:-1,y:0}:{x:1,y:0};}
function facingFrom(dx,dy,current='e'){if(Math.abs(dx)>Math.abs(dy))return dx<0?'w':'e';if(Math.abs(dy)>0)return dy<0?'n':'s';return current;}
function nearestAliveEnemy(state,range=Infinity,origin=state.player){return state.enemies.filter(e=>e.alive&&dist(e,origin)<=range).sort((a,b)=>dist(a,origin)-dist(b,origin))[0]||null;}
function enemiesInRange(state,origin,range){return state.enemies.filter(e=>e.alive&&dist(e,origin)<=range).sort((a,b)=>dist(a,origin)-dist(b,origin));}
function nearestNpc(state,range=2.2){return state.npcs.filter(n=>dist(n,state.player)<=range).sort((a,b)=>dist(a,state.player)-dist(b,state.player))[0]||null;}
function activeQuest(state){return QUESTS[state.quest.id];}

export function normalizeIncantation(text=''){return String(text).toLowerCase().replace(/[，。！？、·,.!?\s:_-]/g,'');}
export function compileIncantation(text=''){
  const raw=String(text||'').trim(),n=normalizeIncantation(raw);const candidates=[];
  const has=(...words)=>words.some(w=>n.includes(normalizeIncantation(w)));
  if(has('火焰','烈火','fire')&&has('长枪','枪','lance','穿刺'))candidates.push(['fire-lance',0.96]);
  if(has('寒霜','冰霜','frost','ice')&&has('护盾','护壁','盾','aegis','shield'))candidates.push(['frost-aegis',0.95]);
  if(has('雷霆','闪电','thunder','lightning')&&has('锁链','链','chain','追踪'))candidates.push(['thunder-chain',0.95]);
  if(has('疾风','风','wind')&&has('步','前行','step','dash'))candidates.push(['wind-step',0.92]);
  if(has('辉光','治愈','生命','healing','light')&&has('复苏','治愈','恢复','heal','life'))candidates.push(['healing-light',0.93]);
  if(has('余烬','ember')&&has('星环','新星','nova')&&has('爆裂','burst'))candidates.push(['ember-nova',0.97]);
  if(!candidates.length){for(const [spellId,spell] of Object.entries(SPELLS))if(n===normalizeIncantation(spell.name)||n===normalizeIncantation(spell.incantation))candidates.push([spellId,1]);}
  const best=candidates.sort((a,b)=>b[1]-a[1])[0];return best?{ok:true,raw,normalized:n,spellId:best[0],spell:SPELLS[best[0]],confidence:best[1],engine:'deterministic-token-grammar',llmCalls:0}:{ok:false,raw,normalized:n,confidence:0,reason:'INCANTATION_NOT_RECOGNIZED',engine:'deterministic-token-grammar',llmCalls:0};
}

function createPlayer(options={}){const style=options.archetype||'spellsword';return{id:'player:001',name:options.name||'无名咏唱者',archetype:style,x:12,y:16,facing:'e',level:1,xp:0,xpNext:100,hp:120,maxHp:120,mana:90,maxMana:90,stamina:100,maxStamina:100,shield:0,gold:30,inventory:{bread:2,potion:1},weapon:'边境长剑',focus:null,attackReadyAt:0,spells:[],discoveredSpells:[],cooldowns:{},status:{invulnerable:0,burn:0},kills:{},lastDialogue:null};}

export function createFrontierGame(options={}){const seed=String(options.seed||'ashen-frontier-season-0'),rng=rngFrom(seed);const state={
  format:'rncs.voice-magic-frontier-state.v0.1',version:VOICE_MAGIC_VERSION,protocol:VOICE_MAGIC_PROTOCOL,seed,timeMs:0,day:1,weather:'灰烬晴空',
  player:createPlayer(options.player),npcs:clone(WORLD_NPCS),enemies:createEnemies(rng),scenery:createScenery(rng),effects:[],projectiles:[],
  quest:{id:'meet-lyra',progress:0,completed:[]},world:{region:'灰烬边境',ruinsOpen:false,bossDefeated:false,nextRegion:'浮空学院',nextRegionAvailable:false,worldTier:1,sharedEvent:'熔心躁动'},
  ghosts:[{id:'ghost:001',name:'风铃旅者',x:18,y:14,color:'#7fd2ff',activity:'寻找队伍'},{id:'ghost:002',name:'铸星者',x:20,y:19,color:'#ffc86e',activity:'采集陨铁'},{id:'ghost:003',name:'白鸦',x:14,y:27,color:'#d8c8ff',activity:'返回旅店'}],
  history:[],metrics:{llmCalls:0,voiceCasts:0,manualCasts:0,swordSwings:0,hits:0,kills:0,rolls:0,bossAttempts:0},
  state_root:''};
  if(options.scenario==='boss-ready'){state.player.level=5;state.player.maxHp=220;state.player.hp=220;state.player.maxMana=180;state.player.mana=180;state.player.spells=['fire-lance','frost-aegis','thunder-chain','wind-step','healing-light'];state.player.inventory={potion:4,runicFocus:1};state.player.focus='初阶魔导器';state.quest={id:'defeat-warden',progress:0,completed:['meet-lyra','field-test','forge-focus','open-ruins']};state.world.ruinsOpen=true;state.player.x=61;state.player.y=24;}
  log(state,'WORLD_CREATED','Season 0「灰烬边境」世界分支建立。',{seed});return seal(state);
}

function addEffect(state,type,x,y,color,duration=700,data={}){state.effects.push({id:`fx:${state.timeMs}:${state.effects.length}`,type,x,y,color,duration,maxDuration:duration,...data});}
function grantXp(state,amount){state.player.xp+=amount;while(state.player.xp>=state.player.xpNext){state.player.xp-=state.player.xpNext;state.player.level++;state.player.xpNext=Math.round(state.player.xpNext*1.35);state.player.maxHp+=18;state.player.hp=state.player.maxHp;state.player.maxMana+=12;state.player.mana=state.player.maxMana;log(state,'LEVEL_UP',`等级提升至 ${state.player.level}。`,{level:state.player.level});}}
function maybeAdvanceQuestAfterKill(state,enemy){state.player.kills[enemy.type]=(state.player.kills[enemy.type]||0)+1;if(state.quest.id==='field-test'&&enemy.type==='ash-imp'){state.quest.progress++;if(state.quest.progress>=QUESTS['field-test'].goal){state.quest.completed.push('field-test');state.quest={id:'forge-focus',progress:0,completed:state.quest.completed};if(!state.player.spells.includes('frost-aegis'))state.player.spells.push('frost-aegis');log(state,'QUEST_ADVANCED','灰烬试炼完成，莱拉远程传授寒霜护壁。',{spell:'frost-aegis'});}}}
function killEnemy(state,enemy,source='unknown'){enemy.alive=false;enemy.state='defeated';state.metrics.kills++;grantXp(state,enemy.xp);state.player.gold+=enemy.gold;const fieldTrialDrop=enemy.type==='ash-imp'&&state.quest.id==='field-test';const fieldTrialIndex=state.quest.progress;const archetype=ENEMY_ARCHETYPES[enemy.type];for(const [item,chance] of archetype.loot){if(roll(state,`${enemy.id}:${item}`)<=chance)give(state,item,1);}if(fieldTrialDrop){give(state,'runeDust',1);give(state,'ashwood',1);if(fieldTrialIndex<2)give(state,'ironShard',1);}maybeAdvanceQuestAfterKill(state,enemy);addEffect(state,'defeat',enemy.x,enemy.y,'#ffe29a',1100,{source});log(state,'ENEMY_DEFEATED',`${enemy.name}被击败。`,{enemyId:enemy.id,source,xp:enemy.xp,gold:enemy.gold});if(enemy.boss){state.world.bossDefeated=true;state.world.nextRegionAvailable=false;state.player.spells.push('ember-nova');state.player.discoveredSpells.push({spellId:'ember-nova',discoverer:state.player.name,timeMs:state.timeMs});state.quest.completed.push('defeat-warden');state.quest={id:'season-complete',progress:1,completed:state.quest.completed};log(state,'SEASON_ZERO_COMPLETE','熔心守卫倒下，浮空学院航道被记录为下一版本内容。',{nextRegion:state.world.nextRegion});}}
function damageEnemy(state,enemy,amount,source,element='physical'){if(!enemy?.alive)return 0;if(enemy.boss&&enemy.hp===enemy.maxHp)state.metrics.bossAttempts++;let dmg=Math.max(1,Math.round(amount));if(enemy.type==='cinder-warden'&&element==='fire')dmg=Math.round(dmg*0.72);if(enemy.type==='cinder-warden'&&element==='frost')dmg=Math.round(dmg*1.25);enemy.hp=clamp(enemy.hp-dmg,0,enemy.maxHp);state.metrics.hits++;addEffect(state,'hit',enemy.x,enemy.y,element==='physical'?'#fff3d1':SPELLS[source]?.color||'#ffffff',450,{damage:dmg,element});if(enemy.hp<=0)killEnemy(state,enemy,source);else if(enemy.boss){const ratio=enemy.hp/enemy.maxHp;enemy.phase=ratio<.33?3:ratio<.66?2:1;}return dmg;}
function damagePlayer(state,amount,source){if(state.player.status.invulnerable>0)return 0;let remaining=Math.max(0,Math.round(amount));if(state.player.shield>0){const absorbed=Math.min(state.player.shield,remaining);state.player.shield-=absorbed;remaining-=absorbed;}state.player.hp=clamp(state.player.hp-remaining,0,state.player.maxHp);addEffect(state,'player-hit',state.player.x,state.player.y,'#ff6577',500,{damage:remaining});if(state.player.hp<=0){state.player.hp=Math.round(state.player.maxHp*.55);state.player.mana=Math.round(state.player.maxMana*.5);state.player.x=5;state.player.y=16;state.player.gold=Math.max(0,state.player.gold-10);log(state,'PLAYER_RECOVERED','你被边境巡逻队送回城内。',{source});}return remaining;}

function talk(state,npc){state.player.lastDialogue={npcId:npc.id,name:npc.name,role:npc.role,text:pick(rngFrom(`${state.seed}:${state.timeMs}:${npc.id}`),npc.dialogue)};log(state,'NPC_TALK',`${npc.name}：${state.player.lastDialogue.text}`,{npcId:npc.id});if(npc.id==='lyra'&&state.quest.id==='meet-lyra'){state.player.spells.push('fire-lance');state.player.discoveredSpells.push({spellId:'fire-lance',source:'lyra'});state.quest.completed.push('meet-lyra');state.quest={id:'field-test',progress:0,completed:state.quest.completed};log(state,'SPELL_LEARNED','习得火焰长枪。请用声音或快捷键施放。',{spellId:'fire-lance'});}return state.player.lastDialogue;}
function interact(state){const npc=nearestNpc(state);if(npc)return{kind:'npc',value:talk(state,npc)};const nearGate=WORLD_BUILDINGS.find(b=>b.kind==='gate'&&buildingContains(b,state.player.x,state.player.y,2.2));if(nearGate){if(!state.world.ruinsOpen){if(state.player.focus){state.world.ruinsOpen=true;state.quest.completed.push('open-ruins');state.quest={id:'defeat-warden',progress:0,completed:state.quest.completed};log(state,'RUINS_OPENED','初阶魔导器响应封印，遗迹门开启。');return{kind:'gate',opened:true};}throw new Error('遗迹门需要初阶魔导器');}return{kind:'gate',opened:true};}
  const inn=WORLD_BUILDINGS.find(b=>b.kind==='inn'&&buildingContains(b,state.player.x,state.player.y,2.4));if(inn){state.player.hp=state.player.maxHp;state.player.mana=state.player.maxMana;state.player.stamina=state.player.maxStamina;log(state,'RESTED','在远行者旅店充分休息。');return{kind:'rest'};}
  return{kind:'none'};
}

function craftFocus(state){if(state.quest.id!=='forge-focus'&&!state.quest.completed.includes('forge-focus'))throw new Error('当前还未掌握魔导器结构');const near=WORLD_BUILDINGS.some(b=>b.kind==='forge'&&buildingContains(b,state.player.x,state.player.y,2.8));if(!near)throw new Error('请前往赤铁锻坊');take(state,'ashwood',3);take(state,'ironShard',2);take(state,'runeDust',3);give(state,'runicFocus',1);state.player.focus='初阶魔导器';if(!state.player.spells.includes('thunder-chain'))state.player.spells.push('thunder-chain');if(!state.player.spells.includes('wind-step'))state.player.spells.push('wind-step');if(!state.player.spells.includes('healing-light'))state.player.spells.push('healing-light');if(!state.quest.completed.includes('forge-focus'))state.quest.completed.push('forge-focus');state.quest={id:'open-ruins',progress:0,completed:state.quest.completed};log(state,'FOCUS_CRAFTED','初阶魔导器制造完成，咏唱容量得到扩展。',{unlocked:['thunder-chain','wind-step','healing-light']});}

function castSpell(state,spellId,origin='manual'){
  const spell=SPELLS[spellId];if(!spell)throw new Error('未知法术');if(!state.player.spells.includes(spellId))throw new Error(`尚未掌握${spell.name}`);if((state.player.cooldowns[spellId]||0)>state.timeMs)throw new Error(`${spell.name}仍在冷却`);if(state.player.mana<spell.mana)throw new Error('魔力不足');state.player.mana-=spell.mana;state.player.cooldowns[spellId]=state.timeMs+spell.cooldown;if(origin==='voice')state.metrics.voiceCasts++;else state.metrics.manualCasts++;addEffect(state,'cast',state.player.x,state.player.y,spell.color,700,{spellId});let result={spellId,name:spell.name};
  if(spell.form==='projectile'){const target=nearestAliveEnemy(state,spell.range);if(!target)throw new Error('施法范围内没有目标');const dmg=damageEnemy(state,target,spell.damage+state.player.level*3,spellId,spell.element);target.status.burn=4500;result={...result,targetId:target.id,damage:dmg};addEffect(state,'projectile',target.x,target.y,spell.color,600,{fromX:state.player.x,fromY:state.player.y});}
  else if(spell.form==='shield'){state.player.shield=Math.max(state.player.shield,spell.shield+state.player.level*4);for(const e of enemiesInRange(state,state.player,4))e.status.slow=5200;result.shield=state.player.shield;}
  else if(spell.form==='chain'){const targets=enemiesInRange(state,state.player,spell.range).slice(0,3);if(!targets.length)throw new Error('施法范围内没有目标');result.targets=[];targets.forEach((e,i)=>{const dmg=damageEnemy(state,e,spell.damage+state.player.level*2-i*4,spellId,spell.element);result.targets.push({id:e.id,damage:dmg});addEffect(state,'chain',e.x,e.y,spell.color,700,{order:i});});}
  else if(spell.form==='dash'){const v=directionVector(state.player.facing);let moved=0;for(let i=0;i<spell.distance;i++){const nx=state.player.x+v.x,ny=state.player.y+v.y;if(isBlocked(state,nx,ny))break;state.player.x=nx;state.player.y=ny;moved++;}state.player.status.invulnerable=650;result.distance=moved;addEffect(state,'dash',state.player.x,state.player.y,spell.color,500);}
  else if(spell.form==='heal'){const before=state.player.hp;state.player.hp=clamp(state.player.hp+spell.heal+state.player.level*3,0,state.player.maxHp);state.player.status.burn=0;result.healed=state.player.hp-before;}
  else if(spell.form==='nova'){const targets=enemiesInRange(state,state.player,spell.range);result.targets=[];targets.forEach(e=>result.targets.push({id:e.id,damage:damageEnemy(state,e,spell.damage+state.player.level*4,spellId,spell.element)}));addEffect(state,'nova',state.player.x,state.player.y,spell.color,1000,{radius:spell.range});}
  log(state,'SPELL_CAST',`${state.player.name}施放${spell.name}。`,{spellId,origin,result});return result;
}

function swordAttack(state){if(state.player.attackReadyAt>state.timeMs)throw new Error('剑击动作尚未收招');state.player.attackReadyAt=state.timeMs+420;state.metrics.swordSwings++;const v=directionVector(state.player.facing);const probe={x:state.player.x+v.x*1.1,y:state.player.y+v.y*1.1};const target=state.enemies.filter(e=>e.alive&&dist(e,probe)<=1.65&&dist(e,state.player)<=2.45).sort((a,b)=>dist(a,probe)-dist(b,probe))[0];addEffect(state,'slash',probe.x,probe.y,'#fff2d5',340,{facing:state.player.facing});if(!target)return{hit:false};const base=24+state.player.level*3+(state.player.focus?5:0);const critical=roll(state,`crit:${target.id}`)<.13;const damage=damageEnemy(state,target,critical?base*1.75:base,'sword','physical');return{hit:true,targetId:target.id,damage,critical};}

function updateEnemy(state,e,dt){if(!e.alive)return;e.attackCooldown=Math.max(0,e.attackCooldown-dt);e.status.burn=Math.max(0,e.status.burn-dt);e.status.slow=Math.max(0,e.status.slow-dt);if(e.status.burn>0&&Math.floor(state.timeMs/900)!==Math.floor((state.timeMs-dt)/900))damageEnemy(state,e,4,'burn','fire');if(!e.alive)return;const d=dist(e,state.player);if(d<=e.aggro||e.boss){e.state='engaged';if(d>e.attackRange){const factor=(e.status.slow>0?.45:1)*e.speed*dt/1000;const dx=(state.player.x-e.x)/Math.max(.001,d),dy=(state.player.y-e.y)/Math.max(.001,d);const nx=e.x+dx*factor,ny=e.y+dy*factor;if(!isBlocked(state,nx,ny)){e.x=round(nx);e.y=round(ny);}}else if(e.attackCooldown<=0){let multiplier=e.boss?(e.phase===3?1.45:e.phase===2?1.2:1):1;damagePlayer(state,e.damage*multiplier,e.id);e.attackCooldown=e.boss?1100:1500;addEffect(state,e.boss&&e.phase>=2?'boss-strike':'enemy-strike',state.player.x,state.player.y,e.color,550,{enemyId:e.id});}}
  else if(dist(e,{x:e.spawnX,y:e.spawnY})>1){const d0=dist(e,{x:e.spawnX,y:e.spawnY});e.x+=((e.spawnX-e.x)/d0)*e.speed*.25*dt/1000;e.y+=((e.spawnY-e.y)/d0)*e.speed*.25*dt/1000;e.state='returning';}else e.state='idle';}

function tick(state,dt){dt=clamp(Number(dt||16),0,250);state.timeMs+=dt;state.player.status.invulnerable=Math.max(0,state.player.status.invulnerable-dt);state.player.status.burn=Math.max(0,state.player.status.burn-dt);state.player.mana=clamp(state.player.mana+dt*.006,0,state.player.maxMana);state.player.stamina=clamp(state.player.stamina+dt*.012,0,state.player.maxStamina);for(const e of state.enemies)updateEnemy(state,e,dt);for(const fx of state.effects)fx.duration-=dt;state.effects=state.effects.filter(f=>f.duration>0);for(const g of state.ghosts){const r=rngFrom(`${state.seed}:${g.id}:${Math.floor(state.timeMs/1200)}`);g.x=clamp(g.x+(r()-.5)*.12,2,52);g.y=clamp(g.y+(r()-.5)*.12,4,42);}if(state.timeMs>=state.day*900000)state.day++;}

export function dispatchFrontierAction(source,action={}){const state=clone(source);try{const type=action.type;
  if(type==='tick')tick(state,action.dt);
  else if(type==='move'){let dx=clamp(Number(action.dx||0),-1,1),dy=clamp(Number(action.dy||0),-1,1);if(Math.abs(dx)+Math.abs(dy)>1){dx*=.707;dy*=.707;}state.player.facing=facingFrom(dx,dy,state.player.facing);const step=clamp(Number(action.distance||.55),.1,1.2);const nx=state.player.x+dx*step,ny=state.player.y+dy*step;if(!isBlocked(state,nx,ny)){state.player.x=round(nx);state.player.y=round(ny);}tick(state,80);}
  else if(type==='sword')Object.assign(state,{lastCombatResult:swordAttack(state)});
  else if(type==='cast'){let spellId=action.spellId,origin=action.origin||'manual',compiled=null;if(action.phrase){compiled=compileIncantation(action.phrase);if(!compiled.ok)throw new Error('咏唱未被识别');spellId=compiled.spellId;origin='voice';}state.lastCast={compiled,result:castSpell(state,spellId,origin)};}
  else if(type==='interact')state.lastInteraction=interact(state);
  else if(type==='talk'){const npc=state.npcs.find(n=>n.id===action.npcId);if(!npc||dist(npc,state.player)>3)throw new Error('NPC不在交互范围内');state.lastInteraction={kind:'npc',value:talk(state,npc)};}
  else if(type==='craft-focus')craftFocus(state);
  else if(type==='use-potion'){take(state,'potion',1);const before=state.player.hp;state.player.hp=clamp(state.player.hp+55,0,state.player.maxHp);log(state,'POTION_USED','使用赤草药剂。',{healed:state.player.hp-before});}
  else if(type==='rest'){state.player.hp=state.player.maxHp;state.player.mana=state.player.maxMana;state.player.stamina=state.player.maxStamina;}
  else throw new Error(`未知动作：${type}`);
  return{ok:true,state:seal(state),events:state.history.slice(source.history.length)};
  }catch(error){return{ok:false,state:source,error:{code:'ACTION_REJECTED',message:error.message},events:[]};}}

export function frontierInteractionContext(state){const npc=nearestNpc(state);const actions=[];if(npc)actions.push({type:'interact',label:`与${npc.name}交谈`});const nearForge=WORLD_BUILDINGS.some(b=>b.kind==='forge'&&buildingContains(b,state.player.x,state.player.y,2.8));if(nearForge&&state.quest.id==='forge-focus')actions.push({type:'craft-focus',label:'制造初阶魔导器'});const nearGate=WORLD_BUILDINGS.some(b=>b.kind==='gate'&&buildingContains(b,state.player.x,state.player.y,2.2));if(nearGate)actions.push({type:'interact',label:state.world.ruinsOpen?'进入遗迹':'解除遗迹封印'});const nearInn=WORLD_BUILDINGS.some(b=>b.kind==='inn'&&buildingContains(b,state.player.x,state.player.y,2.4));if(nearInn)actions.push({type:'interact',label:'在旅店休息'});if(inventoryCount(state,'potion')>0)actions.push({type:'use-potion',label:'使用赤草药剂'});return{npc,actions,quest:activeQuest(state)};}

export function terrainAt(x,y){if(x<19)return'border-town';if(x<40)return'meadow';if(x<56)return'ashwood';if(x<69)return'ruins';return'version-gate';}
export function projectFrontier2_5D(state){return{format:'vsr.voice-magic-frontier-2.5d.v0.1',version:VOICE_MAGIC_VERSION,camera:{x:state.player.x,y:state.player.y},world:clone(state.world),terrain:{width:72,height:48},buildings:clone(WORLD_BUILDINGS),scenery:clone(state.scenery),player:clone(state.player),npcs:clone(state.npcs),enemies:state.enemies.filter(e=>e.alive).map(clone),ghosts:clone(state.ghosts),effects:clone(state.effects),quest:{...clone(state.quest),definition:activeQuest(state)},projection_root:hashString(`${state.state_root}:frontier-projection`)};}

export function inspectFrontierGame(state){return{version:state.version,protocol:state.protocol,player:{name:state.player.name,level:state.player.level,hp:round(state.player.hp),mana:round(state.player.mana),gold:state.player.gold,spells:clone(state.player.spells),inventory:clone(state.player.inventory)},quest:{id:state.quest.id,name:activeQuest(state)?.name,progress:state.quest.progress},world:clone(state.world),aliveEnemies:state.enemies.filter(e=>e.alive).length,boss:clone(state.enemies.find(e=>e.type==='cinder-warden')),metrics:clone(state.metrics),state_root:state.state_root};}
export function verifyFrontierGame(state){const errors=[];if(state?.format!=='rncs.voice-magic-frontier-state.v0.1')errors.push('FORMAT_INVALID');if(state?.metrics?.llmCalls!==0)errors.push('LLM_USAGE_DETECTED');if(!state?.player||!Array.isArray(state?.enemies))errors.push('WORLD_STATE_MISSING');if(!QUESTS[state?.quest?.id])errors.push('QUEST_INVALID');if(stableRoot(state)!==state?.state_root)errors.push('STATE_ROOT_MISMATCH');return{valid:errors.length===0,errors};}
export function exportFrontierSave(state){const v=verifyFrontierGame(state);if(!v.valid)throw new Error(v.errors.join(','));return JSON.stringify(state);}
export function importFrontierSave(text){const state=JSON.parse(text);const v=verifyFrontierGame(state);if(!v.valid)throw new Error(v.errors.join(','));return state;}
export function health(){return{status:'ok',version:VOICE_MAGIC_VERSION,protocol:VOICE_MAGIC_PROTOCOL,genre:'voice-cast sword-and-sorcery shared-world RPG vertical slice',rendering:'2.5d-stylized-canvas',voice:'deterministic spell grammar with browser speech-recognition adapter',llm_required:false,systems:['open-region','sword-combat','voice-incantation','spell-grammar','enemy-ai','boss-phases','quest-chain','crafting','persistent-history','version-gated-world','shared-world-ghosts']};}
