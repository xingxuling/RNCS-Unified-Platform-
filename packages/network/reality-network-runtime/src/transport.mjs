import {clone, hash} from './protocol.mjs';

class DeterministicRandom {
  constructor(seed = 1) { this.state = (Number(seed) >>> 0) || 1; }
  next() { let x = this.state; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.state = x >>> 0; return this.state / 0x100000000; }
  int(min,max) { return min + Math.floor(this.next() * (max - min + 1)); }
}

export class NetworkConditionSimulator {
  constructor(options = {}) {
    this.options = {seed:1, fixedLatencyTicks:0, jitterTicks:0, lossRate:0, duplicateRate:0, reorderRate:0, bandwidthBytesPerTick:Infinity, burstLossEvery:0, burstLossLength:0, ...options};
    this.random = new DeterministicRandom(this.options.seed); this.disconnected = new Set(); this.packetCounter = 0;
  }
  setOptions(patch={}) { Object.assign(this.options, patch); }
  disconnect(endpoint) { this.disconnected.add(endpoint); }
  reconnect(endpoint) { this.disconnected.delete(endpoint); }
  plan(message, currentTick) {
    this.packetCounter++;
    if (this.disconnected.has(message.from) || this.disconnected.has(message.to)) return [];
    const inBurst = this.options.burstLossEvery > 0 && (this.packetCounter % this.options.burstLossEvery) < this.options.burstLossLength;
    if (inBurst || this.random.next() < this.options.lossRate) return [];
    const jitter = this.options.jitterTicks ? this.random.int(-this.options.jitterTicks, this.options.jitterTicks) : 0;
    let deliverTick = Math.max(currentTick, currentTick + this.options.fixedLatencyTicks + jitter);
    if (this.random.next() < this.options.reorderRate) deliverTick += this.random.int(1, Math.max(1,this.options.jitterTicks+2));
    const primary = {...clone(message), packetId:`packet:${this.packetCounter}:${hash(message).slice(0,12)}`, deliverTick};
    const packets = [primary];
    if (this.random.next() < this.options.duplicateRate) packets.push({...clone(primary), packetId:`${primary.packetId}:dup`, deliverTick:deliverTick + this.random.int(0,2)});
    return packets;
  }
}

export class LoopbackTransport {
  constructor(options={}) { this.condition = new NetworkConditionSimulator(options); this.tick = 0; this.queue = []; this.handlers = new Map(); this.stats = {sent:0,delivered:0,dropped:0,duplicated:0,bytes:0}; }
  register(endpoint, handler) { this.handlers.set(endpoint, handler); }
  send(from,to,type,payload) {
    const message = {from,to,type,payload:clone(payload),sentTick:this.tick};
    const planned = this.condition.plan(message,this.tick); this.stats.sent++;
    if (!planned.length) this.stats.dropped++;
    if (planned.length > 1) this.stats.duplicated += planned.length - 1;
    for (const packet of planned) { packet.bytes = Buffer.byteLength(JSON.stringify(packet)); this.queue.push(packet); this.stats.bytes += packet.bytes; }
  }
  advance(ticks=1) { for(let i=0;i<ticks;i++){ this.tick++; this.flush(); } }
  flush() {
    this.queue.sort((a,b)=>a.deliverTick-b.deliverTick || a.packetId.localeCompare(b.packetId));
    let budget = this.condition.options.bandwidthBytesPerTick;
    const remaining=[];
    for (const packet of this.queue) {
      if (packet.deliverTick > this.tick || packet.bytes > budget) { remaining.push(packet); continue; }
      budget -= packet.bytes; const handler=this.handlers.get(packet.to); if(handler){handler(clone(packet)); this.stats.delivered++;}
    }
    this.queue=remaining;
  }
  disconnect(endpoint){this.condition.disconnect(endpoint);} reconnect(endpoint){this.condition.reconnect(endpoint);}
  setConditions(patch){this.condition.setOptions(patch);} getStats(){return clone({...this.stats,queued:this.queue.length,tick:this.tick});}
}
