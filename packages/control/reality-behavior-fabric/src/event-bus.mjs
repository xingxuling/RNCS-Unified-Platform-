import {clone} from './canonical.mjs';
const PHASE={input:0,pre:10,simulation:20,post:30,evidence:40};
export class DeterministicEventBus{
  constructor(){this.queue=[];this.scheduled=[];this.sequence=0;}
  emit(type,payload={},options={}){const e={event_id:options.event_id??`event:${this.sequence+1}`,type,payload:clone(payload),phase:options.phase??'simulation',priority:Number(options.priority??0),source:options.source??'runtime',target:options.target??null,sequence:++this.sequence};this.queue.push(e);return e;}
  schedule(tick,type,payload={},options={}){const e={tick:Number(tick),type,payload:clone(payload),options:clone(options),sequence:++this.sequence};this.scheduled.push(e);this.scheduled.sort((a,b)=>a.tick-b.tick||a.sequence-b.sequence);return e;}
  activateScheduled(tick){const ready=[];while(this.scheduled.length&&this.scheduled[0].tick<=tick)ready.push(this.scheduled.shift());for(const s of ready)this.emit(s.type,s.payload,s.options);return ready.length;}
  drain(){const out=this.queue.splice(0);out.sort((a,b)=>(PHASE[a.phase]??20)-(PHASE[b.phase]??20)||b.priority-a.priority||a.sequence-b.sequence);return out;}
  snapshot(){return{queue:clone(this.queue),scheduled:clone(this.scheduled),sequence:this.sequence};}
  restore(s){this.queue=clone(s?.queue??[]);this.scheduled=clone(s?.scheduled??[]);this.sequence=Number(s?.sequence??0);}
}
