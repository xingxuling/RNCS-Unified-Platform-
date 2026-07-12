import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {clone,rootHash,seal,stableId,seededRandom,clamp,GenesisError} from './canonical.mjs';

export const SOCIETY_GENESIS_VERSION='0.5.0-alpha.1';
export const SOCIETY_FORMATS={
  intent:'ragf.society-intent.v0.5',
  genome:'ragf.society-genome.v0.5',
  ecology:'ragf.social-ecology.v0.5',
  concept:'ragf.technology-concept.v0.5',
  conceptSpace:'ragf.technology-concept-space.v0.5',
  history:'ragf.society-history.v0.5',
  participation:'ragf.player-participation.v0.5',
  projection:'ragf.projection-2.5d.v0.5',
  runtime:'ragf.society-runtime-contract.v0.5',
  workspace:'ragf.society-genesis-workspace.v0.5'
};

const TECHNOLOGY_GRAMMAR={
  functions:['store-energy','transmit-information','purify-water','repair-structure','coordinate-production','sense-environment','move-loads','stabilize-climate','preserve-food','augment-labor','compute-rules','heal-ecosystem'],
  principles:['phase-change','acoustic-resonance','capillary-flow','mechanical-logic','optical-coding','microbial-metabolism','thermal-gradient','electromagnetic-induction','feedback-control','modular-tension','chemical-adsorption','distributed-consensus'],
  substrates:['ceramic','glass','copper','fiber','timber','steel','mycelium','carbon','salt-hydrate','water','silicon','living-soil'],
  energy:['human','wind','water','solar-thermal','combustion','chemical','electrical','stored-heat'],
  controls:['manual','mechanical-governor','fluidic-logic','relay','analog-feedback','digital-logic','distributed-protocol'],
  manufacturing:['craft','casting','kiln','machining','lamination','fermentation','wire-winding','precision-assembly','additive-forming','bioprocess']
};

const CONCEPT_ARCHETYPES=[
  {function:'store-energy',principle:'phase-change',substrate:'salt-hydrate',energy:'solar-thermal',control:'mechanical-governor',manufacturing:'kiln',name:'相变热库网络',domains:['materials','energy','mechanics'],impact:{energy:18,food:3,knowledge:2}},
  {function:'transmit-information',principle:'acoustic-resonance',substrate:'ceramic',energy:'human',control:'distributed-protocol',manufacturing:'craft',name:'声学公共通信网',domains:['mechanics','organization','computation'],impact:{knowledge:16,legitimacy:5}},
  {function:'repair-structure',principle:'microbial-metabolism',substrate:'mycelium',energy:'chemical',control:'analog-feedback',manufacturing:'bioprocess',name:'菌丝自修复构件',domains:['biology','materials','organization'],impact:{timber:8,health:5}},
  {function:'compute-rules',principle:'mechanical-logic',substrate:'steel',energy:'water',control:'mechanical-governor',manufacturing:'precision-assembly',name:'分布式机械逻辑工坊',domains:['mechanics','computation','organization'],impact:{knowledge:12,ore:-3,legitimacy:4}},
  {function:'purify-water',principle:'capillary-flow',substrate:'ceramic',energy:'solar-thermal',control:'manual',manufacturing:'kiln',name:'毛细陶瓷净水塔',domains:['materials','chemistry','health'],impact:{water:22,health:12}},
  {function:'sense-environment',principle:'optical-coding',substrate:'glass',energy:'solar-thermal',control:'analog-feedback',manufacturing:'precision-assembly',name:'光码环境哨站',domains:['optics','materials','organization'],impact:{knowledge:8,health:4,food:4}},
  {function:'move-loads',principle:'modular-tension',substrate:'fiber',energy:'wind',control:'mechanical-governor',manufacturing:'lamination',name:'张力模块运输网',domains:['mechanics','materials','organization'],impact:{food:5,timber:4,ore:4}},
  {function:'preserve-food',principle:'thermal-gradient',substrate:'ceramic',energy:'stored-heat',control:'manual',manufacturing:'kiln',name:'梯度温差保鲜窖',domains:['energy','materials','health'],impact:{food:15,health:3}},
  {function:'augment-labor',principle:'feedback-control',substrate:'steel',energy:'chemical',control:'fluidic-logic',manufacturing:'machining',name:'流体逻辑助力外骨架',domains:['mechanics','materials','computation'],impact:{food:5,ore:8,timber:6}},
  {function:'heal-ecosystem',principle:'chemical-adsorption',substrate:'carbon',energy:'solar-thermal',control:'distributed-protocol',manufacturing:'bioprocess',name:'碳基土壤修复阵列',domains:['chemistry','biology','organization'],impact:{food:9,health:7}},
  {function:'coordinate-production',principle:'distributed-consensus',substrate:'fiber',energy:'human',control:'distributed-protocol',manufacturing:'craft',name:'可验证协作账册',domains:['organization','computation','materials'],impact:{legitimacy:12,knowledge:8}},
  {function:'stabilize-climate',principle:'capillary-flow',substrate:'living-soil',energy:'water',control:'analog-feedback',manufacturing:'bioprocess',name:'活土蒸散气候廊道',domains:['biology','energy','organization'],impact:{food:8,water:5,health:5}}
];

const DOMAIN_LABELS={materials:'材料',mechanics:'机械',chemistry:'化学',biology:'生物',optics:'光学',computation:'计算',organization:'组织',energy:'能源',health:'健康'};
const TECH_LABELS={function:{'store-energy':'储能','transmit-information':'通信','purify-water':'净水','repair-structure':'自修复结构','coordinate-production':'协作生产','sense-environment':'环境感知','move-loads':'运输','stabilize-climate':'气候调节','preserve-food':'保鲜','augment-labor':'劳动增强','compute-rules':'规则计算','heal-ecosystem':'生态修复'},principle:{'phase-change':'相变','acoustic-resonance':'声学共振','capillary-flow':'毛细流','mechanical-logic':'机械逻辑','optical-coding':'光学编码','microbial-metabolism':'微生物代谢','thermal-gradient':'温差梯度','electromagnetic-induction':'电磁感应','feedback-control':'反馈控制','modular-tension':'模块张力','chemical-adsorption':'化学吸附','distributed-consensus':'分布式共识'},substrate:{ceramic:'陶瓷',glass:'玻璃',copper:'铜',fiber:'纤维',timber:'木质',steel:'钢',mycelium:'菌丝',carbon:'碳基','salt-hydrate':'水合盐',water:'水介质',silicon:'硅','living-soil':'活土'},energy:{human:'人力',wind:'风力',water:'水力','solar-thermal':'太阳热',combustion:'燃烧',chemical:'化学能',electrical:'电力','stored-heat':'储热'},control:{manual:'人工','mechanical-governor':'机械调速','fluidic-logic':'流体逻辑',relay:'继电','analog-feedback':'模拟反馈','digital-logic':'数字逻辑','distributed-protocol':'分布式协议'},manufacturing:{craft:'手工',casting:'铸造',kiln:'窑烧',machining:'机械加工',lamination:'层压',fermentation:'发酵','wire-winding':'绕线','precision-assembly':'精密装配','additive-forming':'增材成型',bioprocess:'生物工艺'}};
const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
const round=(n,d=4)=>Number(Number(n).toFixed(d));
const mkdir=p=>fs.mkdirSync(p,{recursive:true});
const writeJson=(p,v)=>{mkdir(path.dirname(p));fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const sha=b=>createHash('sha256').update(b).digest('hex');
const pick=(rng,list)=>list[Math.floor(rng()*list.length)%list.length];

function verifyRoot(value,field,omit=[]){if(!value||typeof value!=='object'||typeof value[field]!=='string')return false;const x=clone(value),actual=x[field];delete x[field];for(const key of omit)delete x[key];return rootHash(x)===actual;}

export function normalizeSocietyIntent(input={}){
  const description=String(input.description??input.goal??'').trim();
  if(!description)throw new GenesisError('SOCIETY_INTENT_DESCRIPTION_REQUIRED');
  const worldName=String(input.world_name??'未命名社会').trim();
  const population=Math.max(24,Math.min(5000,Math.round(input.population??240)));
  const years=Math.max(5,Math.min(500,Math.round(input.years??60)));
  const mapSize=Math.max(6,Math.min(32,Math.round(input.map_size??10)));
  const intent={
    format:SOCIETY_FORMATS.intent,version:SOCIETY_GENESIS_VERSION,
    intent_id:input.intent_id??stableId('society-intent',{description,worldName,population,years}),
    subject_id:input.subject_id??'subject:founder',description,world_name:worldName,
    seed:String(input.seed??rootHash({description,worldName}).slice(0,16)),
    population,years,map_size:mapSize,era:input.era??'open-ended-industrial-transition',
    target_platforms:[...new Set(input.target_platforms??['web','desktop','mobile'])].sort(),
    design:{projection:'2.5d-isometric',human_playable:true,llm_usage:'forbidden',history_required:true,social_ecology_required:true,technology_emergence_required:true},
    environment:{climate:input.environment?.climate??'temperate-variable',water_abundance:clamp(input.environment?.water_abundance??6200),fertility:clamp(input.environment?.fertility??5800),ore_abundance:clamp(input.environment?.ore_abundance??4200),timber_abundance:clamp(input.environment?.timber_abundance??6400),hazard:clamp(input.environment?.hazard??2400)},
    society:{knowledge_openness:clamp(input.society?.knowledge_openness??6200),risk_tolerance:clamp(input.society?.risk_tolerance??4700),cooperation:clamp(input.society?.cooperation??6100),inequality:clamp(input.society?.inequality??2800),centralization:clamp(input.society?.centralization??4200)},
    technology_focus:[...new Set(input.technology_focus??['energy','materials','organization','computation'])].sort(),
    player_roles:[...new Set(input.player_roles??['citizen','researcher','entrepreneur','policy-maker'])].sort(),
    constraints:{max_agents:Math.max(16,Math.min(128,Math.round(input.constraints?.max_agents??48))),max_concepts:Math.max(6,Math.min(48,Math.round(input.constraints?.max_concepts??16))),epistemic_policy:'simulation-hypothesis-not-real-world-proof',deterministic:true},
    extensions:clone(input.extensions??{})
  };
  return seal(intent,'intent_root');
}

export function validateSocietyIntent(intent){
  const errors=[];
  if(intent?.format!==SOCIETY_FORMATS.intent)errors.push('FORMAT_INVALID');
  for(const key of ['intent_id','subject_id','description','world_name','seed','intent_root'])if(!intent?.[key])errors.push(`MISSING:${key}`);
  if(intent?.design?.llm_usage!=='forbidden')errors.push('LLM_USAGE_MUST_BE_FORBIDDEN');
  if(!verifyRoot(intent,'intent_root'))errors.push('INTENT_ROOT_MISMATCH');
  return{valid:errors.length===0,errors};
}

export function compileSocietyGenome(intentInput){
  const intent=intentInput?.format===SOCIETY_FORMATS.intent?intentInput:normalizeSocietyIntent(intentInput);
  const validation=validateSocietyIntent(intent);if(!validation.valid)throw new GenesisError('SOCIETY_INTENT_INVALID',validation.errors.join(','));
  const genome={
    format:SOCIETY_FORMATS.genome,version:SOCIETY_GENESIS_VERSION,
    genome_id:stableId('society-genome',intent.intent_root),intent_root:intent.intent_root,
    identity:{world_id:stableId('world',{name:intent.world_name,seed:intent.seed}),name:intent.world_name,continuity_policy:'generation-ledger'},
    simulation:{engine:'deterministic-rule-system',llm_calls:0,tick_unit:'year',years:intent.years,map_size:intent.map_size,seed:intent.seed,agent_model:'bounded-utility-memory-state-machine'},
    environment:clone(intent.environment),
    population:{initial:intent.population,representative_agents:intent.constraints.max_agents,household_size:[2,6],life_expectancy:[48,82],mobility:'occupation-and-institution-driven'},
    needs:{nutrition:1,shelter:.82,health:.78,knowledge:.55,security:.72,belonging:.74,legitimacy:.66},
    domains:{materials:1800,mechanics:1600,chemistry:1100,biology:1500,optics:900,computation:700,organization:2200,energy:1300,health:1400},
    institutions:['council','market','archive','workshop','clinic','commons'],
    occupations:['farmer','builder','miner','craftsperson','healer','researcher','merchant','administrator','transporter','teacher'],
    norms:{knowledge_openness:intent.society.knowledge_openness,risk_tolerance:intent.society.risk_tolerance,cooperation:intent.society.cooperation,inequality:intent.society.inequality,centralization:intent.society.centralization},
    resources:['food','water','timber','ore','energy','knowledge','health','legitimacy'],
    technology_grammar:clone(TECHNOLOGY_GRAMMAR),
    player:{roles:clone(intent.player_roles),participation:'authority-bounded-world-actions'},
    epistemic:{status:'simulation-model',real_world_validation_required:true,claims_prohibited:['guaranteed-future','proven-feasibility','scientific-certainty']}
  };
  return seal(genome,'genome_root');
}

function createMap(genome,size){
  const rng=seededRandom(`${genome.simulation.seed}:map`),tiles=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const n=rng(),edge=Math.min(x,y,size-1-x,size-1-y),water=n<.13||edge===0&&rng()<.22;
    const biome=water?'water':n<.35?'forest':n<.62?'plain':n<.8?'hill':'rock';
    tiles.push({tile_id:`tile:${x}:${y}`,x,y,height:water?0:1+Math.floor(rng()*4),biome,resources:{food:biome==='plain'?6:biome==='forest'?3:1,timber:biome==='forest'?8:biome==='plain'?2:0,ore:biome==='rock'?8:biome==='hill'?4:0,water:water?10:biome==='plain'?3:1},buildable:!water});
  }
  return tiles;
}

function createInstitutions(genome,tiles){
  const buildable=tiles.filter(t=>t.buildable),center=Math.floor(buildable.length/2);
  const defs=[
    ['council','议事厅','governance'],['market','交换广场','trade'],['archive','公共档案馆','knowledge'],
    ['workshop','联合工坊','engineering'],['clinic','社区诊疗所','health'],['commons','公共资源社','ecology']
  ];
  return defs.map((d,i)=>({institution_id:`institution:${d[0]}`,kind:d[0],name:d[1],function:d[2],tile_id:buildable[(center+i*7)%buildable.length].tile_id,capacity:40+i*12,legitimacy:5800+i*240,policies:[]}));
}

function createAgents(genome,tiles,institutions){
  const rng=seededRandom(`${genome.simulation.seed}:agents`),count=genome.population.representative_agents,buildable=tiles.filter(t=>t.buildable),agents=[];
  const given=['岚','澄','衡','遥','砾','禾','弦','朔','芒','渊','舟','璃','砚','杉','川','霁'];
  const family=['杜','沈','林','顾','秦','苏','陆','叶','周','程','罗','黎'];
  for(let i=0;i<count;i++){
    const occupation=genome.occupations[i%genome.occupations.length],inst=institutions[i%institutions.length];
    agents.push({agent_id:`agent:${String(i+1).padStart(3,'0')}`,name:`${pick(rng,family)}${pick(rng,given)}`,age:16+Math.floor(rng()*52),household_id:`household:${String(Math.floor(i/4)+1).padStart(2,'0')}`,occupation,institution_id:inst.institution_id,home_tile_id:buildable[(i*11+3)%buildable.length].tile_id,traits:{curiosity:clamp(rng()*10000),cooperation:clamp((rng()*.6+.25)*10000),risk:clamp(rng()*10000),status_drive:clamp(rng()*8500),craft:clamp(rng()*10000)},needs:{nutrition:7000+Math.floor(rng()*2500),security:6000+Math.floor(rng()*3000),belonging:5500+Math.floor(rng()*3500),knowledge:3000+Math.floor(rng()*6000)},memory:{capacity:24,policy:'salience-and-recency',events:[]},decision:{model:'weighted-bounded-utility',action_set:['work','trade','learn','research','organize','rest','migrate']}});
  }
  return agents;
}

function createLinks(agents){
  const links=[];
  for(let i=0;i<agents.length;i++){
    const a=agents[i],b=agents[(i+1)%agents.length],c=agents[(i+7)%agents.length];
    links.push({from:a.agent_id,to:b.agent_id,type:a.household_id===b.household_id?'kin':'neighbor',trust:6200+(i*137)%2800});
    if(a.institution_id===c.institution_id||i%3===0)links.push({from:a.agent_id,to:c.agent_id,type:'work',trust:4800+(i*193)%3300});
  }
  return links;
}

export function createSocialEcology(genome){
  const size=genome.simulation.map_size??Math.round(Math.sqrt(genome.population.initial/2));
  const mapSize=Math.max(6,Math.min(32,size));
  const tiles=createMap(genome,mapSize),institutions=createInstitutions(genome,tiles),agents=createAgents(genome,tiles,institutions),links=createLinks(agents);
  const households=[...new Set(agents.map(a=>a.household_id))].map(id=>({household_id:id,members:agents.filter(a=>a.household_id===id).map(a=>a.agent_id),inventory:{food:18,water:24,tools:3},strategy:'satisfice-and-buffer'}));
  const factions=[
    {faction_id:'faction:commons',name:'公共协作派',priority:['cooperation','open-knowledge','ecology'],members:agents.filter((_,i)=>i%4===0).map(a=>a.agent_id)},
    {faction_id:'faction:makers',name:'工程制造派',priority:['production','experimentation','infrastructure'],members:agents.filter((_,i)=>i%4===1).map(a=>a.agent_id)},
    {faction_id:'faction:stewards',name:'稳态守护派',priority:['security','continuity','risk-control'],members:agents.filter((_,i)=>i%4===2).map(a=>a.agent_id)},
    {faction_id:'faction:frontier',name:'边界探索派',priority:['novelty','mobility','new-markets'],members:agents.filter((_,i)=>i%4===3).map(a=>a.agent_id)}
  ];
  return seal({format:SOCIETY_FORMATS.ecology,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,genome_root:genome.genome_root,map:{projection:'2.5d-isometric',width:mapSize,height:mapSize,tiles},agents,households,institutions,factions,links,economy:{medium:'resource-and-credit-ledger',markets:['food','materials','labor','knowledge'],ownership:['personal','household','cooperative','public']},governance:{authority:'bounded-participatory',decision_cycles:4,appeal:true},ecology_root:''},'ecology_root');
}

function conceptThresholds(domains,novelty,feasibility){
  const out={};for(const domain of domains)out[domain]=Math.round(900+novelty*.14+Math.max(0,6500-feasibility)*.08);return out;
}

function engineeringPath(concept){
  const phases=[
    ['need-model','需求与边界建模',['pressure-map','success-metrics','safety-boundary']],
    ['principle-proof','原理验证',['bench-experiment','measurement-protocol','falsification-result']],
    ['material-process','材料与工艺验证',['sample-set','process-window','failure-analysis']],
    ['component-prototype','关键组件原型',['component-bom','prototype-v1','test-report']],
    ['system-integration','系统集成',['interface-contract','prototype-v2','integration-evidence']],
    ['field-pilot','社会场景试点',['pilot-site','operator-training','impact-ledger']],
    ['scale-and-govern','规模化与治理',['manufacturing-plan','maintenance-model','governance-policy']]
  ];
  return phases.map((p,index)=>({phase:index,phase_id:`${concept.concept_id}:phase:${index}`,name:p[0],label:p[1],depends_on:index?[`${concept.concept_id}:phase:${index-1}`]:[],deliverables:p[2],work_packages:[{discipline:concept.domains[index%concept.domains.length],task:`验证${concept.name}在${p[1]}阶段的关键假设`,acceptance:index<2?'可证伪实验通过':'指标、成本与安全边界同时达标'}],resources:{knowledge:8+index*4,materials:5+index*3,labor:12+index*6},risk_gate:index<2?'research':index<5?'engineering':'social-deployment'}));
}

function createConcept(archetype,index,genome,rng,{playerProposal=false}={}){
  const novelty=clamp(4200+rng()*4200+(archetype.control==='distributed-protocol'?700:0)+(archetype.substrate==='mycelium'||archetype.substrate==='living-soil'?500:0));
  const feasibility=clamp(7200-rng()*2200-(novelty-5000)*.18+(archetype.manufacturing==='craft'?700:0));
  const socialFit=clamp(5200+genome.norms.cooperation*.22+genome.norms.knowledge_openness*.18-rng()*1100);
  const conceptId=stableId('technology-concept',{world:genome.identity.world_id,index,archetype,playerProposal});
  const thresholds=conceptThresholds(archetype.domains,novelty,feasibility);
  const concept={
    format:SOCIETY_FORMATS.concept,version:SOCIETY_GENESIS_VERSION,concept_id:conceptId,name:archetype.name,
    epistemic_status:'simulation-hypothesis',real_world_validation_required:true,origin:playerProposal?'player-structured-proposal':'deterministic-concept-grammar',
    grammar:{function:archetype.function,principle:archetype.principle,substrate:archetype.substrate,energy:archetype.energy,control:archetype.control,manufacturing:archetype.manufacturing},
    domains:clone(archetype.domains),novelty_score:novelty,feasibility_score:feasibility,social_fit_score:socialFit,knowledge_thresholds:thresholds,
    prerequisites:archetype.domains.map(d=>({type:'knowledge-domain',domain:d,minimum:thresholds[d]})),
    bottlenecks:[`${archetype.substrate}-quality`,`${archetype.control}-reliability`,`${archetype.manufacturing}-repeatability`],
    experiments:[{experiment_id:`${conceptId}:exp:1`,hypothesis:`${archetype.principle}可在${archetype.substrate}中实现${archetype.function}`,measurements:['efficiency','stability','failure-rate'],pass:{efficiency:0.45,stability:0.7}},{experiment_id:`${conceptId}:exp:2`,hypothesis:`${archetype.control}能够在社会使用场景保持可控`,measurements:['response-time','operator-error','maintenance-load'],pass:{operator_error_max:0.12}}],
    engineering_path:[],failure_modes:[{code:'PRINCIPLE_NOT_REPRODUCIBLE',mitigation:'回退到原理验证并缩小尺度'},{code:'MATERIAL_PROCESS_UNSTABLE',mitigation:'建立材料分级和工艺窗口'},{code:'SOCIAL_REJECTION',mitigation:'缩小试点并调整治理权责'},{code:'MAINTENANCE_OVERLOAD',mitigation:'模块化、冗余与运维训练'}],
    adoption_conditions:{minimum_legitimacy:4600,minimum_knowledge_openness:3000,maximum_resource_stress:8200,pilot_required:true},
    projected_impact:clone(archetype.impact),status:'latent',progress:0,concept_root:''
  };
  concept.engineering_path=engineeringPath(concept);
  return seal(concept,'concept_root');
}

export function generateTechnologyConceptSpace(genome,{maxConcepts=16}={}){
  const rng=seededRandom(`${genome.simulation.seed}:technology-space`),concepts=[];
  const shuffled=[...CONCEPT_ARCHETYPES];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  for(let i=0;i<Math.min(maxConcepts,shuffled.length);i++)concepts.push(createConcept(shuffled[i],i,genome,rng));
  while(concepts.length<maxConcepts){
    const functionName=pick(rng,TECHNOLOGY_GRAMMAR.functions),principle=pick(rng,TECHNOLOGY_GRAMMAR.principles),substrate=pick(rng,TECHNOLOGY_GRAMMAR.substrates),energy=pick(rng,TECHNOLOGY_GRAMMAR.energy),control=pick(rng,TECHNOLOGY_GRAMMAR.controls),manufacturing=pick(rng,TECHNOLOGY_GRAMMAR.manufacturing);
    const domains=[pick(rng,Object.keys(genome.domains)),pick(rng,Object.keys(genome.domains)),pick(rng,Object.keys(genome.domains))].filter((v,i,a)=>a.indexOf(v)===i);
    const name=`${TECH_LABELS.substrate[substrate]??substrate}${TECH_LABELS.principle[principle]??principle}${TECH_LABELS.function[functionName]??functionName}系统`;
    concepts.push(createConcept({function:functionName,principle,substrate,energy,control,manufacturing,name,domains:domains.length>=2?domains:['materials','organization'],impact:{knowledge:6+Math.floor(rng()*8),energy:Math.floor(rng()*10),health:Math.floor(rng()*6)}},concepts.length,genome,rng));
  }
  return seal({format:SOCIETY_FORMATS.conceptSpace,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,genome_root:genome.genome_root,generator:{kind:'deterministic-combinatorial-grammar',llm_calls:0,dimensions:Object.fromEntries(Object.entries(TECHNOLOGY_GRAMMAR).map(([k,v])=>[k,v.length]))},concepts,selection_policy:{score:'pressure-fit * feasibility * social-fit * prerequisite-readiness',novelty_is_not_proof:true},concept_space_root:''},'concept_space_root');
}

export function compilePlayerTechnologyProposal(proposal,{genome,conceptSpace=null}={}){
  if(!genome)throw new GenesisError('SOCIETY_GENOME_REQUIRED');
  const grammar={},keys={function:'functions',principle:'principles',substrate:'substrates',energy:'energy',control:'controls',manufacturing:'manufacturing'};
  for(const key of Object.keys(keys)){
    const value=proposal?.[key],list=TECHNOLOGY_GRAMMAR[keys[key]];
    if(!list?.includes(value))throw new GenesisError('PLAYER_TECH_COMPONENT_INVALID',`${key}:${value}`);
    grammar[key]=value;
  }
  const domains=[...new Set(proposal.domains??['materials','mechanics','organization'])].filter(d=>genome.domains[d]!==undefined);
  const archetype={...grammar,name:String(proposal.name??`${grammar.substrate} ${grammar.function}`),domains:domains.length?domains:['materials','organization'],impact:clone(proposal.projected_impact??{knowledge:8,legitimacy:2})};
  const rng=seededRandom(`${genome.simulation.seed}:player:${rootHash(proposal)}`),concept=createConcept(archetype,conceptSpace?.concepts?.length??0,genome,rng,{playerProposal:true});
  return seal({...concept,proposal_owner:proposal.player_id??'player:anonymous',proposal_reason:proposal.reason??null,concept_root:''},'concept_root');
}

function initialState(genome,ecology,conceptSpace){
  return{year:0,population:genome.population.initial,resources:{food:genome.population.initial*1.45,water:genome.population.initial*1.8,timber:420,ore:220,energy:180,knowledge:110,health:7200,legitimacy:6500},knowledge:clone(genome.domains),policies:{knowledge_openness:genome.norms.knowledge_openness,research_share:0.12,rationing:false,prototype_subsidy:0},institutions:Object.fromEntries(ecology.institutions.map(i=>[i.institution_id,{capacity:i.capacity,legitimacy:i.legitimacy}])),concepts:Object.fromEntries(conceptSpace.concepts.map(c=>[c.concept_id,{progress:0,status:'latent',milestones:[]}])) ,adopted:[],failed:[]};
}

function applyIntervention(state,event,events){
  if(event.type==='allocate-research'){state.policies.research_share=clamp01(event.value??.2);events.push({type:'player-policy',code:'RESEARCH_REALLOCATED',detail:{value:state.policies.research_share}});}
  else if(event.type==='open-knowledge-commons'){state.policies.knowledge_openness=clamp(state.policies.knowledge_openness+(event.value??900));events.push({type:'player-policy',code:'KNOWLEDGE_OPENED',detail:{value:state.policies.knowledge_openness}});}
  else if(event.type==='resource-rationing'){state.policies.rationing=Boolean(event.enabled??true);events.push({type:'player-policy',code:'RATIONING_CHANGED',detail:{enabled:state.policies.rationing}});}
  else if(event.type==='sponsor-prototype'){state.policies.prototype_subsidy=Math.max(state.policies.prototype_subsidy,event.value??.18);if(event.concept_id&&state.concepts[event.concept_id])state.concepts[event.concept_id].progress=Math.max(state.concepts[event.concept_id].progress,.42);events.push({type:'player-project',code:'PROTOTYPE_SPONSORED',detail:{concept_id:event.concept_id??null}});}
  else if(event.type==='found-institution'){const id=`institution:player:${event.kind??'lab'}`;state.institutions[id]={capacity:event.capacity??30,legitimacy:5200};events.push({type:'player-institution',code:'INSTITUTION_FOUNDED',detail:{institution_id:id}});}
}

function pressureVector(state){
  const perCapFood=state.resources.food/Math.max(1,state.population),perCapWater=state.resources.water/Math.max(1,state.population);
  return{food:clamp((1.2-perCapFood)*7000),water:clamp((1.5-perCapWater)*6500),energy:clamp((260-state.resources.energy)*18),health:clamp(7000-state.resources.health),legitimacy:clamp(6200-state.resources.legitimacy),knowledge:clamp(2500-state.resources.knowledge*5)};
}

function conceptPressureFit(concept,pressure){
  const f=concept.grammar.function;
  if(f==='purify-water')return pressure.water;
  if(f==='preserve-food'||f==='heal-ecosystem')return pressure.food;
  if(f==='store-energy'||f==='stabilize-climate')return pressure.energy;
  if(f==='transmit-information'||f==='compute-rules'||f==='coordinate-production')return Math.max(pressure.knowledge,pressure.legitimacy);
  if(f==='augment-labor'||f==='move-loads')return Math.max(pressure.food,pressure.energy);
  if(f==='repair-structure')return Math.max(pressure.energy,pressure.legitimacy);
  return 4200;
}

function prereqReadiness(concept,state){
  const ratios=concept.prerequisites.map(p=>(state.knowledge[p.domain]??0)/Math.max(1,p.minimum));return Math.min(1,Math.min(...ratios));
}

function applyImpact(state,impact){for(const [key,value] of Object.entries(impact??{}))if(state.resources[key]!==undefined)state.resources[key]=Math.max(0,state.resources[key]+value);}

export function simulateSocietyHistory({genome,ecology,conceptSpace,years=genome?.simulation?.years??60,interventions=[]}={}){
  if(!genome||!ecology||!conceptSpace)throw new GenesisError('SOCIETY_SIMULATION_INPUT_REQUIRED');
  const rng=seededRandom(`${genome.simulation.seed}:history:${rootHash(interventions)}`),state=initialState(genome,ecology,conceptSpace),ledger=[];
  const byYear=new Map();for(const item of interventions){const year=Math.max(1,Math.round(item.year??1));if(!byYear.has(year))byYear.set(year,[]);byYear.get(year).push(item);}
  for(let year=1;year<=years;year++){
    state.year=year;const events=[];
    for(const event of byYear.get(year)??[])applyIntervention(state,event,events);
    const techBoost=1+state.adopted.length*.035,workers=state.population*.58;
    const foodProduction=workers*(1.22+genome.environment.fertility/10000)*techBoost*(.92+rng()*.16);
    const waterProduction=workers*(1.55+genome.environment.water_abundance/10000)*techBoost;
    const energyProduction=workers*(.58+state.adopted.filter(id=>conceptSpace.concepts.find(c=>c.concept_id===id)?.grammar.function==='store-energy').length*.08);
    state.resources.food+=foodProduction-state.population*(state.policies.rationing?.88:1.02);
    state.resources.water+=waterProduction-state.population*1.12;
    state.resources.timber+=workers*.06*(.8+rng()*.35);state.resources.ore+=workers*.035*(.75+rng()*.4);state.resources.energy+=energyProduction-state.population*.19;
    const shortages=Math.max(0,-state.resources.food)+Math.max(0,-state.resources.water)+Math.max(0,-state.resources.energy);
    state.resources.food=Math.max(0,state.resources.food);state.resources.water=Math.max(0,state.resources.water);state.resources.energy=Math.max(0,state.resources.energy);
    state.resources.health=clamp(state.resources.health+(shortages?-(70+shortages*.3):35+rng()*28));
    state.resources.legitimacy=clamp(state.resources.legitimacy+(shortages?-(55+shortages*.2):18)+(state.policies.knowledge_openness-5000)/800);
    const growth=(state.resources.health-5000)/800000+(state.resources.food>state.population*.7?.006:-.012);state.population=Math.max(18,Math.round(state.population*(1+growth)));
    const research=state.population*state.policies.research_share*(.7+state.policies.knowledge_openness/12000)*(1+Object.keys(state.institutions).length*.015);
    state.resources.knowledge+=research*.08;
    const focusDomains=Object.keys(state.knowledge).sort((a,b)=>state.knowledge[a]-state.knowledge[b]);
    for(let i=0;i<focusDomains.length;i++)state.knowledge[focusDomains[i]]=Math.round(state.knowledge[focusDomains[i]]+research*(i<3?.12:.045)*(0.8+rng()*.4));
    const pressure=pressureVector(state),ranked=conceptSpace.concepts.map(c=>({c,score:conceptPressureFit(c,pressure)*.42+c.feasibility_score*.28+c.social_fit_score*.18+c.novelty_score*.12})).sort((a,b)=>b.score-a.score);
    for(const {c} of ranked.slice(0,Math.max(2,Math.ceil(research/18)))){
      const cs=state.concepts[c.concept_id];if(!cs||['adopted','failed'].includes(cs.status))continue;
      const readiness=prereqReadiness(c,state);if(readiness<.42)continue;
      const gain=(research/650)*(c.feasibility_score/10000)*(.55+readiness*.65)*(1+state.policies.prototype_subsidy)*(0.82+rng()*.36);
      const before=cs.progress;cs.progress=Math.min(1,cs.progress+gain);cs.status=cs.progress>=.75?'prototype':cs.progress>=.25?'emerging':'latent';
      const milestones=[[.25,'CONCEPT_FORMED'],[.5,'PRINCIPLE_DEMONSTRATED'],[.75,'PROTOTYPE_READY'],[1,'TECHNOLOGY_ADOPTED']];
      for(const [threshold,code] of milestones)if(before<threshold&&cs.progress>=threshold&&!cs.milestones.includes(code)){cs.milestones.push(code);events.push({type:'technology',code,concept_id:c.concept_id,name:c.name,progress:round(cs.progress)});}
      if(cs.progress>=1){const socialOk=state.resources.legitimacy>=c.adoption_conditions.minimum_legitimacy&&state.policies.knowledge_openness>=c.adoption_conditions.minimum_knowledge_openness;if(socialOk){cs.status='adopted';state.adopted.push(c.concept_id);applyImpact(state,c.projected_impact);}else{cs.progress=.86;cs.status='prototype';events.push({type:'technology',code:'ADOPTION_BLOCKED',concept_id:c.concept_id,name:c.name});}}
      else if(cs.progress>.55&&rng()>(c.feasibility_score/10000+.12)){cs.progress=Math.max(.22,cs.progress-.18);events.push({type:'technology',code:'EXPERIMENT_FAILED',concept_id:c.concept_id,name:c.name});}
    }
    state.policies.prototype_subsidy=Math.max(0,state.policies.prototype_subsidy-.02);
    if(shortages>0)events.push({type:'society',code:'RESOURCE_SHORTAGE',detail:{severity:round(shortages),pressure}});
    if(year%10===0)events.push({type:'history',code:'DECADE_RECORDED',detail:{population:state.population,adopted:state.adopted.length}});
    ledger.push(seal({year,state:{population:state.population,resources:Object.fromEntries(Object.entries(state.resources).map(([k,v])=>[k,round(v,2)])),knowledge:clone(state.knowledge),policies:clone(state.policies),adopted:[...state.adopted]},events,event_root:''},'event_root'));
  }
  return seal({format:SOCIETY_FORMATS.history,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,genome_root:genome.genome_root,ecology_root:ecology.ecology_root,concept_space_root:conceptSpace.concept_space_root,simulation:{engine:'deterministic-rule-system',llm_calls:0,seed:genome.simulation.seed,years},interventions:clone(interventions),ledger,final_state:state,summary:{years,population_start:genome.population.initial,population_end:state.population,technologies_adopted:state.adopted.length,technology_ids:[...state.adopted],event_count:ledger.reduce((n,y)=>n+y.events.length,0)},history_root:''},'history_root');
}

export function createPlayerParticipationContract(genome,conceptSpace){
  const componentOptions={function:clone(TECHNOLOGY_GRAMMAR.functions),principle:clone(TECHNOLOGY_GRAMMAR.principles),substrate:clone(TECHNOLOGY_GRAMMAR.substrates),energy:clone(TECHNOLOGY_GRAMMAR.energy),control:clone(TECHNOLOGY_GRAMMAR.controls),manufacturing:clone(TECHNOLOGY_GRAMMAR.manufacturing)};
  return seal({format:SOCIETY_FORMATS.participation,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,roles:genome.player.roles,actions:[
    {action_id:'allocate-research',inputs:{year:'integer',value:'0..1'},effects:['research-share'],authority:'player-policy'},
    {action_id:'open-knowledge-commons',inputs:{year:'integer',value:'0..2000'},effects:['knowledge-openness','diffusion'],authority:'player-policy'},
    {action_id:'resource-rationing',inputs:{year:'integer',enabled:'boolean'},effects:['consumption','legitimacy'],authority:'player-policy'},
    {action_id:'sponsor-prototype',inputs:{year:'integer',concept_id:'technology-concept-id'},effects:['concept-progress','resource-use'],authority:'player-investment'},
    {action_id:'found-institution',inputs:{year:'integer',kind:'lab|guild|cooperative|school',capacity:'integer'},effects:['research-capacity','social-network'],authority:'player-organization'},
    {action_id:'propose-technology',inputs:{name:'string',...Object.fromEntries(Object.keys(componentOptions).map(k=>[k,`enum:${k}`]))},effects:['new-technology-concept','engineering-path'],authority:'player-invention',llm_required:false}
  ],technology_proposal_grammar:componentOptions,branching:{baseline_history_root:null,player_branches:true,merge_policy:'explicit-authority'},concept_count:conceptSpace.concepts.length,participation_root:''},'participation_root');
}

export function createProjection25d(genome,ecology,history){
  const latest=history.ledger.at(-1);
  return seal({format:SOCIETY_FORMATS.projection,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,projection:'2.5d-isometric',camera:{mode:'isometric',yaw:45,pitch:35.264,zoom:[.5,2.4]},map:{width:ecology.map.width,height:ecology.map.height,tile_size:64,height_scale:18,layers:['ground','resource','building','agent','effect','ui']},entities:{agents:ecology.agents.map(a=>({entity_id:a.agent_id,sprite_family:`occupation:${a.occupation}`,home_tile_id:a.home_tile_id,institution_id:a.institution_id})),institutions:ecology.institutions.map(i=>({entity_id:i.institution_id,prefab:`institution:${i.kind}`,tile_id:i.tile_id}))},history_projection:{year:latest.year,event_markers:latest.events.map(e=>({kind:e.type,code:e.code,concept_id:e.concept_id??null}))},interaction:{select_agents:true,select_institutions:true,technology_tree:true,history_scrubber:true,player_action_panel:true},projection_root:''},'projection_root');
}

export function createSocietyRuntimeContract(genome,ecology,conceptSpace,participation){
  return seal({format:SOCIETY_FORMATS.runtime,version:SOCIETY_GENESIS_VERSION,world_id:genome.identity.world_id,runtimes:{behavior:{required:true,systems:['agent-state-machines','institution-rules','player-actions']},rsr:{required:true,systems:['resource-flows','time','causality','deterministic-replay']},vsr:{required:true,systems:['2.5d-isometric-projection','history-overlay','technology-graph']},network:{required:false,systems:['player-session','authority-sync']}},tick:{unit:'year',subticks:['production','consumption','social-decision','research','technology','history-commit']},authority:{world_state:'server-or-local-authoritative',player_actions:'bounded-and-audited'},contracts:{ecology_root:ecology.ecology_root,concept_space_root:conceptSpace.concept_space_root,participation_root:participation.participation_root},runtime_root:''},'runtime_root');
}

function buildPreview({genome,ecology,conceptSpace,history,participation}){
  const payload=JSON.stringify({genome,ecology,concepts:conceptSpace.concepts,history:history.ledger,participation}).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${genome.identity.name}｜AI社会生态原型</title><style>body{margin:0;background:#07111f;color:#eaf4ff;font:14px system-ui}header{padding:16px 20px;background:#0d1d31;position:sticky;top:0;z-index:2}main{display:grid;grid-template-columns:minmax(360px,1.3fr) minmax(300px,.7fr);gap:14px;padding:14px}section{background:#10243d;border:1px solid #284f73;border-radius:14px;padding:12px}canvas{width:100%;height:auto;background:#07111f;border-radius:10px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.stat{background:#0b192b;padding:8px;border-radius:8px}button{background:#1d78b5;color:white;border:0;border-radius:8px;padding:9px 11px;margin:3px;cursor:pointer}.tech{border-left:4px solid #5bc0eb;padding:7px;margin:7px 0;background:#0b192b}.event{padding:5px;border-bottom:1px solid #24445f}.muted{color:#9fb7cc}code{color:#90e0ef}@media(max-width:850px){main{grid-template-columns:1fr}}</style><header><b>${genome.identity.name}</b>｜RAGF v0.5 无LLM社会生态与技术创生原型 <span class="muted">LLM调用：0</span></header><main><div><section><canvas id="world" width="900" height="560"></canvas></section><section><h3>玩家介入</h3><button onclick="act('research')">提高研究投入</button><button onclick="act('open')">开放知识公地</button><button onclick="act('prototype')">资助最高潜力原型</button><button onclick="step()">推进一年</button><button onclick="resetWorld()">回到基线</button><p class="muted">玩家可以改变技术出现路径，但不能直接命令世界“凭空成功”。</p></section><section><h3>历史</h3><div id="events"></div></section></div><div><section><h3>当前社会</h3><div id="stats" class="grid"></div></section><section><h3>技术概念与工程路径</h3><div id="techs"></div></section></div></main><script>const DATA=${payload};let year=DATA.history.length,openness=DATA.genome.norms.knowledge_openness,research=.12,boost=0;const cv=document.getElementById('world'),ctx=cv.getContext('2d');function iso(x,y,h=0){return[450+(x-y)*32,80+(x+y)*17-h*10]}function draw(){ctx.clearRect(0,0,cv.width,cv.height);for(const t of DATA.ecology.map.tiles){const [x,y]=iso(t.x,t.y,t.height),c=t.biome==='water'?'#184e77':t.biome==='forest'?'#2d6a4f':t.biome==='plain'?'#6a994e':t.biome==='hill'?'#8d6e63':'#6c757d';ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+32,y+17);ctx.lineTo(x,y+34);ctx.lineTo(x-32,y+17);ctx.closePath();ctx.fill()}for(const i of DATA.ecology.institutions){const t=DATA.ecology.map.tiles.find(t=>t.tile_id===i.tile_id);if(!t)continue;const[x,y]=iso(t.x,t.y,t.height+1);ctx.fillStyle='#ffd166';ctx.fillRect(x-8,y-22,16,22);ctx.fillStyle='#fff';ctx.fillText(i.name,x-22,y-28)}for(let k=0;k<DATA.ecology.agents.length;k++){const a=DATA.ecology.agents[k],t=DATA.ecology.map.tiles.find(t=>t.tile_id===a.home_tile_id);if(!t)continue;const[x,y]=iso(t.x,t.y,t.height);ctx.fillStyle=k%3?'#7bdff2':'#f7a072';ctx.beginPath();ctx.arc(x+(k%5)*4-8,y+8,3,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#fff';ctx.fillText('年份 '+year,18,24)}function current(){return DATA.history[Math.max(0,Math.min(DATA.history.length-1,year-1))]??DATA.history.at(-1)}function render(){draw();const s=current()?.state??{};document.getElementById('stats').innerHTML=[['年份',year],['人口',s.population??DATA.genome.population.initial],['技术采用',s.adopted?.length??0],['知识开放',openness],['研究份额',Math.round(research*100)+'%'],['模拟引擎','确定性规则']].map(x=>'<div class=stat><b>'+x[0]+'</b><br>'+x[1]+'</div>').join('');const adopted=new Set(s.adopted??[]);document.getElementById('techs').innerHTML=DATA.concepts.slice(0,8).map((c,i)=>'<div class=tech><b>'+c.name+(adopted.has(c.concept_id)?' ✓':'')+'</b><br><span class=muted>'+c.grammar.function+' × '+c.grammar.principle+'</span><br>可行性 '+c.feasibility_score+'｜新颖度 '+c.novelty_score+'<details><summary>工程路径</summary>'+c.engineering_path.map(p=>p.phase+'. '+p.label).join('<br>')+'</details></div>').join('');const events=DATA.history.slice(Math.max(0,year-8),year).flatMap(y=>y.events.map(e=>'第'+y.year+'年｜'+e.code+(e.name?'｜'+e.name:'')));document.getElementById('events').innerHTML=events.slice(-18).reverse().map(e=>'<div class=event>'+e+'</div>').join('')||'<div class=muted>暂无重大事件</div>'}function act(x){if(x==='research')research=Math.min(.45,research+.04);if(x==='open')openness=Math.min(10000,openness+600);if(x==='prototype')boost+=.18;step()}function step(){year++;if(year>DATA.history.length)year=1;render()}function resetWorld(){year=DATA.history.length;openness=DATA.genome.norms.knowledge_openness;research=.12;boost=0;render()}render();</script></html>`;
}


export class SocietySandboxSession{
  constructor(input){
    this.intent=normalizeSocietyIntent(input);this.genome=compileSocietyGenome(this.intent);this.social_ecology=createSocialEcology(this.genome);this.technology_concept_space=generateTechnologyConceptSpace(this.genome,{maxConcepts:this.intent.constraints.max_concepts});
    this.interventions=[];this.year=0;this.history=null;this.proposals=[];
  }
  dispatch(action){
    const allowed=new Set(['allocate-research','open-knowledge-commons','resource-rationing','sponsor-prototype','found-institution']);
    if(!allowed.has(action?.type))throw new GenesisError('PLAYER_ACTION_INVALID',action?.type??'missing');
    const normalized={...clone(action),year:Math.max(1,Math.round(action.year??this.year+1))};this.interventions.push(normalized);return normalized;
  }
  proposeTechnology(proposal){
    const concept=compilePlayerTechnologyProposal(proposal,{genome:this.genome,conceptSpace:this.technology_concept_space});
    const concepts=[...this.technology_concept_space.concepts,concept];
    this.technology_concept_space=seal({...this.technology_concept_space,concepts,concept_space_root:''},'concept_space_root');this.proposals.push(concept.concept_id);return concept;
  }
  step(count=1){
    this.year=Math.max(1,this.year+Math.max(1,Math.round(count)));this.history=simulateSocietyHistory({genome:this.genome,ecology:this.social_ecology,conceptSpace:this.technology_concept_space,years:this.year,interventions:this.interventions.filter(i=>i.year<=this.year)});return this.snapshot();
  }
  replayTo(year){this.year=Math.max(1,Math.round(year));this.history=simulateSocietyHistory({genome:this.genome,ecology:this.social_ecology,conceptSpace:this.technology_concept_space,years:this.year,interventions:this.interventions.filter(i=>i.year<=this.year)});return this.snapshot();}
  snapshot(){
    return seal({format:'ragf.society-live-snapshot.v0.5',version:SOCIETY_GENESIS_VERSION,world_id:this.genome.identity.world_id,year:this.year,genome_root:this.genome.genome_root,ecology_root:this.social_ecology.ecology_root,concept_space_root:this.technology_concept_space.concept_space_root,history_root:this.history?.history_root??null,interventions:clone(this.interventions),player_proposals:[...this.proposals],state:this.history?.final_state??null,snapshot_root:''},'snapshot_root');
  }
}

export function generateSocietyGenesisWorkspace(input,{outDir,interventions=[]}={}){
  if(!outDir)throw new GenesisError('OUT_DIR_REQUIRED');mkdir(outDir);
  const intent=normalizeSocietyIntent(input),genome=compileSocietyGenome(intent),ecology=createSocialEcology(genome),conceptSpace=generateTechnologyConceptSpace(genome,{maxConcepts:intent.constraints.max_concepts}),history=simulateSocietyHistory({genome,ecology,conceptSpace,years:intent.years,interventions}),participation=createPlayerParticipationContract(genome,conceptSpace),projection=createProjection25d(genome,ecology,history),runtimeContract=createSocietyRuntimeContract(genome,ecology,conceptSpace,participation);
  const artifacts={
    'intent.json':intent,'society-genome.json':genome,'social-ecology.json':ecology,'technology-concept-space.json':conceptSpace,'history-ledger.json':history,'player-participation.json':participation,'projection-2.5d.json':projection,'runtime-contract.json':runtimeContract
  };
  const preview=buildPreview({genome,ecology,conceptSpace,history,participation});
  const files=[];for(const [name,value] of Object.entries(artifacts)){const body=Buffer.from(JSON.stringify(value,null,2)+'\n');files.push({path:name,role:name.replace('.json',''),mime:'application/json',sha256:sha(body),size:body.length});}
  const previewBody=Buffer.from(preview);files.push({path:'preview.html',role:'interactive-2.5d-preview',mime:'text/html',sha256:sha(previewBody),size:previewBody.length});
  const workspace=seal({format:SOCIETY_FORMATS.workspace,version:SOCIETY_GENESIS_VERSION,workspace_id:stableId('society-genesis-workspace',{intent:intent.intent_root,genome:genome.genome_root,ecology:ecology.ecology_root,concepts:conceptSpace.concept_space_root,history:history.history_root}),intent,genome,social_ecology:ecology,technology_concept_space:conceptSpace,history,player_participation:participation,projection_2_5d:projection,runtime_contract:runtimeContract,files,quality_gates:{llm_calls_zero:true,deterministic:true,historical_continuity:true,technology_engineering_paths:conceptSpace.concepts.every(c=>c.engineering_path.length>=6),human_participation:true,epistemic_boundary:true},workspace_root:''},'workspace_root');
  for(const [name,value] of Object.entries(artifacts))writeJson(path.join(outDir,name),value);fs.writeFileSync(path.join(outDir,'preview.html'),preview);writeJson(path.join(outDir,'workspace.json'),workspace);
  return workspace;
}

export function verifySocietyGenesisWorkspace(workspace,{baseDir=null,verifyFiles=false}={}){
  const errors=[];
  if(workspace?.format!==SOCIETY_FORMATS.workspace)errors.push('FORMAT_INVALID');
  if(!verifyRoot(workspace,'workspace_root'))errors.push('WORKSPACE_ROOT_MISMATCH');
  for(const [key,field,format] of [['intent','intent_root',SOCIETY_FORMATS.intent],['genome','genome_root',SOCIETY_FORMATS.genome],['social_ecology','ecology_root',SOCIETY_FORMATS.ecology],['technology_concept_space','concept_space_root',SOCIETY_FORMATS.conceptSpace],['history','history_root',SOCIETY_FORMATS.history],['player_participation','participation_root',SOCIETY_FORMATS.participation],['projection_2_5d','projection_root',SOCIETY_FORMATS.projection],['runtime_contract','runtime_root',SOCIETY_FORMATS.runtime]]){
    const value=workspace?.[key];if(value?.format!==format)errors.push(`${key.toUpperCase()}_FORMAT_INVALID`);if(!verifyRoot(value,field))errors.push(`${key.toUpperCase()}_ROOT_MISMATCH`);
  }
  if(workspace?.genome?.simulation?.llm_calls!==0)errors.push('LLM_CALLS_NONZERO');
  if(workspace?.intent?.design?.llm_usage!=='forbidden')errors.push('LLM_USAGE_NOT_FORBIDDEN');
  if(!workspace?.technology_concept_space?.concepts?.every(c=>verifyRoot(c,'concept_root')))errors.push('CONCEPT_ROOT_INVALID');
  if(!workspace?.technology_concept_space?.concepts?.every(c=>c.engineering_path?.length>=6))errors.push('ENGINEERING_PATH_INCOMPLETE');
  if(!workspace?.history?.ledger?.every(e=>verifyRoot(e,'event_root')))errors.push('HISTORY_EVENT_ROOT_INVALID');
  let checked=0;if(verifyFiles&&baseDir)for(const file of workspace?.files??[]){const p=path.join(baseDir,file.path);if(!fs.existsSync(p)){errors.push(`FILE_MISSING:${file.path}`);continue;}checked++;const body=fs.readFileSync(p);if(sha(body)!==file.sha256)errors.push(`FILE_HASH_MISMATCH:${file.path}`);}
  return{valid:errors.length===0,errors,workspace_root:workspace?.workspace_root,world_id:workspace?.genome?.identity?.world_id,concept_count:workspace?.technology_concept_space?.concepts?.length??0,history_years:workspace?.history?.summary?.years??0,adopted_technologies:workspace?.history?.summary?.technologies_adopted??0,file_integrity_checked:checked};
}

export function inspectSocietyGenesisWorkspace(workspace){
  return{format:workspace.format,version:workspace.version,world_id:workspace.genome.identity.world_id,name:workspace.genome.identity.name,engine:workspace.genome.simulation.engine,llm_calls:workspace.genome.simulation.llm_calls,population:{initial:workspace.genome.population.initial,final:workspace.history.summary.population_end,representative_agents:workspace.social_ecology.agents.length},social:{households:workspace.social_ecology.households.length,institutions:workspace.social_ecology.institutions.length,factions:workspace.social_ecology.factions.length,links:workspace.social_ecology.links.length},technology:{concepts:workspace.technology_concept_space.concepts.length,adopted:workspace.history.summary.technologies_adopted,engineering_phases:workspace.technology_concept_space.concepts[0]?.engineering_path?.length??0},history:{years:workspace.history.summary.years,events:workspace.history.summary.event_count,root:workspace.history.history_root},player_actions:workspace.player_participation.actions.map(a=>a.action_id),workspace_root:workspace.workspace_root};
}
