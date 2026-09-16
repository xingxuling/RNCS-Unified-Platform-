import {createHash} from 'node:crypto';

export const GMF_VERSION = '0.1.0-alpha.1';
export const GMF_GRAPH_FORMAT = 'rncs.generative-morphogenesis.semantic-graph.v0.1';
export const GMF_5D_FORMAT = 'rncs.generative-morphogenesis.five-dimensional-attribute-model.v0.1';
export const GMF_COMPLEXITY_FORMAT = 'rncs.generative-morphogenesis.complexity-state-machine.v0.1';
export const GMF_DIFFUSION_FORMAT = 'rncs.generative-morphogenesis.distributed-diffusion-plan.v0.1';
export const GMF_CANDIDATE_FORMAT = 'rncs.generative-morphogenesis.candidate.v0.1';
export const GMF_BRIDGE_FORMAT = 'rncs.generative-morphogenesis.downstream-projection-plan.v0.1';

const clone = value => structuredClone(value);
const rec = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];
const uniq = values => [...new Set(values.map(String).filter(Boolean))];
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const canonical = value => JSON.stringify(sortDeep(value));
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortDeep(value[key])]));
}

function authorityEnvelope(extra = {}) {
  return {candidate_only:true, authoritative:false, canonical_state_mutated:false, rncs_authority_required_for_commit:true, ...clone(extra)};
}

function normalizeId(value, fallback) {
  const id = String(value ?? fallback ?? '').trim();
  fail(id.length > 0, 'GMF_ID_REQUIRED');
  fail(/^[A-Za-z0-9_.:-]+$/.test(id), 'GMF_ID_INVALID');
  return id;
}

function slug(text) {
  const ascii = String(text).normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return ascii || `u-${digest(String(text)).slice(0, 12)}`;
}

function normalizeEntity(value, index) {
  const item = typeof value === 'string' ? {label:value} : rec(value);
  const label = String(item.label ?? item.name ?? item.id ?? '').trim();
  fail(label, 'GMF_ENTITY_LABEL_REQUIRED');
  return {node_id:normalizeId(item.node_id ?? item.id, `node.${index}.${slug(label)}`), label, type:String(item.type ?? item.kind ?? 'entity'), attributes:clone(rec(item.attributes)), provenance:clone(rec(item.provenance))};
}

const RELATION_PATTERNS = [
  {relation:'contains', patterns:[/([^，。；;]+?)包含(?:了|着)?([^，。；;]+)/g,/([^.;]+?)\s+contains\s+([^.;]+)/gi]},
  {relation:'surrounds', patterns:[/([^，。；;]+?)围绕(?:着)?([^，。；;]+)/g,/([^，。；;]+?)环绕(?:着)?([^，。；;]+)/g,/([^.;]+?)\s+surrounds\s+([^.;]+)/gi]},
  {relation:'above', patterns:[/([^，。；;]+?)悬浮在([^，。；;]+?)上(?:方)?/g,/([^.;]+?)\s+(?:is\s+)?above\s+([^.;]+)/gi]},
  {relation:'supports', patterns:[/([^，。；;]+?)顶端(?:长着|有)([^，。；;]+)/g,/([^.;]+?)\s+supports\s+([^.;]+)/gi]},
  {relation:'gaze_target', patterns:[/([^，。；;]+?)仰望(?:着)?([^，。；;]+)/g,/([^，。；;]+?)看向([^，。；;]+)/g,/([^.;]+?)\s+looks?\s+(?:at|toward)\s+([^.;]+)/gi]},
  {relation:'emits', patterns:[/([^，。；;]+?)(?:散发|发出)([^，。；;]+)/g,/([^.;]+?)\s+emits\s+([^.;]+)/gi]}
];

function cleanFragment(value) {
  return String(value).replace(/^(一座|一个|一名|一位|一条|巨大的|巨大|未来的|未来|中央的|中央|发光的|发光|的)+/g,'').replace(/(上方|上|中央|前景|左前景|顶端)$/g,'').trim();
}

function ensureNode(nodes, label, type='entity') {
  const cleaned = cleanFragment(label); if (!cleaned) return null;
  let found = nodes.find(node => node.label === cleaned);
  if (!found) { found = normalizeEntity({label:cleaned,type}, nodes.length); nodes.push(found); }
  return found;
}

function finite01(value) { const n=Number(value); fail(Number.isFinite(n),'GMF_NUMBER_REQUIRED'); return Math.max(0,Math.min(1,n)); }

export function compileTextGraphIntent(input={}) {
  const value = typeof input === 'string' ? {text:input} : rec(input);
  const text = String(value.text ?? value.intent ?? '').trim(); fail(text,'GMF_TEXT_REQUIRED');
  const graphId = normalizeId(value.graph_id ?? value.id, `graph.${digest(text).slice(0,12)}`);
  const nodes = arr(value.entities).map(normalizeEntity); const edges=[];
  for (const hint of arr(value.relations)) {
    const h=rec(hint); const source=ensureNode(nodes,h.source ?? h.from,h.source_type); const target=ensureNode(nodes,h.target ?? h.to,h.target_type); if(!source||!target) continue;
    edges.push({edge_id:normalizeId(h.edge_id,`edge.${edges.length}.${slug(h.relation ?? h.type ?? 'related')}`),source:source.node_id,target:target.node_id,relation:String(h.relation ?? h.type ?? 'related_to'),weight:finite01(h.weight ?? 1),provenance:{source:'explicit-relation',...clone(rec(h.provenance))}});
  }
  for (const entry of RELATION_PATTERNS) for (const pattern of entry.patterns) {
    pattern.lastIndex=0; let match;
    while ((match=pattern.exec(text))) {
      const source=ensureNode(nodes,match[1]); const target=ensureNode(nodes,match[2]);
      if(!source||!target||source.node_id===target.node_id) continue;
      if(!edges.some(edge=>edge.source===source.node_id&&edge.target===target.node_id&&edge.relation===entry.relation)) edges.push({edge_id:`edge.${edges.length}.${entry.relation}`,source:source.node_id,target:target.node_id,relation:entry.relation,weight:1,provenance:{source:'deterministic-text-pattern',matched_text:match[0]}});
    }
  }
  for (const term of arr(value.key_entities)) ensureNode(nodes,term); fail(nodes.length>0,'GMF_GRAPH_NO_ENTITIES');
  const constraints=arr(value.constraints).map((constraint,index)=>{const c=typeof constraint==='string'?{expression:constraint}:rec(constraint); return {constraint_id:normalizeId(c.constraint_id ?? c.id,`constraint.${index}`),expression:String(c.expression ?? c.rule ?? '').trim(),strength:finite01(c.strength ?? 1),kind:String(c.kind ?? 'semantic'),provenance:clone(rec(c.provenance))};}).filter(item=>item.expression);
  const graph={format:GMF_GRAPH_FORMAT,version:GMF_VERSION,graph_id:graphId,source_text:text,nodes,edges,constraints,authority:authorityEnvelope()};
  return {...graph,graph_root:digest(graph)};
}

function normalizeQuantity(value,index){const q=rec(value);const numeric=Number(q.value ?? value);fail(Number.isFinite(numeric),'GMF_QUANTITY_VALUE_REQUIRED');const min=q.min===undefined||q.min===null?null:Number(q.min);const max=q.max===undefined||q.max===null?null:Number(q.max);if(min!==null)fail(Number.isFinite(min),'GMF_QUANTITY_MIN_INVALID');if(max!==null)fail(Number.isFinite(max),'GMF_QUANTITY_MAX_INVALID');if(min!==null&&max!==null)fail(min<=numeric&&numeric<=max,'GMF_QUANTITY_OUTSIDE_RANGE');return {quantity_id:normalizeId(q.quantity_id ?? q.id,`q.${index}`),value:numeric,unit:String(q.unit ?? 'normalized'),weight:finite01(q.weight ?? 1),min,max,provenance:clone(rec(q.provenance))};}
function normalizeDimension(value,index){const d=rec(value);const quantities=arr(d.quantities).map(normalizeQuantity);fail(quantities.length>0,'GMF_DIMENSION_QUANTITIES_REQUIRED');const weighted=quantities.reduce((s,q)=>s+q.value*q.weight,0);const weightTotal=quantities.reduce((s,q)=>s+q.weight,0)||1;return {dimension_id:normalizeId(d.dimension_id ?? d.id,`dimension.${index}`),label:String(d.label ?? d.name ?? `dimension-${index+1}`),role:String(d.role ?? 'domain-defined'),quantities,aggregate:weighted/weightTotal,metadata:clone(rec(d.metadata))};}

export function createFiveDimensionalAttributeModel(input={}) {
  const value=rec(input); const dimensions=arr(value.dimensions).map(normalizeDimension); fail(dimensions.length===5,'GMF_EXACTLY_FIVE_DIMENSIONS_REQUIRED'); fail(new Set(dimensions.map(d=>d.dimension_id)).size===5,'GMF_DIMENSION_ID_DUPLICATE');
  const model={format:GMF_5D_FORMAT,version:GMF_VERSION,model_id:normalizeId(value.model_id ?? value.id,`model.${digest(dimensions).slice(0,12)}`),object_id:normalizeId(value.object_id,'candidate-object'),domain:String(value.domain ?? 'generic'),dimensions,cross_dimension_constraints:clone(arr(value.cross_dimension_constraints)),authority:authorityEnvelope()};
  return {...model,model_root:digest(model)};
}

const DEFAULT_SIGNAL_WEIGHTS=Object.freeze({semantic_importance:0.24,screen_coverage:0.18,edit_focus:0.18,representation_error:0.18,motion_importance:0.08,proximity:0.08,visibility:0.06,compute_pressure:-0.16,occlusion:-0.08});
function normalizeComplexityState(value,index){const s=rec(value);return {state_id:normalizeId(s.state_id ?? s.id,`state.${index}`),rank:Number.isFinite(Number(s.rank))?Number(s.rank):index,complexity:Object.fromEntries(Object.entries(rec(s.complexity)).map(([key,n])=>{const amount=Number(n);fail(Number.isFinite(amount)&&amount>=0,'GMF_COMPLEXITY_VALUE_INVALID');return [key,amount];})),metadata:clone(rec(s.metadata))};}
export function createComplexityStateMachine(input={}) {const value=rec(input);const states=arr(value.states).map(normalizeComplexityState).sort((a,b)=>a.rank-b.rank);fail(states.length>=2,'GMF_COMPLEXITY_STATES_MIN_TWO');fail(new Set(states.map(s=>s.state_id)).size===states.length,'GMF_COMPLEXITY_STATE_DUPLICATE');const initial=String(value.initial_state ?? states[0].state_id);fail(states.some(s=>s.state_id===initial),'GMF_COMPLEXITY_INITIAL_STATE_UNKNOWN');const thresholds=arr(value.thresholds).length===states.length-1?arr(value.thresholds).map(Number):states.slice(0,-1).map((_,i)=>(i+1)/states.length);thresholds.forEach(t=>fail(Number.isFinite(t)&&t>=0&&t<=1,'GMF_COMPLEXITY_THRESHOLD_INVALID'));const weights={...DEFAULT_SIGNAL_WEIGHTS,...Object.fromEntries(Object.entries(rec(value.signal_weights)).map(([k,v])=>[k,Number(v)]))};const machine={format:GMF_COMPLEXITY_FORMAT,version:GMF_VERSION,machine_id:normalizeId(value.machine_id ?? value.id,`complexity.${digest(states).slice(0,12)}`),representation_kind:String(value.representation_kind ?? 'generic'),states,initial_state:initial,thresholds,hysteresis:Math.max(0,Math.min(0.25,Number(value.hysteresis ?? 0.04))),signal_weights:weights,authority:authorityEnvelope()};return {...machine,machine_root:digest(machine)};}
export function evaluateComplexityState(machine,signals={},currentStateId=null){const value=rec(machine);fail(value.format===GMF_COMPLEXITY_FORMAT,'GMF_COMPLEXITY_MACHINE_INVALID');const current=String(currentStateId ?? value.initial_state);const currentIndex=value.states.findIndex(s=>s.state_id===current);fail(currentIndex>=0,'GMF_COMPLEXITY_CURRENT_STATE_UNKNOWN');const normalizedSignals=Object.fromEntries(Object.entries(rec(signals)).map(([k,v])=>[k,finite01(v)]));let weighted=0,positiveCapacity=0;for(const [key,weight] of Object.entries(value.signal_weights)){const signal=normalizedSignals[key] ?? 0;weighted+=signal*weight;if(weight>0)positiveCapacity+=weight;}let demand=positiveCapacity>0?weighted/positiveCapacity:0;demand=Math.max(0,Math.min(1,demand));let targetIndex=0;for(let i=0;i<value.thresholds.length;i++)if(demand>=value.thresholds[i])targetIndex=i+1;if(targetIndex>currentIndex&&demand<(value.thresholds[currentIndex] ?? 1)+value.hysteresis)targetIndex=currentIndex;if(targetIndex<currentIndex&&currentIndex>0&&demand>value.thresholds[currentIndex-1]-value.hysteresis)targetIndex=currentIndex;const target=value.states[targetIndex];return {machine_id:value.machine_id,from_state:current,to_state:target.state_id,transition:targetIndex===currentIndex?'HOLD':targetIndex>currentIndex?'EXPAND':'CONTRACT',demand,signals:normalizedSignals,target_complexity:clone(target.complexity),authority:authorityEnvelope()};}

function normalizeChannel(value,index){const c=rec(value);return {channel_id:normalizeId(c.channel_id ?? c.id,`channel.${index}`),role:String(c.role ?? c.channel_id ?? c.id ?? `channel-${index}`),depends_on:uniq(arr(c.depends_on)),damping:finite01(c.damping ?? 0.5),worker_hint:String(c.worker_hint ?? `worker.${index%4}`),initial:clone(c.initial ?? 0),metadata:clone(rec(c.metadata))};}
function topologicalWaves(channels){const ids=new Set(channels.map(c=>c.channel_id));for(const c of channels)for(const dep of c.depends_on)fail(ids.has(dep),`GMF_DIFFUSION_DEPENDENCY_UNKNOWN:${dep}`);const pending=new Map(channels.map(c=>[c.channel_id,new Set(c.depends_on)]));const waves=[],resolved=new Set();while(pending.size){const wave=[...pending.entries()].filter(([,deps])=>[...deps].every(dep=>resolved.has(dep))).map(([id])=>id).sort();fail(wave.length>0,'GMF_DIFFUSION_GRAPH_CYCLE');waves.push(wave);for(const id of wave){pending.delete(id);resolved.add(id);}}return waves;}
export function createDistributedGenerativeDiffusionPlan(input={}){const value=rec(input);const channels=arr(value.channels).map(normalizeChannel);fail(channels.length>0,'GMF_DIFFUSION_CHANNEL_REQUIRED');const waves=topologicalWaves(channels);const plan={format:GMF_DIFFUSION_FORMAT,version:GMF_VERSION,plan_id:normalizeId(value.plan_id ?? value.id,`diffusion.${digest(channels).slice(0,12)}`),channels,execution_waves:waves,max_iterations:Math.max(1,Math.min(128,Number(value.max_iterations ?? 12))),convergence_epsilon:Math.max(0,Number(value.convergence_epsilon ?? 1e-4)),authority:authorityEnvelope()};return {...plan,plan_root:digest(plan)};}
function blend(previous,proposed,damping){if(typeof previous==='number'&&typeof proposed==='number')return previous+(proposed-previous)*damping;if(Array.isArray(previous)&&Array.isArray(proposed)&&previous.length===proposed.length&&previous.every(Number.isFinite)&&proposed.every(Number.isFinite))return previous.map((v,i)=>v+(proposed[i]-v)*damping);if(previous&&proposed&&typeof previous==='object'&&typeof proposed==='object'&&!Array.isArray(previous)&&!Array.isArray(proposed)){const out=clone(previous);for(const [key,p] of Object.entries(proposed))out[key]=key in out?blend(out[key],p,damping):clone(p);return out;}return clone(proposed);}
function numericDelta(a,b){if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b);if(Array.isArray(a)&&Array.isArray(b))return Math.max(0,...a.map((v,i)=>numericDelta(v,b[i])));if(a&&b&&typeof a==='object'&&typeof b==='object'){const keys=uniq([...Object.keys(a),...Object.keys(b)]);return Math.max(0,...keys.map(k=>numericDelta(a[k],b[k])));}return canonical(a)===canonical(b)?0:1;}
export function runDistributedGenerativeDiffusion(plan,generators={},context={}){fail(rec(plan).format===GMF_DIFFUSION_FORMAT,'GMF_DIFFUSION_PLAN_INVALID');const channels=new Map(plan.channels.map(c=>[c.channel_id,c]));let state=Object.fromEntries(plan.channels.map(c=>[c.channel_id,clone(c.initial)]));const receipts=[];let converged=false,finalDelta=Infinity,iterations=0;for(let iteration=0;iteration<plan.max_iterations;iteration++){const before=clone(state);for(const wave of plan.execution_waves){const proposals=[];for(const channelId of wave){const channel=channels.get(channelId);const generator=generators[channelId] ?? generators[channel.role];fail(typeof generator==='function',`GMF_DIFFUSION_GENERATOR_MISSING:${channelId}`);const dependencies=Object.fromEntries(channel.depends_on.map(dep=>[dep,clone(state[dep])]));const proposed=generator({channel:clone(channel),previous:clone(state[channelId]),dependencies,global_state:clone(state),context:clone(context),iteration});proposals.push([channelId,blend(state[channelId],proposed,channel.damping),channel.worker_hint]);}for(const [channelId,next,workerHint] of proposals){state[channelId]=next;receipts.push({iteration,channel_id:channelId,worker_hint:workerHint,state_root:digest(next)});}}iterations=iteration+1;finalDelta=numericDelta(before,state);if(finalDelta<=plan.convergence_epsilon){converged=true;break;}}const result={plan_id:plan.plan_id,status:converged?'CONVERGED':'BOUNDED_STOP',iterations,final_delta:finalDelta,state,worker_receipts:receipts,authority:authorityEnvelope()};return {...result,result_root:digest(result)};}

export function createDownstreamProjectionPlan(input={}){const value=rec(input);const target=String(value.target ?? 'urrf');const objectId=normalizeId(value.object_id,'candidate-object');const requested=uniq(arr(value.representation_kinds));const defaults={'urrf-2d':['dvg','ppd'],'urrf-3d':['mesh','gaussian','point-cloud'],'ragf-3d':['mesh','material','rig','lod'],'ui':['component-graph','vector','layout'],'world':['entity-graph','mesh','field','simulation']};const representations=requested.length?requested:(defaults[target] ?? ['generic']);const plan={format:GMF_BRIDGE_FORMAT,version:GMF_VERSION,plan_id:normalizeId(value.plan_id,`projection.${target}.${slug(objectId)}`),object_id:objectId,target,representations:representations.map((kind,index)=>({representation_id:`${objectId}.${kind}.${index}`,kind,provider_hint:String(rec(value.provider_hints)[kind] ?? `candidate.${kind}`),candidate_only:true})),authority:authorityEnvelope({provider_can_write_authoritative_world_state:false})};return {...plan,plan_root:digest(plan)};}
export function compileGenerativeMorphogenesisCandidate(input={}){const value=rec(input);const graph=value.graph?.format===GMF_GRAPH_FORMAT?clone(value.graph):compileTextGraphIntent(value.graph ?? value.intent ?? value.text);const attributes=value.attributes?.format===GMF_5D_FORMAT?clone(value.attributes):createFiveDimensionalAttributeModel(value.attributes);const complexity=value.complexity?.format===GMF_COMPLEXITY_FORMAT?clone(value.complexity):createComplexityStateMachine(value.complexity);const diffusion=value.diffusion?.format===GMF_DIFFUSION_FORMAT?clone(value.diffusion):createDistributedGenerativeDiffusionPlan(value.diffusion);const projection=createDownstreamProjectionPlan({object_id:attributes.object_id,target:value.target ?? 'urrf-2d',representation_kinds:value.representation_kinds,provider_hints:value.provider_hints});const candidate={format:GMF_CANDIDATE_FORMAT,version:GMF_VERSION,candidate_id:normalizeId(value.candidate_id ?? value.id,`candidate.${digest([graph.graph_root,attributes.model_root]).slice(0,12)}`),graph,attributes,complexity,diffusion,projection,acceptance:{graph_nonempty:graph.nodes.length>0,five_dimensions_exact:attributes.dimensions.length===5,complexity_bounded:complexity.states.length>=2,diffusion_acyclic:diffusion.execution_waves.length>0,downstream_candidate_only:projection.authority.candidate_only===true},authority:authorityEnvelope({source_graph_authoritative:false,generated_geometry_authoritative:false})};return {...candidate,candidate_root:digest(candidate)};}
export function verifyGenerativeMorphogenesisCandidate(candidate){const value=rec(candidate),errors=[];if(value.format!==GMF_CANDIDATE_FORMAT)errors.push('FORMAT');if(rec(value.authority).candidate_only!==true)errors.push('CANDIDATE_ONLY');if(rec(value.authority).authoritative!==false)errors.push('AUTHORITATIVE_FALSE');if(rec(value.authority).canonical_state_mutated!==false)errors.push('NO_CANONICAL_MUTATION');if(rec(value.graph).format!==GMF_GRAPH_FORMAT)errors.push('GRAPH');if(arr(rec(value.attributes).dimensions).length!==5)errors.push('FIVE_DIMENSIONS');if(rec(value.complexity).format!==GMF_COMPLEXITY_FORMAT)errors.push('COMPLEXITY');if(rec(value.diffusion).format!==GMF_DIFFUSION_FORMAT)errors.push('DIFFUSION');if(rec(value.projection).authority?.provider_can_write_authoritative_world_state!==false)errors.push('PROVIDER_AUTHORITY');const expected=value.candidate_root?digest(Object.fromEntries(Object.entries(value).filter(([key])=>key!=='candidate_root'))):null;if(value.candidate_root&&value.candidate_root!==expected)errors.push('ROOT');return {valid:errors.length===0,errors};}
export function canonicalRoot(value){return digest(value);}
