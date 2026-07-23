import {ServerAuthoritativeWorld} from './server.mjs';
import {ClientPredictionRuntime} from './client.mjs';
import {LoopbackTransport} from './transport.mjs';
import {issuePlayerDelegation} from './authority.mjs';
import {createTwoPlayerWorldConfig} from './world-fixture.mjs';
import {clone, hash, NETWORK_VERSION, NETWORK_PROTOCOL, NETWORK_RUNTIME_ID} from './protocol.mjs';

export const NETWORK_WORLD_COMPILATION_FORMAT='reality-studio.network-world-compilation.v1.6';
export const NETWORK_WORLD_COMPILER_VERSION='1.6.0-alpha.1';

const verifyRoot=(value,field)=>{
  if(!value||typeof value!=='object'||typeof value[field]!=='string')return false;
  const payload=clone(value),actual=payload[field];delete payload[field];return actual===hash(payload);
};

export function verifyNetworkWorldCompilationEnvelope(compilation){
  const errors=[],check=(condition,code)=>{if(!condition)errors.push(code)};
  if(!compilation||typeof compilation!=='object')return{valid:false,errors:['NETWORK_COMPILATION_NOT_OBJECT']};
  check(compilation.format===NETWORK_WORLD_COMPILATION_FORMAT,'NETWORK_COMPILATION_FORMAT_INVALID');
  check(compilation.version===NETWORK_WORLD_COMPILER_VERSION,'NETWORK_COMPILATION_VERSION_INVALID');
  check(verifyRoot(compilation,'compilation_root'),'NETWORK_COMPILATION_ROOT_MISMATCH');
  check(hash(compilation.world_config)===compilation.world_config_root,'NETWORK_WORLD_CONFIG_ROOT_MISMATCH');
  check(verifyRoot(compilation.evidence,'evidence_root'),'NETWORK_EVIDENCE_ROOT_MISMATCH');
  check(compilation.world_config?.worldId===compilation.world_id,'NETWORK_WORLD_ID_MISMATCH');
  check(compilation.world_config?.reality?.realityRoot===compilation.project_root,'NETWORK_PROJECT_AUTHORITY_ROOT_MISMATCH');
  check(compilation.world_config?.reality?.evidenceRoot===compilation.evidence?.evidence_root,'NETWORK_WORLD_EVIDENCE_ROOT_MISMATCH');
  check(compilation.evidence?.project_root===compilation.project_root,'NETWORK_EVIDENCE_PROJECT_ROOT_MISMATCH');
  check(compilation.evidence?.spatial_workspace_root===compilation.spatial_workspace_root,'NETWORK_EVIDENCE_WORKSPACE_ROOT_MISMATCH');
  check(compilation.evidence?.source_world_root===compilation.source_world_root,'NETWORK_EVIDENCE_SOURCE_WORLD_ROOT_MISMATCH');
  check(compilation.evidence?.active_scene_root===compilation.active_scene_root,'NETWORK_EVIDENCE_SCENE_ROOT_MISMATCH');
  check(compilation.evidence?.authoring_root===compilation.authoring_root,'NETWORK_EVIDENCE_AUTHORING_ROOT_MISMATCH');
  const bodies=new Map((compilation.world_config?.bodies??[]).map(body=>[body.id,body]));
  const characters=new Map((compilation.world_config?.characters??[]).map(character=>[character.id,character]));
  const slotIds=new Set(),playerIds=new Set(),characterIds=new Set(),bodyIds=new Set();
  for(const slot of compilation.player_slots??[]){
    check(!slotIds.has(slot.slot_id),`NETWORK_SLOT_ID_DUPLICATE:${slot.slot_id}`);slotIds.add(slot.slot_id);
    check(!playerIds.has(slot.player_id),`NETWORK_PLAYER_ID_DUPLICATE:${slot.player_id}`);playerIds.add(slot.player_id);
    check(!characterIds.has(slot.character_id),`NETWORK_CHARACTER_ID_DUPLICATE:${slot.character_id}`);characterIds.add(slot.character_id);
    check(!bodyIds.has(slot.body_id),`NETWORK_BODY_ID_DUPLICATE:${slot.body_id}`);bodyIds.add(slot.body_id);
    check(bodies.has(slot.body_id),`NETWORK_SLOT_BODY_MISSING:${slot.slot_id}`);
    check(characters.get(slot.character_id)?.bodyId===slot.body_id,`NETWORK_SLOT_CHARACTER_BODY_MISMATCH:${slot.slot_id}`);
  }
  const bindingRoots=[];
  for(const binding of compilation.asset_bindings??[]){
    check(verifyRoot(binding,'binding_root'),`NETWORK_ASSET_BINDING_ROOT_MISMATCH:${binding.binding_id}`);
    check(bodies.has(binding.body_id),`NETWORK_ASSET_BODY_MISSING:${binding.binding_id}`);
    bindingRoots.push(binding.binding_root);
  }
  check(hash(bindingRoots)===hash(compilation.evidence?.asset_binding_roots??[]),'NETWORK_EVIDENCE_ASSET_BINDINGS_MISMATCH');
  return{valid:errors.length===0,errors,compilation_root:compilation.compilation_root??null,world_config_root:compilation.world_config_root??null,project_root:compilation.project_root??null};
}

const compiledNetworkOptions=profile=>({
  seed:Number(profile?.seed??1),
  fixedLatencyTicks:Number(profile?.fixed_latency_ticks??0),
  jitterTicks:Number(profile?.jitter_ticks??0),
  lossRate:Number(profile?.loss_rate_ppm??0)/1_000_000,
  duplicateRate:Number(profile?.duplicate_rate_ppm??0)/1_000_000,
  reorderRate:Number(profile?.reorder_rate_ppm??0)/1_000_000,
});

export class RealityNetworkRuntime {
  constructor(){this.sessions=new Map();}
  async createSession({sessionId=`session:${Date.now()}`,worldConfig=createTwoPlayerWorldConfig(),network={seed:1},clock}={}){const server=await ServerAuthoritativeWorld.create({sessionId,worldConfig,clock});const transport=new LoopbackTransport(network);const ctx={sessionId,server,transport,clients:new Map(),lastTickResult:null,closed:false,sourceCompilation:null};transport.register(`server:${sessionId}`,packet=>{if(packet.type==='input'){const result=server.submitInput(packet.payload);if(!result.accepted)transport.send(`server:${sessionId}`,`client:${packet.payload.playerId}`,'rejection',result.rejection);else if(result.duplicate){const snapshot=server.pullSnapshot('duplicate-ack');const ack={...result.ack,stateRoot:snapshot.stateRoot};transport.send(`server:${sessionId}`,`client:${packet.payload.playerId}`,'ack',{ack,snapshot});}}});this.sessions.set(sessionId,ctx);return {sessionId,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL};}
  async createSessionFromCompilation({sessionId,compilation,network={},clock}={}){const verification=verifyNetworkWorldCompilationEnvelope(compilation);if(!verification.valid)throw new Error(verification.errors[0]);const id=sessionId??`session:${compilation.project_id}`;const result=await this.createSession({sessionId:id,worldConfig:clone(compilation.world_config),network:{...compiledNetworkOptions(compilation.network_profile),...network},clock});const ctx=this.require(id);ctx.sourceCompilation=clone(compilation);return{...result,compilationRoot:compilation.compilation_root,worldConfigRoot:compilation.world_config_root,projectRoot:compilation.project_root,playerSlots:compilation.player_slots.length};}
  require(sessionId){const ctx=this.sessions.get(sessionId);if(!ctx)throw new Error('SESSION_NOT_FOUND');return ctx;}
  async joinSession({sessionId,subjectId,playerId,characterId,bodyId,delegation=null}){const ctx=this.require(sessionId);delegation??=issuePlayerDelegation({sessionId,subjectId,playerId,characterId});const snapshot=ctx.server.joinPlayer({subjectId,playerId,characterId,bodyId,delegation});const client=await ClientPredictionRuntime.create({player:{sessionId,subjectId,playerId,characterId,bodyId},delegation,initialSnapshot:snapshot});ctx.clients.set(playerId,client);ctx.transport.register(`client:${playerId}`,packet=>{if(packet.type==='ack')client.receiveAck(packet.payload.ack,packet.payload.snapshot);else if(packet.type==='delta')client.receiveDelta(packet.payload);else if(packet.type==='snapshot'){client.reconcile(packet.payload);client.lastConfirmed=clone(packet.payload);}else if(packet.type==='rejection')client.receiveRejection(packet.payload);});return {playerId,delegation,snapshot};}
  async joinCompiledSlot({sessionId,slotId,subjectId}={}){const ctx=this.require(sessionId),compilation=ctx.sourceCompilation;if(!compilation)throw new Error('SESSION_COMPILATION_REQUIRED');const slot=compilation.player_slots.find(item=>item.slot_id===slotId);if(!slot)throw new Error('COMPILED_SLOT_NOT_FOUND');const subject=subjectId??slot.subject_id;if(subject!==slot.subject_id)throw new Error('COMPILED_SLOT_SUBJECT_MISMATCH');const delegation=issuePlayerDelegation({sessionId,subjectId:subject,playerId:slot.player_id,characterId:slot.character_id,actions:slot.actions});const joined=await this.joinSession({sessionId,subjectId:subject,playerId:slot.player_id,characterId:slot.character_id,bodyId:slot.body_id,delegation});return{slotId,...joined};}
  submitInput({sessionId,playerId,command,targetServerTick}){const ctx=this.require(sessionId),client=ctx.clients.get(playerId);if(!client)throw new Error('CLIENT_NOT_FOUND');const input=client.createInput(command,{targetServerTick});ctx.transport.send(`client:${playerId}`,`server:${sessionId}`,'input',input);client.markSent(input.inputSequence,ctx.transport.tick);return input;}
  advanceServerTick({sessionId,ticks=1}={}){const ctx=this.require(sessionId);const results=[];for(let i=0;i<ticks;i++){for(const [playerId,client] of ctx.clients)for(const input of client.dueForResend(ctx.transport.tick)){ctx.transport.send(`client:${playerId}`,`server:${sessionId}`,'input',input);client.markSent(input.inputSequence,ctx.transport.tick);}ctx.transport.advance(1);const result=ctx.server.advanceTick();ctx.lastTickResult=result;const ackByPlayer=new Map();for(const ack of result.acks){const prior=ackByPlayer.get(ack.playerId);if(!prior||ack.inputSequence>prior.inputSequence)ackByPlayer.set(ack.playerId,ack);}for(const ack of ackByPlayer.values())ctx.transport.send(`server:${sessionId}`,`client:${ack.playerId}`,'ack',{ack,snapshot:result.snapshot});for(const playerId of ctx.clients.keys())if(!ackByPlayer.has(playerId))ctx.transport.send(`server:${sessionId}`,`client:${playerId}`,'delta',result.delta);ctx.transport.advance(Math.max(1,Number(ctx.transport.condition.options.fixedLatencyTicks??0)+Number(ctx.transport.condition.options.jitterTicks??0)+3));
      for(const [playerId,client] of ctx.clients){
        let attempts=0;
        while(client.connected && (client.lastConfirmed?.tick??-1)<result.tick && attempts<64){
          ctx.transport.send(`server:${sessionId}`,`client:${playerId}`,'snapshot',result.snapshot);
          ctx.transport.advance(Math.max(1,Number(ctx.transport.condition.options.fixedLatencyTicks??0)+Number(ctx.transport.condition.options.jitterTicks??0)+3));
          attempts++;
        }
      }
      results.push(result);}return results.at(-1);}
  pullSnapshot({sessionId,reason='manual'}={}){return this.require(sessionId).server.pullSnapshot(reason);}
  pullDelta({sessionId,tick}={}){return this.require(sessionId).server.pullDelta(tick);}
  acknowledge({sessionId,playerId,inputSequence}={}){const ctx=this.require(sessionId),client=ctx.clients.get(playerId);return {known:client?.unacknowledged.some(x=>x.input.inputSequence===inputSequence)===false,inputSequence};}
  reconcile({sessionId,playerId}={}){const ctx=this.require(sessionId);return ctx.clients.get(playerId).reconcile(ctx.server.pullSnapshot('reconcile'));}
  disconnect({sessionId,playerId}={}){const ctx=this.require(sessionId);ctx.transport.disconnect(`client:${playerId}`);ctx.clients.get(playerId).connected=false;return ctx.server.disconnect(playerId);}
  reconnect({sessionId,playerId}={}){const ctx=this.require(sessionId);ctx.transport.reconnect(`client:${playerId}`);ctx.clients.get(playerId).connected=true;const result=ctx.server.reconnect(playerId);ctx.clients.get(playerId).reconcile(result.snapshot);return result;}
  getSessionHealth({sessionId}={}){const ctx=this.require(sessionId),server=ctx.server.health(),transport=ctx.transport.getStats(),clients={};for(const [id,client] of ctx.clients)clients[id]=client.metrics(server.stateRoot);const source=ctx.sourceCompilation?{format:ctx.sourceCompilation.format,compilationRoot:ctx.sourceCompilation.compilation_root,projectRoot:ctx.sourceCompilation.project_root,worldConfigRoot:ctx.sourceCompilation.world_config_root,spatialWorkspaceRoot:ctx.sourceCompilation.spatial_workspace_root,sourceWorldRoot:ctx.sourceCompilation.source_world_root,activeSceneRoot:ctx.sourceCompilation.active_scene_root,authoringRoot:ctx.sourceCompilation.authoring_root}:null;return {runtime_id:NETWORK_RUNTIME_ID,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,server,transport,clients,source};}
  closeSession({sessionId}={}){const ctx=this.require(sessionId);ctx.closed=true;return ctx.server.close();}
  createRecovery({sessionId,playerId,reportedRoot,reason}={}){return this.require(sessionId).server.createRecoveryCandidate({playerId,reportedRoot,reason});}
  setNetworkConditions({sessionId,...conditions}={}){const ctx=this.require(sessionId);ctx.transport.setConditions(conditions);return clone(ctx.transport.condition.options);}
  async invoke(action,payload={}){if(action==='health')return {status:'ok',runtime_id:NETWORK_RUNTIME_ID,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,sessions:this.sessions.size};if(typeof this[action]!=='function')throw new Error(`ACTION_NOT_SUPPORTED:${action}`);return this[action](payload);}
}
export const createNetworkRuntime=()=>new RealityNetworkRuntime();
