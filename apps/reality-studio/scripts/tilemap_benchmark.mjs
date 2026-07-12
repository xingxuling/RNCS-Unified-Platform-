import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {
  generateFrostTrialTileMap, validateTileMap, paintTiles, compileTileMapProjection,
  compileCollisionShapes, compileNavigationGrid, findPath, smoothPath, worldToCell
} from '../src/tilemap-navigation.mjs';
import {UnifiedManufacturingSession} from '../src/scene-studio.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sample=JSON.parse(fs.readFileSync(path.join(root,'examples/冰境试炼.unified-project.json'),'utf8'));
const rounds=(fn,n=25)=>{const a=[];for(let i=0;i<n;i++){const t=performance.now();fn();a.push(performance.now()-t);}a.sort((x,y)=>x-y);return{median_ms:+a[Math.floor(a.length/2)].toFixed(3),p95_ms:+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(3),min_ms:+a[0].toFixed(3),max_ms:+a.at(-1).toFixed(3),rounds:n};};

const map=generateFrostTrialTileMap();
const cells=Array.from({length:1000},(_,i)=>({x:(i*17)%map.width,y:(i*31)%map.height}));
const validate=rounds(()=>validateTileMap(map),100);
const paint=rounds(()=>paintTiles(map,{layerId:'layer:terrain',cells,tileId:3}),30);
const projection=rounds(()=>compileTileMapProjection(map,{includeKinds:['visual']}),60);
const collision=rounds(()=>compileCollisionShapes(map),60);
const navGrid=rounds(()=>compileNavigationGrid(map),60);
const grid=compileNavigationGrid(map);
const queries=Array.from({length:100},(_,i)=>({
  a:worldToCell(map,32+(i*37)%560,40+(i*19)%280),
  b:worldToCell(map,48+(i*53)%560,48+(i*29)%280)
}));
const path100=rounds(()=>{for(const q of queries)smoothPath(grid,findPath(grid,q.a,q.b));},20);
const session100=rounds(()=>{
  const s=new UnifiedManufacturingSession(sample);
  const ids=Object.keys(s.navigation.positions);
  const id=ids[0];
  if(id)s.setNavigationTarget({nodeId:id,x:568,y:280,speedMilli:3200});
  for(let i=0;i<100;i++){s.step({});s.behavior.runtime.paused=false;}
},12);
const cacheProbe=new UnifiedManufacturingSession(sample);
const navId=Object.keys(cacheProbe.navigation.positions)[0];
if(navId)cacheProbe.setNavigationTarget({nodeId:navId,x:568,y:280,speedMilli:3200});
for(let i=0;i<100;i++){cacheProbe.step({});cacheProbe.behavior.runtime.paused=false;}
const result={
  format:'reality-studio.tilemap-navigation-benchmark.v1.1',
  version:'1.1.0-alpha.1',
  environment:{node:process.version,platform:process.platform,arch:process.arch,threading:'single-thread-reference'},
  map:{width:map.width,height:map.height,cells:map.width*map.height,layers:map.layers.length,tilemap_root:map.tilemap_root},
  benchmarks:{validate,paint_1000_cells:paint,compile_projection:projection,compile_collision:collision,compile_navigation_grid:navGrid,pathfind_100_queries:path100,session_100_ticks_with_navigation:session100},
  cache_probe:{ticks:cacheProbe.behavior.runtime.state.tick,path_queries:cacheProbe.navigation.queries,path_cache_entries:Object.keys(cacheProbe.navigation.paths).length,agent_status:navId?cacheProbe.navigation.positions[navId]?.status:null},
  boundary:'These are Node.js single-thread reference timings. They are not Godot C++ engine timings and do not include GPU frame time.'
};
const evidence=path.join(root,'evidence');fs.mkdirSync(evidence,{recursive:true});
fs.writeFileSync(path.join(evidence,'TILEMAP_NAV_BENCHMARK_v1.1.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(evidence,'TILEMAP_NAV_BENCHMARK_OUTPUT_v1.1.txt'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
