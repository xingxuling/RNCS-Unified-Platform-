import {clean, clone, hash} from './protocol.mjs';
import {RealityTransportFabric} from '@taowind/reality-representation-fabric';

export function createLoopbackTransportProfile({profileId = 'network:loopback', evidenceRefs = []} = {}) {
  return {
    profile_id: String(profileId),
    transport_kind: 'RDN',
    qos_class: 'STATE_DELTA',
    coverage: 'LOCAL',
    bandwidth_mbps: 1000,
    latency_budget_ms: 0,
    reliability_ppm: 1000000,
    freshness_budget_ms: 500,
    priority: 50,
    loss_mode: 'RECOVERABLE',
    discovery_supported: false,
    roaming_supported: false,
    low_power: false,
    bidirectional: true,
    requires_authority: false,
    fallback_profile_ids: [],
    evidence_refs: [...new Set((Array.isArray(evidenceRefs) ? evidenceRefs : [evidenceRefs]).map(String).filter(Boolean))]
  };
}

function transportPacketType(type) {
  return {
    input: 'CONTROL',
    ack: 'ACK',
    rejection: 'NACK',
    delta: 'STATE_DELTA',
    snapshot: 'STATE_DELTA'
  }[String(type).toLowerCase()] ?? 'CONTROL';
}

function canonicalTransportValue(value) {
  if (Array.isArray(value)) return value.map(canonicalTransportValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, canonicalTransportValue(child)]));
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NETWORK_TRANSPORT_PAYLOAD_NONFINITE_NUMBER');
    return Number.isInteger(value) ? value : String(value);
  }
  return value;
}

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
  constructor(options={}) {
    const {transportProfile, transportNodeId, ...conditionOptions} = options;
    this.condition = new NetworkConditionSimulator(conditionOptions);
    this.tick = 0;
    this.queue = [];
    this.handlers = new Map();
    this.stats = {sent:0,delivered:0,dropped:0,duplicated:0,bytes:0};
    const profile = transportProfile === false
      ? null
      : transportProfile ?? createLoopbackTransportProfile();
    this.transportNodeId = String(transportNodeId ?? 'node:network-loopback');
    this.transportFabric = profile
      ? new RealityTransportFabric({nodeId: this.transportNodeId, profiles: [profile]})
      : null;
    this.transportProfile = this.transportFabric
      ? this.transportFabric.getProfile(profile.profile_id ?? profile.profile_root)
      : null;
  }
  register(endpoint, handler) { this.handlers.set(endpoint, handler); }
  send(from,to,type,payload) {
    const transportPayload = canonicalTransportValue(clean({from: String(from), to: String(to), type: String(type), payload: clone(payload)}));
    const transportPacket = this.transportFabric?.send({
      profileId: this.transportProfile.profile_root,
      packetType: transportPacketType(type),
      sourceNode: this.transportNodeId,
      targetNode: String(to),
      createdTick: this.tick,
      permissionScope: [`network:${String(type)}`],
      payload: transportPayload,
      worldMutation: false
    });
    const message = {
      from,
      to,
      type,
      payload: clone(payload),
      sentTick: this.tick,
      transport: transportPacket ? {
        packet_id: transportPacket.packet_id,
        packet_root: transportPacket.packet_root,
        packet_type: transportPacket.packet_type,
        profile_root: transportPacket.profile_root,
        source_node: transportPacket.source_node,
        target_node: transportPacket.target_node
      } : null
    };
    const planned = this.condition.plan(message,this.tick); this.stats.sent++;
    if (!planned.length) this.stats.dropped++;
    if (planned.length > 1) this.stats.duplicated += planned.length - 1;
    for (const packet of planned) { packet.bytes = Buffer.byteLength(JSON.stringify(packet)); this.queue.push(packet); this.stats.bytes += packet.bytes; }
  }
  advance(ticks=1) { for(let i=0;i<ticks;i++){ this.tick++; this.transportFabric?.advance(1); this.flush(); } }
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
  setConditions(patch){this.condition.setOptions(patch);}
  getTransportSnapshot(){return this.transportFabric?.verify() ?? null;}
  getTransportPacket(packetRoot){return this.transportFabric?.getPacket(packetRoot) ?? null;}
  getStats(){
    const transport = this.transportFabric ? this.getTransportSnapshot() : null;
    return clone({
      ...this.stats,
      queued: this.queue.length,
      tick: this.tick,
      transport: transport ? {
        node_id: transport.node_id,
        profile_root: this.transportProfile.profile_root,
        fabric_root: transport.fabric_root,
        packet_count: transport.packets.length,
        candidate_only: transport.candidate_only,
        authoritative: transport.authoritative,
        commit_status: transport.commit_status
      } : null
    });
  }
}
