import {clone} from './protocol.mjs';

export class SnapshotInterpolator {
  constructor({interpolationDelay=2,maximumPredictionWindow=4,errorThreshold=500}={}) {
    this.interpolationDelay=interpolationDelay;
    this.maximumPredictionWindow=maximumPredictionWindow;
    this.errorThreshold=errorThreshold;
    this.buffers=new Map();
  }
  push(packet) {
    for (const object of packet.objects??[]) {
      const samples=this.buffers.get(object.objectId)??[];
      samples.push({tick:packet.tick,object:clone(object)});
      samples.sort((a,b)=>a.tick-b.tick);
      while(samples.length>32) samples.shift();
      this.buffers.set(object.objectId,samples);
    }
  }
  sample(objectId,serverTick) {
    const samples=this.buffers.get(objectId)??[];
    if(!samples.length) return null;
    const target=serverTick-this.interpolationDelay;
    const chosen=[...samples].reverse().find(sample=>sample.tick<=target)??samples[0];
    return {...clone(chosen.object),mode:'buffered',sampleTick:chosen.tick};
  }
}
