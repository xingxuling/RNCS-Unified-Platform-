import {ServerAuthoritativeWorld} from './server.mjs';
import {ClientPredictionRuntime} from './client.mjs';
import {LoopbackTransport} from './transport.mjs';
import {issuePlayerDelegation} from './authority.mjs';
import {createTwoPlayerWorldConfig} from './world-fixture.mjs';
import {clone, NETWORK_VERSION, NETWORK_PROTOCOL, NETWORK_RUNTIME_ID} from './protocol.mjs';

export class RealityNetworkRuntime {
  constructor(){this.sessions=new Map();}
  async createSession({sessionId=`session:${Date.now()}`,worldConfig=createTwoPlayerWorldConfig(),network={seed:1},clock}={}){const server=await ServerAuthoritativeWorld.create({sessionId,worldConfig,clock});const transport=new LoopbackTransport(network);const ctx={sessionId,server,transport,clients:new Map(),lastTickResult:null,closed:false};transport.register(`server:${sessionId}`,packet=>{if(packet.type==='input'){const result=server.submitInput(packet.payload);if(!result.accepted)transport.send(`server:${sessionId}`,`client:${packet.payload.playerId}`,'rejection',result.rejection);else if(result.duplicate){const snapshot=server.pullSnapshot('duplicate-ack');const ack={...result.ack,stateRoot:snapshot.stateRoot};transport.send(`server:${sessionId}`,`client:${packet.payload.playerId}`,'ack',{ack,snapshot});}}});this.sessions.set(sessionId,ctx);return {sessionId,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL};}
  require(sessionId){const ctx=this.sessions.get(sessionId);if(!ctx)throw new Error('SESSION_NOT_FOUND');return ctx;}
  async joinSession({sessionId,subjectId,playerId,characterId,bodyId,delegation=null}){const ctx=this.require(sessionId);delegation??=issuePlayerDelegation({sessionId,subjectId,playerId,characterId});const snapshot=ctx.server.joinPlayer({subjectId,playerId,characterId,bodyId,delegation});const client=await ClientPredictionRuntime.create({player:{sessionId,subjectId,playerId,characterId,bodyId},delegation,initialSnapshot:snapshot});ctx.clients.set(playerId,client);ctx.transport.register(`client:${playerId}`,packet=>{if(packet.type==='ack')client.receiveAck(packet.payload.ack,packet.payload.snapshot);else if(packet.type==='delta')client.receiveDelta(packet.payload);else if(packet.type==='snapshot'){client.reconcile(packet.payload);client.lastConfirmed=clone(packet.payload);}else if(packet.type==='rejection')client.receiveRejection(packet.payload);});return {playerId,delegation,snapshot};}
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
  getSessionHealth({sessionId}={}){const ctx=this.require(sessionId),server=ctx.server.health(),transport=ctx.transport.getStats(),clients={};for(const [id,client] of ctx.clients)clients[id]=client.metrics(server.stateRoot);return {runtime_id:NETWORK_RUNTIME_ID,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,server,transport,clients};}
  closeSession({sessionId}={}){const ctx=this.require(sessionId);ctx.closed=true;return ctx.server.close();}
  createRecovery({sessionId,playerId,reportedRoot,reason}={}){return this.require(sessionId).server.createRecoveryCandidate({playerId,reportedRoot,reason});}
  setNetworkConditions({sessionId,...conditions}={}){const ctx=this.require(sessionId);ctx.transport.setConditions(conditions);return clone(ctx.transport.condition.options);}
  async invoke(action,payload={}){if(action==='health')return {status:'ok',runtime_id:NETWORK_RUNTIME_ID,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,sessions:this.sessions.size};if(typeof this[action]!=='function')throw new Error(`ACTION_NOT_SUPPORTED:${action}`);return this[action](payload);}
}
export const createNetworkRuntime=()=>new RealityNetworkRuntime();
