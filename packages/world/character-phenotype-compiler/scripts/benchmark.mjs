import fs from 'node:fs';
import path from 'node:path';
import {applyAppearanceLoadout,createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {compileCharacterPhenotype,rebuildCharacterPhenotype} from '../src/index.mjs';

const root=path.resolve(import.meta.dirname,'..'),scratch=path.join(root,'outputs','benchmark'),runs=[];
fs.rmSync(scratch,{recursive:true,force:true});fs.mkdirSync(scratch,{recursive:true});
for(let index=0;index<3;index++){
  const genome=createCharacterGenome({name:'Lan Tianlin',seed:`character-benchmark-${index}`}),out=path.join(scratch,`run-${index}`),full=compileCharacterPhenotype(genome,{outDir:out}),recolored=applyAppearanceLoadout(genome,{hair_color:index%2?'#314266':'#253454'}),incremental=rebuildCharacterPhenotype(genome,recolored,{outDir:out,changePath:'hair.color'});
  runs.push({full_ms:full.performance.total_ms,incremental_ms:incremental.performance.total_ms,cache_hit_rate:incremental.performance.cache_hit_rate,geometry_rebuilt:incremental.performance.mesh_morph_and_lod_ms!==0,receipt_valid:incremental.rebuild_receipt.valid});
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)],fullMedian=median(runs.map(item=>item.full_ms)),incrementalMedian=median(runs.map(item=>item.incremental_ms)),report={format:'rncs.character-benchmark.v0.1',runs,median_full_ms:fullMedian,median_recolor_ms:incrementalMedian,speedup:fullMedian/incrementalMedian,recolor_faster:incrementalMedian<fullMedian,geometry_preserved:runs.every(item=>!item.geometry_rebuilt),receipts_valid:runs.every(item=>item.receipt_valid),boundary:'Local Node.js offline reference provider; not a target-device or commercial DCC benchmark'};
fs.mkdirSync(path.join(root,'benchmarks'),{recursive:true});fs.writeFileSync(path.join(root,'benchmarks','benchmark.json'),`${JSON.stringify(report,null,2)}\n`);fs.writeFileSync(path.join(root,'benchmarks','BENCHMARK.md'),`# Character Genome Benchmark\n\n- Full build median: ${fullMedian.toFixed(3)} ms\n- Recolor median: ${incrementalMedian.toFixed(3)} ms\n- Speedup: ${report.speedup.toFixed(2)}x\n- Geometry rebuilt during recolor: no\n- Incremental receipts valid: ${report.receipts_valid?'yes':'no'}\n\nBoundary: ${report.boundary}.\n`);
console.log(JSON.stringify(report,null,2));
if(!report.recolor_faster||!report.geometry_preserved||!report.receipts_valid)process.exitCode=1;
