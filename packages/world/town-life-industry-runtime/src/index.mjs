export const TOWN_LIFE_VERSION = '0.1.0-alpha.1';
export const TOWN_LIFE_PROTOCOL = 'rncs.town-life-industry.v0.1';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const clone=value=>JSON.parse(JSON.stringify(value));
const id=(prefix,n)=>`${prefix}:${String(n).padStart(3,'0')}`;
function hashString(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function stableRoot(value){const copy=clone(value);delete copy.state_root;return hashString(JSON.stringify(copy));}
function rngFrom(seed){let x=parseInt(hashString(String(seed)),16)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1000000)/1000000;};}
function pick(rng,list){return list[Math.floor(rng()*list.length)%list.length];}

export const ITEM_CATALOG={
  bread:{name:'麦香面包',kind:'food',price:6,nutrition:22,energy:5,shelfLife:3},
  stew:{name:'蔬菜炖汤',kind:'food',price:12,nutrition:38,energy:10,shelfLife:1},
  milk:{name:'鲜奶',kind:'food',price:8,nutrition:18,energy:7,shelfLife:2},
  clay:{name:'黏土',kind:'material',price:4,properties:{plasticity:72,purity:55,heatResistance:20}},
  wood:{name:'木料',kind:'material',price:7,properties:{strength:45,workability:80}},
  iron:{name:'铁料',kind:'material',price:13,properties:{strength:72,workability:42}},
  ceramic:{name:'烧结陶瓷',kind:'material',price:14,properties:{strength:54,porosity:18,heatResistance:78}},
  porousCeramic:{name:'多孔陶瓷',kind:'material',price:28,properties:{strength:38,porosity:82,filtration:70}},
  pottery:{name:'日用陶器',kind:'product',basePrice:24,appeal:45},
  woodenCrate:{name:'木制货箱',kind:'product',basePrice:30,appeal:35},
  ceramicFilter:{name:'陶瓷净水器',kind:'product',basePrice:68,appeal:74,technology:'porous-ceramic-filtration'}
};

export const JOBS={
  student:{name:'学生',wage:0,workplace:'school',skills:['learning']},
  shopClerk:{name:'商店店员',wage:22,workplace:'grocery',skills:['commerce']},
  apprentice:{name:'工坊学徒',wage:25,workplace:'workshop',skills:['materials','craft']},
  cook:{name:'餐馆厨工',wage:24,workplace:'cafe',skills:['food']},
  researcher:{name:'研究助理',wage:34,workplace:'school',skills:['materials','research']},
  merchant:{name:'小商人',wage:0,workplace:'market',skills:['commerce','management']}
};

export const RECIPES={
  ceramic:{name:'烧结陶瓷',station:'kiln',minutes:90,inputs:{clay:2},outputs:{ceramic:1},skill:'materials',skillGain:.35},
  porousCeramic:{name:'多孔陶瓷',station:'kiln',minutes:120,inputs:{clay:3},outputs:{porousCeramic:1},skill:'materials',skillGain:.5,requires:{knowledge:{materials:2},technologyStage:{'porous-ceramic-filtration':1}}},
  pottery:{name:'日用陶器',station:'kiln',minutes:80,inputs:{clay:2},outputs:{pottery:1},skill:'craft',skillGain:.4},
  woodenCrate:{name:'木制货箱',station:'workbench',minutes:70,inputs:{wood:2},outputs:{woodenCrate:1},skill:'craft',skillGain:.35},
  ceramicFilter:{name:'陶瓷净水器原型',station:'assembly',minutes:150,inputs:{porousCeramic:2,wood:1},outputs:{ceramicFilter:1},skill:'research',skillGain:.8,requires:{technologyStage:{'porous-ceramic-filtration':2}}}
};

export const TECHNOLOGIES={
  'porous-ceramic-filtration':{
    name:'多孔陶瓷净水技术',
    stages:['需求被发现','原理验证','材料工艺稳定','原型完成','商店试销','社区采用'],
    prerequisites:{knowledge:{materials:2},skills:{materials:1.5}},
    effects:{waterQuality:18,health:5,newJob:'waterTechnician'},
    description:'利用可控制孔隙率的烧结陶瓷过滤悬浮物，并通过可替换滤芯降低维护成本。'
  }
};

const BUILDINGS=[
  {id:'home-player',name:'河畔公寓',kind:'home',x:2,y:2,w:2,h:2,door:{x:3,y:4},color:'#c7855b',roof:'#8e4c4c',sign:'住宅'},
  {id:'home-lin',name:'林家小院',kind:'home',x:5,y:2,w:2,h:2,door:{x:6,y:4},color:'#d5a76d',roof:'#6c704d',sign:'林家'},
  {id:'school',name:'星桥学校',kind:'school',x:10,y:2,w:3,h:3,door:{x:11,y:5},color:'#d7c47a',roof:'#55758f',sign:'学校'},
  {id:'grocery',name:'谷仓食品店',kind:'grocery',x:2,y:7,w:2,h:2,door:{x:3,y:9},color:'#d79b62',roof:'#8a533d',sign:'食品'},
  {id:'cafe',name:'暖炉餐馆',kind:'cafe',x:5,y:7,w:2,h:2,door:{x:6,y:9},color:'#c67661',roof:'#7f3f50',sign:'餐馆'},
  {id:'materialShop',name:'磐石材料行',kind:'materialShop',x:8,y:7,w:2,h:2,door:{x:9,y:9},color:'#9ba0a6',roof:'#5d626b',sign:'材料'},
  {id:'market',name:'晨风商店街',kind:'market',x:11,y:7,w:2,h:2,door:{x:12,y:9},color:'#7db08b',roof:'#456c5a',sign:'市场'},
  {id:'workshop',name:'陶火工坊',kind:'workshop',x:14,y:5,w:3,h:3,door:{x:15,y:8},color:'#b87955',roof:'#5f4b45',sign:'工坊'},
  {id:'warehouse',name:'东岸仓库',kind:'warehouse',x:14,y:10,w:3,h:2,door:{x:15,y:12},color:'#8d9795',roof:'#4e5958',sign:'仓库'}
];

const ROADS=[];for(let x=0;x<19;x++){ROADS.push({x,y:5});ROADS.push({x,y:9});}for(let y=0;y<14;y++){ROADS.push({x:7,y});ROADS.push({x:13,y});}

const NAMES=['林芽','周牧','何岚','夏槐','顾宁','苏砚','唐禾','孟川','黎秋','许陶','白澄','江小满','叶辰','温乔','陆安','沈石','方麦','秦露','韩舟','陈星'];
const HAIR=['#30251d','#5b3828','#1f2937','#754c24','#1b1b1b'];
const CLOTHES=['#4f7cac','#d17b5f','#6f9b75','#a36a98','#c3944f','#61798f'];

function makeTown(seed){
  return{width:19,height:14,tile:{w:48,h:24},buildings:clone(BUILDINGS),roads:clone(ROADS),trees:[{x:1,y:1},{x:8,y:2},{x:17,y:2},{x:1,y:12},{x:10,y:12},{x:18,y:8}],water:[{x:0,y:13},{x:1,y:13},{x:2,y:13},{x:3,y:13},{x:4,y:13},{x:5,y:13}],name:'潮汐工坊镇',seed};
}

function makeHouseholds(rng){
  return[
    {id:'household:lin',surname:'林',home:'home-lin',members:['npc:001','npc:002','npc:003'],wealth:230,relations:[['npc:001','npc:002','spouse'],['npc:001','npc:003','parent'],['npc:002','npc:003','parent']]},
    {id:'household:zhou',surname:'周',home:'home-player',members:['npc:004','npc:005'],wealth:160,relations:[['npc:004','npc:005','siblings']]},
    {id:'household:he',surname:'何',home:'home-player',members:['npc:006'],wealth:115,relations:[]}
  ];
}

function makeNpc(index,rng,households){
  const jobKeys=['shopClerk','apprentice','cook','student','researcher','merchant'];
  const job=jobKeys[index%jobKeys.length];
  const household=households[index%households.length];
  const homes=BUILDINGS.filter(b=>b.kind==='home');const home=BUILDINGS.find(b=>b.id===household.home)??homes[index%homes.length];
  return{id:id('npc',index+1),name:NAMES[index%NAMES.length],age:16+(index*7)%48,job,householdId:household.id,x:home.door.x,y:home.door.y,target:{x:home.door.x,y:home.door.y},money:40+Math.floor(rng()*140),hunger:25+Math.floor(rng()*25),energy:65+Math.floor(rng()*30),mood:55+Math.floor(rng()*35),knowledge:{materials:round1(rng()*2),commerce:round1(rng()*2),food:round1(rng()*2)},traits:{curiosity:round1(rng()),enterprise:round1(rng()),family:round1(rng()),risk:round1(rng())},appearance:{hair:pick(rng,HAIR),clothes:pick(rng,CLOTHES),skin:pick(rng,['#f1c7a5','#d8a982','#b97f5f','#f0b98b'])},memory:[],relationships:{},schedule:[]};
}
function round1(n){return Math.round(n*10)/10;}

function playerFrom(options={}){
  const identity=JOBS[options.identity]?options.identity:'apprentice';
  const background=options.background??'普通家庭';
  const bonuses=background==='工匠家庭'?{money:20,materials:.5,commerce:0}:background==='商人家庭'?{money:80,materials:0,commerce:.5}:{money:0,materials:0,commerce:0};
  return{id:'player:001',name:String(options.name??'杜衡界').slice(0,12),identity,job:identity,background,x:3,y:5,facing:'se',money:120+bonuses.money,hunger:18,energy:92,health:100,knowledge:{materials:identity==='student'?1:0,commerce:bonuses.commerce,food:0},skills:{materials:(identity==='apprentice'?1:0)+bonuses.materials,craft:identity==='apprentice'?1:0,commerce:(identity==='shopClerk'||identity==='merchant'?1:0)+bonuses.commerce,food:identity==='cook'?1:0,research:0},inventory:{bread:1},relationships:{},workshopRented:false,stallRented:false,stallPrice:68,reputation:10,sales:0,homeId:'home-player',appearance:{hair:'#31251f',clothes:'#3e789f',skin:'#efbe97'},flags:{tutorial:true}};
}

export function createTownGame(options={}){
  const seed=String(options.seed??'taowind-town-v016');const rng=rngFrom(seed);const households=makeHouseholds(rng);const npcs=Array.from({length:18},(_,i)=>makeNpc(i,rng,households));
  for(const h of households){h.members=h.members.filter(mid=>npcs.some(n=>n.id===mid));}
  const state={format:'rncs.town-life-industry-state.v0.1',version:TOWN_LIFE_VERSION,seed,day:1,minute:7*60,weather:'晴朗',town:makeTown(seed),player:playerFrom(options.player),npcs,households,economy:{prices:{bread:6,stew:12,milk:8,clay:4,wood:7,iron:13},demand:{food:1,household:1,waterDevice:.35},waterQuality:52,healthIndex:68,marketActivity:1,lastSettlement:null},technologies:{'porous-ceramic-filtration':{stage:0,progress:0,evidence:[],adoption:0,status:'latent'}},history:[],metrics:{llmCalls:0,actions:0,npcDecisions:0},state_root:''};
  log(state,'WORLD_CREATED',`${state.town.name}开始运行，玩家以${JOBS[state.player.identity].name}身份进入小镇。`,{player:state.player.name});
  refreshNpcSchedules(state);sealState(state);return state;
}

function sealState(state){state.state_root=stableRoot(state);return state;}
function log(state,code,text,data={}){state.history.push({event_id:`event:${state.history.length+1}`,day:state.day,minute:state.minute,code,text,data:clone(data)});if(state.history.length>240)state.history.shift();}
function invCount(entity,item){return Number(entity.inventory?.[item]??0);}
function addItem(entity,item,count){entity.inventory??={};entity.inventory[item]=Math.max(0,invCount(entity,item)+count);if(entity.inventory[item]===0)delete entity.inventory[item];}
function hasInputs(entity,inputs){return Object.entries(inputs).every(([k,v])=>invCount(entity,k)>=v);}
function consume(entity,inputs){for(const [k,v] of Object.entries(inputs))addItem(entity,k,-v);}
function currentBuilding(state){return state.town.buildings.find(b=>Math.abs(b.door.x-state.player.x)+Math.abs(b.door.y-state.player.y)<=1)??null;}
function walkable(state,x,y){if(x<0||y<0||x>=state.town.width||y>=state.town.height)return false;for(const b of state.town.buildings){if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)return false;}return true;}
function needsFor(recipe,state){const errors=[];if(recipe.requires?.knowledge)for(const [k,v] of Object.entries(recipe.requires.knowledge))if((state.player.knowledge[k]??0)<v)errors.push(`知识不足：${k} ${v}`);if(recipe.requires?.technologyStage)for(const [k,v] of Object.entries(recipe.requires.technologyStage))if((state.technologies[k]?.stage??0)<v)errors.push(`技术阶段不足：${TECHNOLOGIES[k]?.name??k}`);return errors;}
function hour(state){return Math.floor(state.minute/60)%24;}
function atKind(state,kind){return currentBuilding(state)?.kind===kind;}
function advanceClock(state,minutes){
  let left=Math.max(0,Math.round(minutes));while(left>0){const step=Math.min(30,left);state.minute+=step;state.player.hunger=clamp(state.player.hunger+step/60*2.2,0,100);state.player.energy=clamp(state.player.energy-step/60*1.6,0,100);updateNpcs(state,step);left-=step;if(state.minute>=1440){state.minute-=1440;state.day++;settleDay(state);refreshNpcSchedules(state);}}
}

function refreshNpcSchedules(state){
  for(const npc of state.npcs){const home=state.town.buildings.find(b=>b.id===state.households.find(h=>h.id===npc.householdId)?.home)??state.town.buildings[0];const workplace=state.town.buildings.find(b=>b.kind===JOBS[npc.job]?.workplace)??state.town.buildings.find(b=>b.kind==='market');npc.schedule=[{from:0,to:7,target:home.door,activity:'sleep'},{from:7,to:9,target:state.town.buildings.find(b=>b.kind==='grocery').door,activity:'breakfast'},{from:9,to:17,target:workplace.door,activity:'work'},{from:17,to:20,target:state.town.buildings.find(b=>b.kind==='market').door,activity:'shop'},{from:20,to:24,target:home.door,activity:'home'}];}
}
function targetForNpc(npc,state){const h=hour(state);return npc.schedule.find(s=>h>=s.from&&h<s.to)??npc.schedule[0];}
function updateNpcs(state,minutes){
  for(const npc of state.npcs){const plan=targetForNpc(npc,state);npc.target={...plan.target};const dx=Math.sign(npc.target.x-npc.x),dy=Math.sign(npc.target.y-npc.y);if(Math.abs(npc.target.x-npc.x)>0&&walkable(state,npc.x+dx,npc.y))npc.x+=dx;else if(Math.abs(npc.target.y-npc.y)>0&&walkable(state,npc.x,npc.y+dy))npc.y+=dy;npc.hunger=clamp(npc.hunger+minutes/60*1.5,0,100);npc.energy=clamp(npc.energy-minutes/60*.8,0,100);if(plan.activity==='breakfast'&&npc.hunger>40){npc.money=Math.max(0,npc.money-6);npc.hunger=Math.max(5,npc.hunger-30);state.metrics.npcDecisions++;}if(plan.activity==='shop'&&state.player.stallRented&&invCount(state.player,'ceramicFilter')>0&&state.technologies['porous-ceramic-filtration'].stage>=4&&npc.money>=state.player.stallPrice&&npc.traits.curiosity+.25>((parseInt(hashString(`${state.seed}:${state.day}:${state.minute}:${npc.id}`),16)%1000)/1000)){npc.money-=state.player.stallPrice;state.player.money+=state.player.stallPrice;addItem(state.player,'ceramicFilter',-1);state.player.sales++;state.player.reputation+=2;state.technologies['porous-ceramic-filtration'].adoption++;state.metrics.npcDecisions++;}}
}

function settleDay(state){
  const tech=state.technologies['porous-ceramic-filtration'];if(state.player.stallRented&&invCount(state.player,'ceramicFilter')>0&&tech.stage>=4){const buyers=Math.min(invCount(state.player,'ceramicFilter'),Math.max(0,Math.floor((state.economy.demand.waterDevice+state.player.reputation/80)*3)));if(buyers>0){addItem(state.player,'ceramicFilter',-buyers);state.player.sales+=buyers;state.player.money+=buyers*state.player.stallPrice;tech.adoption+=buyers;log(state,'MARKET_SALES',`净水器售出${buyers}台。`,{buyers,revenue:buyers*state.player.stallPrice});}}
  if(tech.stage===4&&tech.adoption>=3){tech.stage=5;tech.status='adopted';state.economy.waterQuality=clamp(state.economy.waterQuality+18,0,100);state.economy.healthIndex=clamp(state.economy.healthIndex+5,0,100);log(state,'TECH_ADOPTED','多孔陶瓷净水技术被社区采用，新的净水设备职业出现。',{technology:'porous-ceramic-filtration'});}
  state.economy.demand.food=round1(clamp(state.economy.demand.food+((state.day%3)-1)*.04,.7,1.4));state.economy.demand.waterDevice=round1(clamp(state.economy.demand.waterDevice+(state.economy.waterQuality<70?.08:-.02),.15,1.5));state.economy.lastSettlement={day:state.day-1,playerMoney:state.player.money,sales:state.player.sales};log(state,'DAY_SETTLED',`第${state.day-1}日经济结算完成。`,state.economy.lastSettlement);
}

function study(state,domain){if(!atKind(state,'school'))throw new Error('必须在学校门口学习');if(!['materials','commerce','food'].includes(domain))throw new Error('未知学习领域');if(state.player.money<8)throw new Error('学费不足');state.player.money-=8;advanceClock(state,120);state.player.knowledge[domain]=round1((state.player.knowledge[domain]??0)+.55);state.player.energy=clamp(state.player.energy-8,0,100);log(state,'STUDY_COMPLETED',`完成${domain}课程。`,{domain,level:state.player.knowledge[domain]});}
function work(state){const job=JOBS[state.player.job];if(!job)throw new Error('没有有效职业');if(job.wage<=0)throw new Error('当前身份没有固定工资');if(!atKind(state,job.workplace))throw new Error(`必须在${job.workplace}工作地点`);advanceClock(state,180);state.player.money+=job.wage;for(const skill of job.skills)if(state.player.skills[skill]!==undefined)state.player.skills[skill]=round1(state.player.skills[skill]+.25);state.player.energy=clamp(state.player.energy-10,0,100);log(state,'WORK_SHIFT',`完成${job.name}班次，收入${job.wage}。`,{job:state.player.job,wage:job.wage});}
function buy(state,item,count=1){const catalog=ITEM_CATALOG[item];if(!catalog)throw new Error('未知商品');const building=currentBuilding(state);const food=['bread','stew','milk'].includes(item),material=['clay','wood','iron'].includes(item);if(food&&!['grocery','cafe'].includes(building?.kind))throw new Error('这里不销售食物');if(material&&building?.kind!=='materialShop')throw new Error('必须在材料行购买');const price=state.economy.prices[item]??catalog.price??catalog.basePrice;const total=price*count;if(state.player.money<total)throw new Error('资金不足');state.player.money-=total;addItem(state.player,item,count);advanceClock(state,15);log(state,'ITEM_BOUGHT',`购买${catalog.name}×${count}。`,{item,count,total});}
function eat(state,item){const c=ITEM_CATALOG[item];if(c?.kind!=='food'||invCount(state.player,item)<1)throw new Error('没有可食用物品');addItem(state.player,item,-1);state.player.hunger=clamp(state.player.hunger-c.nutrition,0,100);state.player.energy=clamp(state.player.energy+c.energy,0,100);advanceClock(state,15);log(state,'FOOD_EATEN',`食用了${c.name}。`,{item});}
function craft(state,recipeId){if(!atKind(state,'workshop'))throw new Error('必须在工坊门口制造');if(!state.player.workshopRented)throw new Error('需要先租用工坊');const recipe=RECIPES[recipeId];if(!recipe)throw new Error('未知配方');const unmet=needsFor(recipe,state);if(unmet.length)throw new Error(unmet.join('；'));if(!hasInputs(state.player,recipe.inputs))throw new Error('原材料不足');consume(state.player,recipe.inputs);advanceClock(state,recipe.minutes);for(const [k,v] of Object.entries(recipe.outputs))addItem(state.player,k,v);state.player.skills[recipe.skill]=round1((state.player.skills[recipe.skill]??0)+recipe.skillGain);if(recipeId==='porousCeramic'){const tech=state.technologies['porous-ceramic-filtration'];tech.stage=Math.max(tech.stage,2);tech.status='materials-ready';tech.evidence.push('首批多孔陶瓷工艺样品');log(state,'MATERIAL_EVOLVED','黏土经过配方与烧结工艺演化为多孔陶瓷。',{from:'clay',to:'porousCeramic'});}if(recipeId==='ceramicFilter'){const tech=state.technologies['porous-ceramic-filtration'];tech.stage=Math.max(tech.stage,3);tech.status='prototype';tech.evidence.push('可运行净水器原型');log(state,'TECH_PROTOTYPE','完成第一台陶瓷净水器原型。',{technology:'porous-ceramic-filtration'});}else log(state,'CRAFT_COMPLETED',`制造完成：${recipe.name}。`,{recipeId});}
function research(state){if(!atKind(state,'school'))throw new Error('必须在学校实验室进行研究');const p=state.player,t=state.technologies['porous-ceramic-filtration'];if(p.knowledge.materials<2||p.skills.materials<1.5)throw new Error('需要材料知识2级与材料技能1.5级');advanceClock(state,180);p.skills.research=round1(p.skills.research+.7);t.stage=Math.max(t.stage,1);t.progress=25;t.status='principle-verified';t.evidence.push('毛细过滤实验通过');log(state,'TECH_PRINCIPLE_VERIFIED','验证了多孔陶瓷的毛细过滤原理。',{technology:'porous-ceramic-filtration'});}
function rentWorkshop(state){if(!atKind(state,'workshop'))throw new Error('必须在工坊门口');if(state.player.workshopRented)return;if(state.player.money<60)throw new Error('资金不足，需要60');state.player.money-=60;state.player.workshopRented=true;log(state,'WORKSHOP_RENTED','租下陶火工坊的工作台。',{cost:60});}
function rentStall(state){if(!atKind(state,'market'))throw new Error('必须在商店街');if(state.player.stallRented)return;if(state.player.money<120)throw new Error('资金不足，需要120');state.player.money-=120;state.player.stallRented=true;log(state,'STALL_RENTED','在商店街租下销售摊位。',{cost:120});}
function launchProduct(state){if(!atKind(state,'market'))throw new Error('必须在商店街');if(!state.player.stallRented)throw new Error('需要销售摊位');if(invCount(state.player,'ceramicFilter')<1)throw new Error('没有净水器库存');const tech=state.technologies['porous-ceramic-filtration'];if(tech.stage<3)throw new Error('原型尚未完成');tech.stage=Math.max(tech.stage,4);tech.status='market-pilot';tech.evidence.push('商店街试销');state.economy.demand.waterDevice=clamp(state.economy.demand.waterDevice+.25,0,1.5);advanceClock(state,60);log(state,'PRODUCT_LAUNCHED','陶瓷净水器进入商店街试销。',{price:state.player.stallPrice});}
function socialize(state,npcId){const npc=state.npcs.find(n=>n.id===npcId);if(!npc)throw new Error('居民不存在');if(Math.abs(npc.x-state.player.x)+Math.abs(npc.y-state.player.y)>2)throw new Error('居民距离太远');state.player.relationships[npcId]=clamp((state.player.relationships[npcId]??0)+8,0,100);npc.relationships[state.player.id]=state.player.relationships[npcId];advanceClock(state,20);log(state,'SOCIAL_INTERACTION',`与${npc.name}交谈，关系提升。`,{npcId,relationship:state.player.relationships[npcId]});}

export function dispatchTownAction(source,action={}){
  const state=clone(source);try{
    if(action.type==='move'){const dx=clamp(Math.round(action.dx??0),-1,1),dy=clamp(Math.round(action.dy??0),-1,1),nx=state.player.x+dx,ny=state.player.y+dy;if(walkable(state,nx,ny)){state.player.x=nx;state.player.y=ny;state.player.facing=dx>0?'se':dx<0?'nw':dy>0?'sw':'ne';advanceClock(state,5);}}
    else if(action.type==='wait')advanceClock(state,Math.max(5,action.minutes??30));
    else if(action.type==='buy')buy(state,action.item,Math.max(1,Math.round(action.count??1)));
    else if(action.type==='eat')eat(state,action.item);
    else if(action.type==='study')study(state,action.domain??'materials');
    else if(action.type==='work')work(state);
    else if(action.type==='rent-workshop')rentWorkshop(state);
    else if(action.type==='craft')craft(state,action.recipe);
    else if(action.type==='research')research(state);
    else if(action.type==='rent-stall')rentStall(state);
    else if(action.type==='launch-product')launchProduct(state);
    else if(action.type==='socialize')socialize(state,action.npcId);
    else if(action.type==='set-price'){state.player.stallPrice=clamp(Math.round(action.price??68),20,160);log(state,'PRICE_CHANGED',`净水器售价调整为${state.player.stallPrice}。`,{price:state.player.stallPrice});}
    else throw new Error(`未知动作：${action.type}`);
    state.metrics.actions++;sealState(state);return{ok:true,state,events:state.history.slice(source.history.length)};
  }catch(error){return{ok:false,state:source,error:{code:'ACTION_REJECTED',message:error.message},events:[]};}
}

export function townInteractionContext(state){const building=currentBuilding(state);const nearNpcs=state.npcs.filter(n=>Math.abs(n.x-state.player.x)+Math.abs(n.y-state.player.y)<=2).slice(0,4);const actions=[];if(building?.kind==='grocery'||building?.kind==='cafe')actions.push({type:'buy',item:'bread',label:'购买面包 6'},{type:'buy',item:'stew',label:'购买炖汤 12'},{type:'buy',item:'milk',label:'购买鲜奶 8'});if(building?.kind==='materialShop')actions.push({type:'buy',item:'clay',label:'购买黏土 4'},{type:'buy',item:'wood',label:'购买木料 7'},{type:'buy',item:'iron',label:'购买铁料 13'});if(building?.kind==='school')actions.push({type:'study',domain:'materials',label:'学习材料学 8'},{type:'study',domain:'commerce',label:'学习商业 8'},{type:'research',label:'验证净水原理'});if(building?.kind==='workshop')actions.push({type:'rent-workshop',label:'租工作台 60'},...Object.keys(RECIPES).map(recipe=>({type:'craft',recipe,label:`制造：${RECIPES[recipe].name}`})));if(building?.kind==='market')actions.push({type:'rent-stall',label:'租摊位 120'},{type:'launch-product',label:'试销净水器'});const job=JOBS[state.player.job];if(building?.kind===job?.workplace&&job.wage>0)actions.push({type:'work',label:`完成${job.name}班次 +${job.wage}`});for(const item of ['bread','stew','milk'])if(invCount(state.player,item)>0)actions.push({type:'eat',item,label:`食用${ITEM_CATALOG[item].name}`});for(const npc of nearNpcs)actions.push({type:'socialize',npcId:npc.id,label:`与${npc.name}交谈`});return{building,nearNpcs,actions};}

export function projectTown2_5D(state){return{format:'vsr.town-2.5d-projection.v0.1',version:TOWN_LIFE_VERSION,clock:{day:state.day,minute:state.minute,weather:state.weather},map:clone(state.town),player:{...clone(state.player),screenLayer:100+state.player.x+state.player.y},npcs:state.npcs.map(n=>({...clone(n),screenLayer:50+n.x+n.y})).sort((a,b)=>a.screenLayer-b.screenLayer),economy:clone(state.economy),technology:clone(state.technologies),projection_root:hashString(`${state.state_root}:projection`)};}

export function inspectTownGame(state){return{version:state.version,protocol:TOWN_LIFE_PROTOCOL,day:state.day,time:`${String(Math.floor(state.minute/60)).padStart(2,'0')}:${String(state.minute%60).padStart(2,'0')}`,player:{name:state.player.name,job:JOBS[state.player.job]?.name,money:state.player.money,hunger:round1(state.player.hunger),energy:round1(state.player.energy),inventory:clone(state.player.inventory),skills:clone(state.player.skills),knowledge:clone(state.player.knowledge),sales:state.player.sales},town:{name:state.town.name,npcCount:state.npcs.length,households:state.households.length,buildings:state.town.buildings.length,waterQuality:state.economy.waterQuality},technology:clone(state.technologies['porous-ceramic-filtration']),llmCalls:state.metrics.llmCalls,state_root:state.state_root};}

export function verifyTownGame(state){const errors=[];if(state?.format!=='rncs.town-life-industry-state.v0.1')errors.push('FORMAT_INVALID');if(state?.metrics?.llmCalls!==0)errors.push('LLM_USAGE_DETECTED');if(!state?.town?.buildings?.length)errors.push('BUILDINGS_MISSING');if(!state?.npcs?.length)errors.push('NPCS_MISSING');if(stableRoot(state)!==state?.state_root)errors.push('STATE_ROOT_MISMATCH');return{valid:errors.length===0,errors};}

export function exportTownSave(state){const verification=verifyTownGame(state);if(!verification.valid)throw new Error(verification.errors.join(','));return JSON.stringify(state);}
export function importTownSave(text){const state=JSON.parse(text);const verification=verifyTownGame(state);if(!verification.valid)throw new Error(verification.errors.join(','));return state;}

export function health(){return{status:'ok',protocol:TOWN_LIFE_PROTOCOL,version:TOWN_LIFE_VERSION,projection:'2.5d-isometric-pixel',llm_required:false,systems:['character','town','food','profession','family-relations','materials','manufacturing','technology-evolution','commerce','history']};}
