import {spatial} from '@taowind/reality-simulation-runtime';
import {clone, hash, FORMATS, makeCorrectionReceipt} from './protocol.mjs';
import {SnapshotInterpolator} from './interpolation.mjs';

export class ClientPredictionRuntime {
  static async create({player,delegation,initialSnapshot}) {
    const {SpatialEmbodimentWorld}=await spatial();
    const instance=new ClientPredictionRuntime({player,delegation,World:SpatialEmbodimentWorld});
    instance.applyFullSnapshot(initialSnapshot);
    return instance;
  }
  constructor({player,delegation,World}) {
    this.player=clone(player);this.delegation=clone(delegation);this.World=World;
    this._world=null;this.cachedSnapshot=null;this.nextSequence=1;this.unacknowledged=[];
    this.predictionSnapshots=[];this.lastConfirmed=null;this.predictionRootHistory=[];this.corrections=[];
    this.rollbackCount=0;this.replayCount=0;this.lastRejection=null;this.interpolator=new SnapshotInterpolator();this.connected=true;
  }
  get world(){if(!this._world){const snapshot=this.cachedSnapshot??this.lastConfirmed?.rsrSnapshot;if(!snapshot)throw new Error('CLIENT_SNAPSHOT_MISSING');this._world=this.World.fromSnapshot(snapshot);}return this._world;}
  set world(value){this._world=value;}
  currentSnapshot(){return this._world?this._world.snapshot():clone(this.cachedSnapshot??this.lastConfirmed?.rsrSnapshot);}
  applyFullSnapshot(packet){
    this.lastConfirmed=clone(packet);this.cachedSnapshot=clone(packet.rsrSnapshot);this._world=null;
    this.predictionSnapshots=[clone(packet.rsrSnapshot)];this.predictionRootHistory=[{tick:packet.tick,root:packet.stateRoot}];
    this.interpolator.push(packet);return clone(packet.rsrSnapshot);
  }
  commandToRsr(command,tick,sequence){
    if(command.type==='move')return {id:`client:${this.player.playerId}:${sequence}`,tick,type:'move-character',characterId:this.player.characterId,direction:{x:Math.round(command.x??0),y:0,z:Math.round(command.z??0)},speedQ:Math.round(command.speedQ??1000000)};
    if(command.type==='jump')return {id:`client:${this.player.playerId}:${sequence}`,tick,type:'jump-character',characterId:this.player.characterId};
    if(command.type==='impulse')return {id:`client:${this.player.playerId}:${sequence}`,tick,type:'apply-impulse',bodyId:this.player.bodyId,impulse:{x:Math.round(command.x??0),y:Math.round(command.y??0),z:Math.round(command.z??0)}};
    throw new Error('ACTION_NOT_ALLOWED');
  }
  createInput(command,{targetServerTick=this.currentSnapshot().tick+1}={}){
    const world=this.world,sequence=this.nextSequence++,clientTick=world.tick,clientPredictionRoot=world.snapshot().stateRoot;
    const input={format:FORMATS.input,protocol:'rncs.network-runtime.v0.1',subjectId:this.player.subjectId,playerId:this.player.playerId,sessionId:this.player.sessionId,inputSequence:sequence,clientTick,targetServerTick,command:clone(command),authorizationRoot:this.delegation.delegation_root,clientPredictionRoot};
    const result=world.step([this.commandToRsr(command,world.tick+1,sequence)]).snapshot;
    this.cachedSnapshot=null;this.unacknowledged.push({input:clone(input),lastSentTransportTick:-1});
    this.predictionSnapshots.push(clone(result));this.predictionRootHistory.push({tick:result.tick,root:result.stateRoot});return input;
  }
  markSent(sequence,transportTick){const item=this.unacknowledged.find(x=>x.input.inputSequence===sequence);if(item)item.lastSentTransportTick=transportTick;}
  dueForResend(transportTick,interval=3){return this.unacknowledged.filter(x=>x.lastSentTransportTick<0||transportTick-x.lastSentTransportTick>=interval).map(x=>clone(x.input));}
  receiveRejection(receipt){this.lastRejection=clone(receipt);this.unacknowledged=this.unacknowledged.filter(x=>x.input.inputSequence!==receipt.inputSequence);}
  receiveDelta(packet){
    this.interpolator.push(packet);if(!this.lastConfirmed?.rsrSnapshot)return null;
    const snapshot=clone(this.lastConfirmed.rsrSnapshot),changed=new Map((packet.changedBodies??[]).map(body=>[body.id,body]));
    snapshot.tick=packet.tick;snapshot.bodies=snapshot.bodies.map(body=>changed.has(body.id)?clone(changed.get(body.id)):body);
    snapshot.characters=clone(packet.characters??snapshot.characters);snapshot.joints=clone(packet.joints??snapshot.joints);snapshot.listeners=clone(packet.listeners??snapshot.listeners);snapshot.contacts=clone(packet.contacts??[]);snapshot.events=clone(packet.worldEvents??[]);snapshot.diagnostics=clone(packet.diagnostics??snapshot.diagnostics);
    if(packet.roots)Object.assign(snapshot,clone(packet.roots));snapshot.stateRoot=packet.stateRoot;snapshot.previousRoot=packet.previousRoot;
    const full={format:FORMATS.snapshot,protocol:'rncs.network-runtime.v0.1',sessionId:this.player.sessionId,reason:'delta-reconstruction',tick:packet.tick,worldId:snapshot.worldId,objects:packet.objects??[],worldEvents:packet.worldEvents??[],stateRoot:packet.stateRoot,previousRoot:packet.previousRoot,serverReceiptRoot:packet.serverReceiptRoot,rsrSnapshot:snapshot};
    this.lastConfirmed=clone(full);
    if(this.unacknowledged.length===0){this._world=null;this.cachedSnapshot=clone(snapshot);this.predictionSnapshots.push(clone(snapshot));this.predictionRootHistory.push({tick:snapshot.tick,root:snapshot.stateRoot});return clone(snapshot);}
    this._world=this.World.fromSnapshot(snapshot);this.cachedSnapshot=null;
    for(const item of this.unacknowledged.sort((a,b)=>a.input.inputSequence-b.input.inputSequence)){const tick=this._world.tick+1;this._world.step([this.commandToRsr(item.input.command,tick,item.input.inputSequence)]);}
    const result=this._world.snapshot();this.predictionSnapshots.push(clone(result));this.predictionRootHistory.push({tick:result.tick,root:result.stateRoot});return result;
  }
  receiveAck(ack,snapshotPacket){
    const before=this.currentSnapshot().stateRoot;this.unacknowledged=this.unacknowledged.filter(x=>x.input.inputSequence>ack.inputSequence);this.lastConfirmed=clone(snapshotPacket);
    const replayed=[];let after;
    if(this.unacknowledged.length===0){if(this._world&&this._world.tick===snapshotPacket.tick&&before===snapshotPacket.stateRoot){this.cachedSnapshot=null;after=before;}else{this._world=null;this.cachedSnapshot=clone(snapshotPacket.rsrSnapshot);after=snapshotPacket.stateRoot;}}
    else {this._world=this.World.fromSnapshot(snapshotPacket.rsrSnapshot);this.cachedSnapshot=null;for(const item of this.unacknowledged.sort((a,b)=>a.input.inputSequence-b.input.inputSequence)){const tick=this._world.tick+1;this._world.step([this.commandToRsr(item.input.command,tick,item.input.inputSequence)]);replayed.push(item.input.inputSequence);this.replayCount++;}after=this._world.snapshot().stateRoot;}
    const mismatch=before!==snapshotPacket.stateRoot;let correction=null;if(mismatch){this.rollbackCount++;correction=makeCorrectionReceipt({sessionId:this.player.sessionId,playerId:this.player.playerId,serverTick:ack.serverTick,beforeRoot:before,authorityRoot:snapshotPacket.stateRoot,replayedSequences:replayed,afterRoot:after,reason:'authoritative-ack-mismatch'});this.corrections.push(correction);}
    const current=this.currentSnapshot();this.predictionSnapshots.push(clone(current));this.predictionRootHistory.push({tick:current.tick,root:after});return {converged:this.unacknowledged.length===0&&after===snapshotPacket.stateRoot,correction,afterRoot:after};
  }
  forcePredictionError(offset=1234){const snap=this.world.snapshot();const body=snap.bodies.find(b=>b.id===this.player.bodyId);body.position.x+=offset;this._world=this.World.fromSnapshot({...snap,stateRoot:hash({...snap,stateRoot:undefined})});this.cachedSnapshot=null;return this._world.snapshot().stateRoot;}
  reconcile(snapshotPacket){
    const before=this.currentSnapshot().stateRoot,replayed=[];this.lastConfirmed=clone(snapshotPacket);
    if(this.unacknowledged.length===0){this._world=null;this.cachedSnapshot=clone(snapshotPacket.rsrSnapshot);}
    else {this._world=this.World.fromSnapshot(snapshotPacket.rsrSnapshot);this.cachedSnapshot=null;for(const item of this.unacknowledged){const tick=this._world.tick+1;this._world.step([this.commandToRsr(item.input.command,tick,item.input.inputSequence)]);replayed.push(item.input.inputSequence);}}
    const after=this.currentSnapshot().stateRoot;if(before===after)return null;this.rollbackCount++;const receipt=makeCorrectionReceipt({sessionId:this.player.sessionId,playerId:this.player.playerId,serverTick:snapshotPacket.tick,beforeRoot:before,authorityRoot:snapshotPacket.stateRoot,replayedSequences:replayed,afterRoot:after,reason:'manual-reconcile'});this.corrections.push(receipt);return receipt;
  }
  metrics(serverRoot){const snapshot=this.currentSnapshot(),root=snapshot.stateRoot;return {clientTick:snapshot.tick,unacknowledgedInputs:this.unacknowledged.length,predictionError:root===serverRoot?0:1,rollbackCount:this.rollbackCount,replayCount:this.replayCount,clientStateRoot:root,syncStatus:root===serverRoot&&this.unacknowledged.length===0?'synchronized':'predicting',lastRejection:this.lastRejection?.code??null};}
}
