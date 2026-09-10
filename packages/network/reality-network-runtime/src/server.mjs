import {spatial} from '@taowind/reality-simulation-runtime';
import {createBranch, createWorkspace, validateWorkspace} from '@taowind/reality-branch-fabric';
import {verifyDelegation} from '@taowind/agent-authority-fabric';
import {verifyPlayerInputAuthority} from './authority.mjs';
import {clone, hash, FORMATS, makeSnapshotPacket, makeDeltaPacket, makeRfeEvidence, NETWORK_PROTOCOL, NETWORK_VERSION} from './protocol.mjs';
import {AuthoritativeStateHistory, RSR_AUTHORITY_PROTOCOL} from '@taowind/reality-simulation-runtime/network-reconciliation';
import {makeObserverRelevanceView} from './relevance.mjs';

const ZERO='0'.repeat(64);
const CHECKPOINT_VERSION='0.1.0';

const mapEntries=(map, mapValue=value=>value)=>[...map.entries()].map(([key,value])=>({key,value:mapValue(value)}));
const sortedMapEntries=(map, compare, mapValue=value=>value)=>mapEntries(map,mapValue).sort(compare);
const snapshotEntries=(map)=>sortedMapEntries(map,(a,b)=>Number(a.key)-Number(b.key),value=>clone(value));

export function verifyNetworkSessionCheckpoint(checkpoint){
  const errors=[],check=(condition,code)=>{if(!condition)errors.push(code)};
  if(!checkpoint||typeof checkpoint!=='object')return{valid:false,errors:['NETWORK_CHECKPOINT_NOT_OBJECT']};
  try{
    const copy=clone(checkpoint),actual=copy.checkpointRoot;delete copy.checkpointRoot;
    check(checkpoint.format===FORMATS.checkpoint,'NETWORK_CHECKPOINT_FORMAT_INVALID');
    check(checkpoint.version===CHECKPOINT_VERSION,'NETWORK_CHECKPOINT_VERSION_INVALID');
    check(checkpoint.protocol===NETWORK_PROTOCOL,'NETWORK_CHECKPOINT_PROTOCOL_INVALID');
    check(typeof checkpoint.sessionId==='string'&&checkpoint.sessionId.length>0,'NETWORK_CHECKPOINT_SESSION_ID_INVALID');
    check(['open','closed'].includes(checkpoint.status),'NETWORK_CHECKPOINT_STATUS_INVALID');
    check(Number.isSafeInteger(checkpoint.tick)&&checkpoint.tick>=0,'NETWORK_CHECKPOINT_TICK_INVALID');
    check(checkpoint.candidateOnly===true&&checkpoint.authoritative===false,'NETWORK_CHECKPOINT_AUTHORITY_SCOPE_INVALID');
    check(checkpoint.commitStatus==='NOT_COMMITTED','NETWORK_CHECKPOINT_COMMIT_STATUS_INVALID');
    check(typeof actual==='string'&&actual===hash(copy),'NETWORK_CHECKPOINT_ROOT_MISMATCH');
    check(checkpoint.worldSnapshot&&typeof checkpoint.worldSnapshot==='object','NETWORK_CHECKPOINT_WORLD_SNAPSHOT_MISSING');
    check(checkpoint.stateRoot===checkpoint.worldSnapshot?.stateRoot,'NETWORK_CHECKPOINT_STATE_ROOT_MISMATCH');
    check(checkpoint.tick===checkpoint.worldSnapshot?.tick,'NETWORK_CHECKPOINT_WORLD_TICK_MISMATCH');
    for(const field of ['players','delegations','pendingInputs','seenInputSequences','rateByTick','rejections','accepted','receipts','snapshots','deltas'])check(Array.isArray(checkpoint[field]),`NETWORK_CHECKPOINT_${field.toUpperCase()}_INVALID`);
    check(checkpoint.authorityHistory&&Array.isArray(checkpoint.authorityHistory.snapshots),'NETWORK_CHECKPOINT_AUTHORITY_HISTORY_INVALID');
    check(checkpoint.limits&&Number.isSafeInteger(checkpoint.limits.maxFutureTicks)&&Number.isSafeInteger(checkpoint.limits.maxPastTicks)&&Number.isSafeInteger(checkpoint.limits.maxInputsPerTick),'NETWORK_CHECKPOINT_LIMITS_INVALID');
    if(checkpoint.source!==null&&checkpoint.source!==undefined)check(typeof checkpoint.source==='object','NETWORK_CHECKPOINT_SOURCE_INVALID');
  }catch(error){errors.push(`NETWORK_CHECKPOINT_VERIFY_EXCEPTION:${error.name}:${error.message}`)}
  return{valid:errors.length===0,errors,checkpointRoot:checkpoint.checkpointRoot??null,stateRoot:checkpoint.stateRoot??null};
}

export class ServerAuthoritativeWorld {
  static async create({sessionId='session:loopback', worldConfig, maxFutureTicks=12, maxPastTicks=2, maxInputsPerTick=8, clock=()=>new Date().toISOString()}={}) {
    const {SpatialEmbodimentWorld}=await spatial();
    return new ServerAuthoritativeWorld({sessionId,world:new SpatialEmbodimentWorld(worldConfig),maxFutureTicks,maxPastTicks,maxInputsPerTick,clock});
  }
  static async fromCheckpoint({checkpoint,clock=()=>new Date().toISOString()}={}) {
    const verification=verifyNetworkSessionCheckpoint(checkpoint);
    if(!verification.valid)throw new Error(`NETWORK_CHECKPOINT_INVALID:${verification.errors.join(',')}`);
    const {SpatialEmbodimentWorld}=await spatial();
    let world;
    try{world=SpatialEmbodimentWorld.fromSnapshot(checkpoint.worldSnapshot)}catch(error){throw new Error(`NETWORK_CHECKPOINT_WORLD_INVALID:${error.message}`)}
    const canonical=world.snapshot();
    if(canonical.stateRoot!==checkpoint.stateRoot||canonical.tick!==checkpoint.tick)throw new Error('NETWORK_CHECKPOINT_CANONICAL_ROOT_MISMATCH');
    const server=new ServerAuthoritativeWorld({sessionId:checkpoint.sessionId,world,maxFutureTicks:checkpoint.limits.maxFutureTicks,maxPastTicks:checkpoint.limits.maxPastTicks,maxInputsPerTick:checkpoint.limits.maxInputsPerTick,clock});
    const bodyIds=new Set(canonical.bodies.map(body=>body.id)),characterMap=new Map(canonical.characters.map(character=>[character.id,character])),boundBodyIds=new Set(),boundCharacterIds=new Set();
    for(const player of checkpoint.players){
      if(!player||typeof player.playerId!=='string'||typeof player.subjectId!=='string'||typeof player.bodyId!=='string'||typeof player.characterId!=='string')throw new Error('NETWORK_CHECKPOINT_PLAYER_INVALID');
      if(!bodyIds.has(player.bodyId)||characterMap.get(player.characterId)?.bodyId!==player.bodyId)throw new Error(`NETWORK_CHECKPOINT_PLAYER_BINDING_INVALID:${player.playerId}`);
      if(server.players.has(player.playerId))throw new Error(`NETWORK_CHECKPOINT_PLAYER_DUPLICATE:${player.playerId}`);
      if(boundBodyIds.has(player.bodyId)||boundCharacterIds.has(player.characterId))throw new Error(`NETWORK_CHECKPOINT_PLAYER_SLOT_DUPLICATE:${player.playerId}`);
      boundBodyIds.add(player.bodyId);boundCharacterIds.add(player.characterId);
      server.players.set(player.playerId,clone(player));
    }
    for(const entry of checkpoint.delegations){if(!entry||typeof entry.playerId!=='string'||server.delegations.has(entry.playerId)||!server.players.has(entry.playerId)||!verifyDelegation(entry.delegation))throw new Error('NETWORK_CHECKPOINT_DELEGATION_INVALID');server.delegations.set(entry.playerId,clone(entry.delegation));}
    for(const playerId of server.players.keys())if(!server.delegations.has(playerId))throw new Error(`NETWORK_CHECKPOINT_PLAYER_DELEGATION_MISSING:${playerId}`);
    server.status=checkpoint.status;
    server.pendingByTick=new Map(checkpoint.pendingInputs.map(entry=>[Number(entry.tick),clone(entry.inputs)]));
    server.seenSequences=new Map(checkpoint.seenInputSequences.map(entry=>[entry.playerId,new Set(entry.sequences.map(Number))]));
    server.rateByTick=new Map(checkpoint.rateByTick.map(entry=>[String(entry.key),Number(entry.value)]));
    server.rejections=clone(checkpoint.rejections);server.accepted=clone(checkpoint.accepted);server.receipts=clone(checkpoint.receipts);
    server.snapshots=new Map(checkpoint.snapshots.map(entry=>[Number(entry.tick),clone(entry.snapshot)]));
    server.snapshots.set(canonical.tick,clone(canonical));
    server.deltas=new Map(checkpoint.deltas.map(entry=>[Number(entry.tick),clone(entry.delta)]));
    server.previousTickRoot=String(checkpoint.previousTickRoot??ZERO);
    server.lastSnapshot=clone(canonical);
    const capacity=Number(checkpoint.authorityHistory.capacity??256);
    if(!Number.isSafeInteger(capacity)||capacity<2)throw new Error('NETWORK_CHECKPOINT_HISTORY_CAPACITY_INVALID');
    server.authorityHistory=new AuthoritativeStateHistory(capacity);
    for(const snapshot of checkpoint.authorityHistory.snapshots){
      try{const restored=SpatialEmbodimentWorld.fromSnapshot(snapshot).snapshot();server.authorityHistory.push(restored)}catch(error){throw new Error(`NETWORK_CHECKPOINT_HISTORY_INVALID:${error.message}`)}
    }
    if(!server.authorityHistory.get(canonical.tick))server.authorityHistory.push(canonical);
    server.recoveryCandidates=[];
    return server;
  }
  constructor({sessionId,world,maxFutureTicks,maxPastTicks,maxInputsPerTick,clock}) {
    this.sessionId=sessionId; this.rsrWorld=world; this.maxFutureTicks=maxFutureTicks; this.maxPastTicks=maxPastTicks; this.maxInputsPerTick=maxInputsPerTick; this.clock=clock;
    this.status='open'; this.players=new Map(); this.delegations=new Map(); this.pendingByTick=new Map(); this.seenSequences=new Map(); this.rateByTick=new Map(); this.rejections=[]; this.accepted=[]; this.receipts=[]; this.snapshots=new Map([[world.tick,world.snapshot()]]); this.deltas=new Map(); this.previousTickRoot=ZERO; this.lastSnapshot=this.rsrWorld.snapshot(); this.authorityHistory=new AuthoritativeStateHistory(256); this.authorityHistory.push(this.lastSnapshot); this.recoveryCandidates=[];
  }
  get session(){return {format:FORMATS.session,sessionId:this.sessionId,status:this.status,players:this.players,tick:this.rsrWorld.tick};}
  createCheckpoint({source=null}={}){
    const historyTicks=this.authorityHistory.ticks();
    const base={
      format:FORMATS.checkpoint,version:CHECKPOINT_VERSION,protocol:NETWORK_PROTOCOL,sessionId:this.sessionId,status:this.status,tick:this.rsrWorld.tick,
      stateRoot:this.lastSnapshot.stateRoot,worldSnapshot:clone(this.lastSnapshot),
      limits:{maxFutureTicks:this.maxFutureTicks,maxPastTicks:this.maxPastTicks,maxInputsPerTick:this.maxInputsPerTick},
      players:[...this.players.values()].map(clone).sort((a,b)=>a.playerId.localeCompare(b.playerId)),
      delegations:[...this.delegations.entries()].map(([playerId,delegation])=>({playerId,delegation:clone(delegation)})).sort((a,b)=>a.playerId.localeCompare(b.playerId)),
      pendingInputs:sortedMapEntries(this.pendingByTick,(a,b)=>Number(a.key)-Number(b.key),inputs=>clone(inputs).sort((a,b)=>a.playerId.localeCompare(b.playerId)||a.inputSequence-b.inputSequence)).map(entry=>({tick:Number(entry.key),inputs:entry.value})),
      seenInputSequences:[...this.seenSequences.entries()].map(([playerId,sequences])=>({playerId,sequences:[...sequences].sort((a,b)=>a-b)})).sort((a,b)=>a.playerId.localeCompare(b.playerId)),
      rateByTick:[...this.rateByTick.entries()].map(([key,value])=>({key,value})).sort((a,b)=>a.key.localeCompare(b.key)),
      rejections:clone(this.rejections),accepted:clone(this.accepted),receipts:clone(this.receipts),
      snapshots:snapshotEntries(this.snapshots).map(entry=>({tick:Number(entry.key),snapshot:entry.value})),
      deltas:snapshotEntries(this.deltas).map(entry=>({tick:Number(entry.key),delta:entry.value})),
      previousTickRoot:this.previousTickRoot,
      authorityHistory:{capacity:this.authorityHistory.capacity,snapshots:historyTicks.map(tick=>this.authorityHistory.get(tick)).filter(Boolean)},
      source:source?clone(source):null,
      candidateOnly:true,authoritative:false,commitStatus:'NOT_COMMITTED'
    };
    return{...base,checkpointRoot:hash(base)};
  }
  joinPlayer({subjectId,playerId,characterId,bodyId,delegation}) {if(this.status!=='open')throw new Error('SESSION_NOT_OPEN');if(this.players.has(playerId))throw new Error('PLAYER_ALREADY_JOINED');const body=this.lastSnapshot.bodies.find(item=>item.id===bodyId),character=this.lastSnapshot.characters.find(item=>item.id===characterId);if(!body)throw new Error('PLAYER_BODY_NOT_FOUND');if(!character)throw new Error('PLAYER_CHARACTER_NOT_FOUND');if(character.bodyId!==bodyId)throw new Error('PLAYER_CHARACTER_BODY_MISMATCH');if([...this.players.values()].some(player=>player.bodyId===bodyId||player.characterId===characterId))throw new Error('PLAYER_SLOT_OCCUPIED');this.players.set(playerId,{subjectId,playerId,characterId,bodyId,joinedTick:this.rsrWorld.tick,connected:true});this.delegations.set(playerId,clone(delegation));return this.pullSnapshot('late-join');}
  disconnect(playerId){const p=this.players.get(playerId);if(p)p.connected=false;return makeRfeEvidence('player-disconnect',{sessionId:this.sessionId,playerId,tick:this.rsrWorld.tick});}
  reconnect(playerId){const p=this.players.get(playerId);if(!p)throw new Error('PLAYER_NOT_FOUND');p.connected=true;return {snapshot:this.pullSnapshot('reconnect'),evidence:makeRfeEvidence('player-reconnect',{sessionId:this.sessionId,playerId,tick:this.rsrWorld.tick})};}
  close(){this.status='closed';return makeRfeEvidence('session-close',{sessionId:this.sessionId,tick:this.rsrWorld.tick,lastStateRoot:this.lastSnapshot.stateRoot});}
  rejection(input,code,details={}){const base={format:FORMATS.rejection,protocol:NETWORK_PROTOCOL,sessionId:this.sessionId,serverTick:this.rsrWorld.tick,subjectId:input?.subjectId??null,playerId:input?.playerId??null,inputSequence:input?.inputSequence??null,code,details};const receipt={...base,rejectionRoot:hash(base)};this.rejections.push(receipt);return {accepted:false,rejection:receipt};}
  submitInput(input){
    if (!input || input.format!==FORMATS.input) return this.rejection(input,'INPUT_FORMAT_INVALID');
    for(const key of ['subjectId','playerId','sessionId','inputSequence','clientTick','targetServerTick','command','authorizationRoot','clientPredictionRoot'])if(input[key]===undefined||input[key]===null)return this.rejection(input,'INPUT_FIELD_MISSING',{key});
    if(input.position||input.velocity||input.collisionResult||input.stateRoot||['teleport','set-position','set-velocity','admin'].includes(input.command?.type))return this.rejection(input,'CLIENT_STATE_WRITE_FORBIDDEN');
    if(!Number.isSafeInteger(input.inputSequence)||input.inputSequence<0)return this.rejection(input,'INPUT_SEQUENCE_INVALID');
    if(!Number.isSafeInteger(input.targetServerTick))return this.rejection(input,'TARGET_TICK_INVALID');
    const set=this.seenSequences.get(input.playerId)??new Set();if(set.has(input.inputSequence))return {accepted:true,duplicate:true,ack:{format:FORMATS.ack,sessionId:this.sessionId,playerId:input.playerId,inputSequence:input.inputSequence,serverTick:this.rsrWorld.tick,status:'duplicate'}};
    const authority=verifyPlayerInputAuthority({delegation:this.delegations.get(input.playerId),authorizationRoot:input.authorizationRoot,session:this,input,now:this.clock()});if(!authority.ok)return this.rejection(input,authority.code);
    if(input.targetServerTick < this.rsrWorld.tick-this.maxPastTicks)return this.rejection(input,'INPUT_EXPIRED');
    if(input.targetServerTick > this.rsrWorld.tick+this.maxFutureTicks)return this.rejection(input,'INPUT_TOO_FAR_FUTURE');
    const rateKey=`${input.playerId}:${this.rsrWorld.tick}`,rate=(this.rateByTick.get(rateKey)??0)+1;this.rateByTick.set(rateKey,rate);if(rate>this.maxInputsPerTick)return this.rejection(input,'INPUT_RATE_EXCEEDED');
    set.add(input.inputSequence);this.seenSequences.set(input.playerId,set);const target=Math.max(this.rsrWorld.tick+1,input.targetServerTick);const list=this.pendingByTick.get(target)??[];list.push(clone(input));this.pendingByTick.set(target,list);this.accepted.push(clone(input));return {accepted:true,queuedForTick:target};
  }
  inputToRsr(input,tick){const p=this.players.get(input.playerId),c=input.command;if(c.type==='move')return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'move-character',characterId:p.characterId,direction:{x:Math.round(c.x??0),y:0,z:Math.round(c.z??0)},speedQ:Math.round(c.speedQ??1000000)};if(c.type==='jump')return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'jump-character',characterId:p.characterId};if(c.type==='impulse')return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'apply-impulse',bodyId:p.bodyId,impulse:{x:Math.round(c.x??0),y:Math.round(c.y??0),z:Math.round(c.z??0)}};throw new Error('ACTION_NOT_ALLOWED');}
  advanceTick(){if(this.status!=='open')throw new Error('SESSION_NOT_OPEN');const next=this.rsrWorld.tick+1,inputs=(this.pendingByTick.get(next)??[]).sort((a,b)=>a.playerId.localeCompare(b.playerId)||a.inputSequence-b.inputSequence),commands=inputs.map(i=>this.inputToRsr(i,next));this.pendingByTick.delete(next);const previous=this.lastSnapshot;const {snapshot}=this.rsrWorld.step(commands);const acceptedAtTick=inputs.map(i=>({playerId:i.playerId,inputSequence:i.inputSequence,inputRoot:hash(i)}));const rejectedAtTick=this.rejections.filter(r=>r.serverTick===next);const provisional={format:FORMATS.receipt,sessionId:this.sessionId,tick:next,serverStateRoot:snapshot.stateRoot,acceptedInputRoot:hash(acceptedAtTick),rejectedInputRoot:hash(rejectedAtTick),snapshotRoot:ZERO,deltaRoot:ZERO,networkReceiptRoot:ZERO,previousTickRoot:this.previousTickRoot};const snapshotPacket=makeSnapshotPacket(this.sessionId,snapshot,ZERO,'tick',previous.stateRoot);const deltaPacket=makeDeltaPacket(this.sessionId,previous,snapshot,ZERO);const receiptBase={...provisional,snapshotRoot:snapshotPacket.snapshotRoot,deltaRoot:deltaPacket.deltaRoot};const receipt={...receiptBase,networkReceiptRoot:hash(receiptBase)};snapshotPacket.serverReceiptRoot=receipt.networkReceiptRoot;deltaPacket.serverReceiptRoot=receipt.networkReceiptRoot;this.previousTickRoot=receipt.networkReceiptRoot;this.receipts.push(receipt);this.snapshots.set(next,clone(snapshot));this.deltas.set(next,clone(deltaPacket));this.lastSnapshot=clone(snapshot);this.authorityHistory.push(snapshot);return {tick:next,inputs,acks:inputs.map(i=>({format:FORMATS.ack,protocol:NETWORK_PROTOCOL,sessionId:this.sessionId,playerId:i.playerId,inputSequence:i.inputSequence,serverTick:next,stateRoot:snapshot.stateRoot,status:'accepted',ackRoot:hash({sessionId:this.sessionId,playerId:i.playerId,inputSequence:i.inputSequence,serverTick:next,stateRoot:snapshot.stateRoot})})),snapshot:snapshotPacket,delta:deltaPacket,receipt,evidence:makeRfeEvidence('authoritative-tick',receipt)};}
  pullSnapshot(reason='manual'){const previousTick=Math.max(0,this.lastSnapshot.tick-1),previous=this.authorityHistory.get(previousTick);return makeSnapshotPacket(this.sessionId,this.lastSnapshot,this.receipts.at(-1)?.networkReceiptRoot??ZERO,reason,previous?.stateRoot??ZERO);}
  pullDelta(tick=this.rsrWorld.tick){return clone(this.deltas.get(tick)??makeDeltaPacket(this.sessionId,null,this.lastSnapshot,this.receipts.at(-1)?.networkReceiptRoot??ZERO));}
  pullObserverView(profile={}){return makeObserverRelevanceView(this.lastSnapshot,{sessionId:this.sessionId,...profile});}
  createRecoveryCandidate({playerId,reportedRoot,reason='severe-desync'}={}){const trusted=this.lastSnapshot,branch=createBranch({branch_id:`branch:network-recovery:${playerId}:${trusted.tick}`,label:'Network recovery',hypothesis:'Replay from last trusted snapshot without contaminating main session',operations:[{operation_id:'op:restore-snapshot',op:'set',path:'network.recovery.snapshotRoot',value:trusted.stateRoot,capability_id:'network.recovery.restore'}],constraints:{max_risk:2000},invariants:[{path:'network.recovery.snapshotRoot',operator:'eq',value:trusted.stateRoot,code:'TRUSTED_ROOT_REQUIRED'}],tags:['network-recovery','isolated']});const workspace=createWorkspace({reality_id:`reality:${this.sessionId}`,base_generation:trusted.tick,base_generation_root:hash(trusted.stateRoot),project_root:hash({sessionId:this.sessionId}),base_state:{network:{recovery:{snapshotRoot:reportedRoot}}},branches:[branch],metadata:{playerId,reason,receiptRoot:this.receipts.at(-1)?.networkReceiptRoot??ZERO}});const validation=validateWorkspace(workspace);const candidate={format:FORMATS.recovery,sessionId:this.sessionId,playerId,reason,status:validation.valid?'candidate':'invalid',trustedTick:trusted.tick,trustedStateRoot:trusted.stateRoot,reportedRoot,workspace,validation,recoveryRoot:hash({sessionId:this.sessionId,playerId,reason,trustedTick:trusted.tick,trustedStateRoot:trusted.stateRoot,reportedRoot,workspaceRoot:workspace.workspace_root})};this.recoveryCandidates.push(candidate);return candidate;}
  health(){return {status:this.status==='open'?'healthy':'closed',runtime_id:'rncs.network',version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,rsrAuthorityProtocol:RSR_AUTHORITY_PROTOCOL,sessionId:this.sessionId,tick:this.rsrWorld.tick,players:this.players.size,stateRoot:this.lastSnapshot.stateRoot,authoritativeWorldInstances:1,authorityHistoryTicks:this.authorityHistory.ticks().length,rejections:this.rejections.length,receipts:this.receipts.length};}
}
