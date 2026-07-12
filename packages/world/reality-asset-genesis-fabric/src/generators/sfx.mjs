import {seededRandom,rootHash} from '../canonical.mjs';
function wavHeader(samples,rate,channels=1){const dataBytes=samples*channels*2,b=Buffer.alloc(44);b.write('RIFF',0);b.writeUInt32LE(36+dataBytes,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels*2,28);b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(dataBytes,40);return b;}
export function generateSfx({genome,variant}){
  const rate=22050,duration=Math.min(genome.budgets.audio_seconds,variant==='mobile'?.45:.75),samples=Math.floor(rate*duration),data=Buffer.alloc(samples*2),rnd=seededRandom(`${genome.seed}:${variant}:sfx`);
  for(let i=0;i<samples;i++){
    const t=i/rate,phase=t/duration,env=Math.sin(Math.PI*Math.min(1,phase))*Math.exp(-3*phase),freq=900-620*phase;
    const ice=Math.sin(2*Math.PI*freq*t)+.35*Math.sin(2*Math.PI*freq*2.03*t),noise=(rnd()*2-1)*Math.max(0,1-phase*1.4),v=Math.max(-1,Math.min(1,(ice*.38+noise*.22)*env));data.writeInt16LE(Math.round(v*32767),i*2);
  }
  const wav=Buffer.concat([wavHeader(samples,rate),data]);
  return{wav,metadata:{format:'reality-asset.audio.v0.1',asset_id:genome.identity.asset_id,variant,sample_rate:rate,channels:1,duration_seconds:samples/rate,audio_root:rootHash(wav.toString('base64'))}};
}
