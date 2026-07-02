import {spatial} from '@taowind/reality-simulation-runtime';
import {verifyPlayerInputAuthority} from './authority.mjs';
import {clone,hash,FORMATS,makeSnapshotPacket,makeDeltaPacket,makeRfeEvidence} from './protocol.mjs';

const ZERO='0'.repeat(64);
export class ServerAuthoritativeWorld {
  static async create({sessionId='session:loopback',worldConfig,maxFutureTicks=12,maxPastTicks=2,maxInputsPerTick=8,clock=()=>new Date().toISOString()}={}) {
    const {SpatialEmbodimentWorld}=await spatial();
    return new ServerAuthoritativeWorld({sessionId,world:new SpatialEmbodimentWorld(worldConfig),maxFutureTicks,maxPastTicks,maxInputsPerTick,clock});
  }
  constructor({sessionId,world,maxFutureTicks,maxPastTicks,maxInputsPerTick,clock}) {
    Object.assign(this,{sessionId,rsrWorld:world,maxFutureTicks,maxPastTicks,maxInputsPerTick,clock});
    this.status='open';this.players=new Map();this.delegations=new Map();this.pendingByTick=new Map();this.seenSequences=new Map();this.rateByTick=new Map();this.rejections=[];this.receipts=[];this.deltas=new Map();this.previousTickRoot=ZERO;this.lastSnapshot=world.snapshot();this.recoveryCandidates=[];
  }
  get session(){return {format:FORMATS.session,sessionId:this.sessionId,status:this.status,players:this.players,tick:this.rsrWorld.tick};}
  joinPlayer({subjectId,playerId,characterId,bodyId,delegation}){this.players.set(playerId,{subjectId,playerId,characterId,bodyId,connected:true});this.delegations.set(playerId,clone(delegation));return this.pullSnapshot('late-join');}
  disconnect(playerId){const player=this.players.get(playerId);if(player)player.connected=false;return makeRfeEvidence('player-disconnect',{sessionId:this.sessionId,playerId,tick:this.rsrWorld.tick});}
  reconnect(playerId){const player=this.players.get(playerId);if(!player)throw new Error('PLAYER_NOT_FOUND');player.connected=true;return {snapshot:this.pullSnapshot('reconnect'),evidence:makeRfeEvidence('player-reconnect',{sessionId:this.sessionId,playerId,tick:this.rsrWorld.tick})};}
  close(){this.status='closed';return makeRfeEvidence('session-close',{sessionId:this.sessionId,tick:this.rsrWorld.tick,lastStateRoot:this.lastSnapshot.stateRoot});}
  reject(input,code){const base={format:FORMATS.rejection,sessionId:this.sessionId,serverTick:this.rsrWorld.tick,playerId:input?.playerId??null,inputSequence:input?.inputSequence??null,code};const rejection={...base,rejectionRoot:hash(base)};this.rejections.push(rejection);return {accepted:false,rejection};}
  submitInput(input){
    if(!input||input.format!==FORMATS.input)return this.reject(input,'INPUT_FORMAT_INVALID');
    if(input.position||input.velocity||input.stateRoot)return this.reject(input,'CLIENT_STATE_WRITE_FORBIDDEN');
    const seen=this.seenSequences.get(input.playerId)??new Set();if(seen.has(input.inputSequence))return {accepted:true,duplicate:true};
    const auth=verifyPlayerInputAuthority({delegation:this.delegations.get(input.playerId),authorizationRoot:input.authorizationRoot,session:this,input,now:this.clock()});if(!auth.ok)return this.reject(input,auth.code);
    if(input.targetServerTick<this.rsrWorld.tick-this.maxPastTicks)return this.reject(input,'INPUT_EXPIRED');
    if(input.targetServerTick>this.rsrWorld.tick+this.maxFutureTicks)return this.reject(input,'INPUT_TOO_FAR_FUTURE');
    const rateKey=`${input.playerId}:${this.rsrWorld.tick}`,rate=(this.rateByTick.get(rateKey)??0)+1;this.rateByTick.set(rateKey,rate);if(rate>this.maxInputsPerTick)return this.reject(input,'INPUT_RATE_EXCEEDED');
    seen.add(input.inputSequence);this.seenSequences.set(input.playerId,seen);const tick=Math.max(this.rsrWorld.tick+1,input.targetServerTick),queue=this.pendingByTick.get(tick)??[];queue.push(clone(input));this.pendingByTick.set(tick,queue);return {accepted:true,queuedForTick:tick};
  }
  toRsr(input,tick){const player=this.players.get(input.playerId),command=input.command;if(command.type==='move')return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'move-character',characterId:player.characterId,direction:{x:Math.round(command.x??0),y:0,z:Math.round(command.z??0)},speedQ:Math.round(command.speedQ??1000000)};if(command.type==='jump')return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'jump-character',characterId:player.characterId};return {id:`network:${input.playerId}:${input.inputSequence}`,tick,type:'apply-impulse',bodyId:player.bodyId,impulse:{x:Math.round(command.x??0),y:Math.round(command.y??0),z:Math.round(command.z??0)}};}
  advanceTick(){
    if(this.status!=='open')throw new Error('SESSION_NOT_OPEN');const tick=this.rsrWorld.tick+1,inputs=(this.pendingByTick.get(tick)??[]).sort((a,b)=>a.playerId.localeCompare(b.playerId)||a.inputSequence-b.inputSequence);this.pendingByTick.delete(tick);
    const previous=this.lastSnapshot,{snapshot}=this.rsrWorld.step(inputs.map(input=>this.toRsr(input,tick)));snapshot.previousRoot=previous.stateRoot;
    const snapshotPacket=makeSnapshotPacket(this.sessionId,snapshot,ZERO,'tick'),deltaPacket=makeDeltaPacket(this.sessionId,previous,snapshot,ZERO),receiptBase={format:FORMATS.receipt,sessionId:this.sessionId,tick,serverStateRoot:snapshot.stateRoot,acceptedInputRoot:hash(inputs),rejectedInputRoot:hash(this.rejections.filter(item=>item.serverTick===tick)),snapshotRoot:snapshotPacket.snapshotRoot,deltaRoot:deltaPacket.deltaRoot,previousTickRoot:this.previousTickRoot},receipt={...receiptBase,networkReceiptRoot:hash(receiptBase)};
    snapshotPacket.serverReceiptRoot=receipt.networkReceiptRoot;deltaPacket.serverReceiptRoot=receipt.networkReceiptRoot;this.previousTickRoot=receipt.networkReceiptRoot;this.receipts.push(receipt);this.deltas.set(tick,clone(deltaPacket));this.lastSnapshot=clone(snapshot);
    const acks=inputs.map(input=>({format:FORMATS.ack,sessionId:this.sessionId,playerId:input.playerId,inputSequence:input.inputSequence,serverTick:tick,stateRoot:snapshot.stateRoot,status:'accepted'}));return {tick,inputs,acks,snapshot:snapshotPacket,delta:deltaPacket,receipt,evidence:makeRfeEvidence('authoritative-tick',receipt)};
  }
  pullSnapshot(reason='manual'){return makeSnapshotPacket(this.sessionId,this.lastSnapshot,this.receipts.at(-1)?.networkReceiptRoot??ZERO,reason);}
  pullDelta(tick=this.rsrWorld.tick){return clone(this.deltas.get(tick)??makeDeltaPacket(this.sessionId,null,this.lastSnapshot,this.receipts.at(-1)?.networkReceiptRoot??ZERO));}
  health(){return {status:this.status==='open'?'healthy':'closed',runtime_id:'rncs.network',version:'0.1.0-alpha.1',protocol:'rncs.network-runtime.v0.1',sessionId:this.sessionId,tick:this.rsrWorld.tick,players:this.players.size,stateRoot:this.lastSnapshot.stateRoot,authoritativeWorldInstances:1,rejections:this.rejections.length,receipts:this.receipts.length};}
}
