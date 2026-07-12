import {seal,rootHash,clone,StudioError} from './canonical.mjs';

export const TILEMAP_FORMAT='reality-studio.tilemap.v1.1';
export const TILEMAP_VERSION='1.1.0-alpha.1';
export const NAVIGATION_FORMAT='reality-studio.navigation-grid.v1.1';
const deep=v=>structuredClone(v);
const idx=(x,y,w)=>y*w+x;
const inBounds=(x,y,w,h)=>x>=0&&y>=0&&x<w&&y<h;
const key=(x,y)=>`${x},${y}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createDefaultTileset({cellSize=16}={}){
  return seal({
    format:'reality-studio.tileset.v1.1',tileset_id:'tileset:frost-foundation',name:'寒霜地基',tile_width:cellSize,tile_height:cellSize,
    tiles:{
      '0':{tile_id:0,name:'空',color:'#00000000',walkable:true,cost:10,solid:false,tags:['empty']},
      '1':{tile_id:1,name:'冰石地面',color:'#17324cff',walkable:true,cost:10,solid:false,tags:['ground']},
      '2':{tile_id:2,name:'寒霜墙',color:'#315c7aff',walkable:false,cost:9999,solid:true,tags:['wall','navigation-blocker']},
      '3':{tile_id:3,name:'薄冰',color:'#3b82f688',walkable:true,cost:18,solid:false,tags:['ice','slow']},
      '4':{tile_id:4,name:'目标地砖',color:'#22d3ee88',walkable:true,cost:8,solid:false,tags:['goal','emissive']},
      '5':{tile_id:5,name:'危险裂隙',color:'#7c3aedaa',walkable:true,cost:40,solid:false,tags:['hazard']}
    }
  },'tileset_root');
}

export function createTileMap({tilemapId='tilemap:main',name='主地图',width=40,height=22,cellSize=16,origin={x:0,y:8},tileset=null}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw new StudioError('TILEMAP_SIZE_INVALID');
  const count=width*height,base=new Array(count).fill(0),collision=new Array(count).fill(0),navigation=new Array(count).fill(0),visual=new Array(count).fill(0);
  return seal({
    format:TILEMAP_FORMAT,version:TILEMAP_VERSION,tilemap_id:tilemapId,name,width,height,cell_size:cellSize,origin:{x:Math.round(origin.x??0),y:Math.round(origin.y??0)},
    tileset:tileset?deep(tileset):createDefaultTileset({cellSize}),
    layers:[
      {layer_id:'layer:ground',name:'地面',kind:'visual',z_index:-120,visible:true,opacity_milli:1000,cells:base},
      {layer_id:'layer:terrain',name:'地形',kind:'visual',z_index:-110,visible:true,opacity_milli:1000,cells:visual},
      {layer_id:'layer:collision',name:'碰撞',kind:'collision',z_index:-100,visible:true,opacity_milli:500,cells:collision},
      {layer_id:'layer:navigation',name:'导航代价',kind:'navigation',z_index:-90,visible:true,opacity_milli:500,cells:navigation}
    ],
    metadata:{authoring_mode:'grid',coordinate_system:'top-left',cell_order:'row-major'}
  },'tilemap_root');
}

export function cloneTileMap(tilemap){const out=deep(tilemap);delete out.tilemap_root;return seal(out,'tilemap_root');}
export function layerById(tilemap,layerId){return tilemap.layers?.find(l=>l.layer_id===layerId)||null;}
export function layerByKind(tilemap,kind){return tilemap.layers?.find(l=>l.kind===kind)||null;}

export function validateTileMap(tilemap){
  const errors=[],warnings=[];
  const need=(c,code,path)=>{if(!c)errors.push({code,path});};
  need(tilemap?.format===TILEMAP_FORMAT,'TILEMAP_FORMAT_INVALID','format');
  need(tilemap?.version===TILEMAP_VERSION,'TILEMAP_VERSION_INVALID','version');
  need(Number.isInteger(tilemap?.width)&&tilemap.width>0,'TILEMAP_WIDTH_INVALID','width');
  need(Number.isInteger(tilemap?.height)&&tilemap.height>0,'TILEMAP_HEIGHT_INVALID','height');
  need(Number.isInteger(tilemap?.cell_size)&&tilemap.cell_size>0,'TILEMAP_CELL_SIZE_INVALID','cell_size');
  const count=(tilemap?.width??0)*(tilemap?.height??0),ids=new Set();
  for(const l of tilemap?.layers??[]){
    if(ids.has(l.layer_id))errors.push({code:'TILEMAP_LAYER_DUPLICATE',path:l.layer_id});ids.add(l.layer_id);
    if(!Array.isArray(l.cells)||l.cells.length!==count)errors.push({code:'TILEMAP_LAYER_CELL_COUNT_INVALID',path:l.layer_id,expected:count,actual:l.cells?.length});
    for(const t of l.cells??[])if(!Object.prototype.hasOwnProperty.call(tilemap.tileset?.tiles??{},String(t)))warnings.push({code:'TILEMAP_TILE_UNRESOLVED',path:l.layer_id,tile_id:t});
  }
  for(const required of ['visual','collision','navigation'])if(!(tilemap?.layers??[]).some(l=>l.kind===required))warnings.push({code:'TILEMAP_LAYER_KIND_MISSING',kind:required});
  return{valid:errors.length===0,errors,warnings};
}

function mutable(tilemap){const out=deep(tilemap);delete out.tilemap_root;return out;}
export function setTile(tilemap,{layerId,x,y,tileId}={}){
  const out=mutable(tilemap),l=layerById(out,layerId);if(!l)throw new StudioError('TILEMAP_LAYER_NOT_FOUND',layerId);
  if(!inBounds(x,y,out.width,out.height))throw new StudioError('TILEMAP_CELL_OUT_OF_BOUNDS',`${x},${y}`);
  if(!Object.prototype.hasOwnProperty.call(out.tileset.tiles,String(tileId)))throw new StudioError('TILEMAP_TILE_NOT_FOUND',String(tileId));
  l.cells[idx(x,y,out.width)]=tileId;return seal(out,'tilemap_root');
}
export function paintTiles(tilemap,{layerId,cells=[],tileId}={}){
  let out=mutable(tilemap),l=layerById(out,layerId);if(!l)throw new StudioError('TILEMAP_LAYER_NOT_FOUND',layerId);
  if(!Object.prototype.hasOwnProperty.call(out.tileset.tiles,String(tileId)))throw new StudioError('TILEMAP_TILE_NOT_FOUND',String(tileId));
  for(const c of cells){const x=Math.round(c.x),y=Math.round(c.y);if(inBounds(x,y,out.width,out.height))l.cells[idx(x,y,out.width)]=tileId;}
  return seal(out,'tilemap_root');
}
export function paintRect(tilemap,{layerId,x0,y0,x1,y1,tileId}={}){
  const cells=[];for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)cells.push({x,y});return paintTiles(tilemap,{layerId,cells,tileId});
}
export function floodFill(tilemap,{layerId,x,y,tileId}={}){
  if(!inBounds(x,y,tilemap.width,tilemap.height))throw new StudioError('TILEMAP_CELL_OUT_OF_BOUNDS',`${x},${y}`);
  const out=mutable(tilemap),l=layerById(out,layerId);if(!l)throw new StudioError('TILEMAP_LAYER_NOT_FOUND',layerId);
  const from=l.cells[idx(x,y,out.width)];if(from===tileId)return seal(out,'tilemap_root');
  const q=[[x,y]],seen=new Set([key(x,y)]);while(q.length){const [cx,cy]=q.shift();if(l.cells[idx(cx,cy,out.width)]!==from)continue;l.cells[idx(cx,cy,out.width)]=tileId;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,k=key(nx,ny);if(inBounds(nx,ny,out.width,out.height)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
  return seal(out,'tilemap_root');
}

export function generateFrostTrialTileMap(){
  let t=createTileMap();
  t=paintRect(t,{layerId:'layer:ground',x0:0,y0:0,x1:t.width-1,y1:t.height-1,tileId:1});
  t=paintRect(t,{layerId:'layer:terrain',x0:0,y0:0,x1:t.width-1,y1:0,tileId:2});
  t=paintRect(t,{layerId:'layer:terrain',x0:0,y0:t.height-1,x1:t.width-1,y1:t.height-1,tileId:2});
  t=paintRect(t,{layerId:'layer:terrain',x0:0,y0:0,x1:0,y1:t.height-1,tileId:2});
  t=paintRect(t,{layerId:'layer:terrain',x0:t.width-1,y0:0,x1:t.width-1,y1:t.height-1,tileId:2});
  // Central ruins with two deterministic gates.
  t=paintRect(t,{layerId:'layer:terrain',x0:13,y0:6,x1:13,y1:18,tileId:2});
  t=paintRect(t,{layerId:'layer:terrain',x0:25,y0:3,x1:25,y1:15,tileId:2});
  t=paintRect(t,{layerId:'layer:terrain',x0:13,y0:10,x1:13,y1:12,tileId:1});
  t=paintRect(t,{layerId:'layer:terrain',x0:25,y0:7,x1:25,y1:9,tileId:1});
  t=paintRect(t,{layerId:'layer:terrain',x0:4,y0:15,x1:11,y1:18,tileId:3});
  t=paintRect(t,{layerId:'layer:terrain',x0:29,y0:4,x1:36,y1:7,tileId:5});
  t=paintRect(t,{layerId:'layer:terrain',x0:35,y0:17,x1:37,y1:19,tileId:4});
  const terrain=layerById(t,'layer:terrain'),collision=layerById(t,'layer:collision'),navigation=layerById(t,'layer:navigation');
  const raw=mutable(t),rt=layerById(raw,'layer:terrain'),rc=layerById(raw,'layer:collision'),rn=layerById(raw,'layer:navigation');
  for(let i=0;i<rt.cells.length;i++){const def=raw.tileset.tiles[String(rt.cells[i])];rc.cells[i]=def?.solid?2:0;rn.cells[i]=rt.cells[i];}
  return seal(raw,'tilemap_root');
}

function greedyRects(cells,width,height,predicate){
  const used=new Uint8Array(width*height),out=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=idx(x,y,width);if(used[i]||!predicate(cells[i],x,y))continue;
    const tileId=cells[i];let w=1;while(x+w<width&&!used[idx(x+w,y,width)]&&cells[idx(x+w,y,width)]===tileId&&predicate(tileId,x+w,y))w++;
    let h=1,ok=true;while(y+h<height&&ok){for(let xx=x;xx<x+w;xx++)if(used[idx(xx,y+h,width)]||cells[idx(xx,y+h,width)]!==tileId||!predicate(tileId,xx,y+h)){ok=false;break;}if(ok)h++;}
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)used[idx(xx,yy,width)]=1;
    out.push({x,y,width:w,height:h,tile_id:tileId});
  }
  return out;
}

export function compileTileMapProjection(tilemap,{includeKinds=['visual']}={}){
  const rects=[];
  for(const layer of tilemap.layers??[]){
    if(!layer.visible||!includeKinds.includes(layer.kind))continue;
    for(const r of greedyRects(layer.cells,tilemap.width,tilemap.height,t=>t!==0)){
      const def=tilemap.tileset.tiles[String(r.tile_id)]??tilemap.tileset.tiles['0'];
      rects.push({rect_id:`${layer.layer_id}:${r.x}:${r.y}:${r.width}:${r.height}`,layer_id:layer.layer_id,kind:layer.kind,z_index:layer.z_index,tile_id:r.tile_id,color:def.color,tags:deep(def.tags??[]),x:tilemap.origin.x+r.x*tilemap.cell_size,y:tilemap.origin.y+r.y*tilemap.cell_size,width:r.width*tilemap.cell_size,height:r.height*tilemap.cell_size});
    }
  }
  return seal({format:'reality-studio.tilemap-projection.v1.1',tilemap_id:tilemap.tilemap_id,tilemap_root:tilemap.tilemap_root,cell_size:tilemap.cell_size,rects},'projection_root');
}

export function compileCollisionShapes(tilemap){
  const layer=layerByKind(tilemap,'collision')??layerByKind(tilemap,'visual');
  const rects=greedyRects(layer.cells,tilemap.width,tilemap.height,t=>Boolean(tilemap.tileset.tiles[String(t)]?.solid));
  return seal({format:'reality-studio.tilemap-collision.v1.1',tilemap_id:tilemap.tilemap_id,shapes:rects.map((r,i)=>({shape_id:`shape:${i}`,kind:'box',x:tilemap.origin.x+r.x*tilemap.cell_size,y:tilemap.origin.y+r.y*tilemap.cell_size,width:r.width*tilemap.cell_size,height:r.height*tilemap.cell_size,tile_id:r.tile_id}))},'collision_root');
}

function nodeBounds(node,position=null){
  const x=position?.x??node.transform?.x??0,y=position?.y??node.transform?.y??0,c=node.components?.collider;
  if(!c)return{x:x-8,y:y-8,width:16,height:16};
  if(c.kind==='box')return{x:x-(c.width??16)/2,y:y-(c.height??16),width:c.width??16,height:c.height??16};
  if(c.kind==='capsule')return{x:x-(c.radius??8),y:y-(c.height??24),width:(c.radius??8)*2,height:c.height??24};
  return{x:x-8,y:y-8,width:16,height:16};
}

export function compileNavigationGrid(tilemap,{dynamicObstacles=[],allowDiagonal=false}={}){
  const layer=layerByKind(tilemap,'navigation')??layerByKind(tilemap,'visual');
  const walkable=new Array(tilemap.width*tilemap.height).fill(1),costs=new Array(tilemap.width*tilemap.height).fill(10),blockedBy=[];
  for(let y=0;y<tilemap.height;y++)for(let x=0;x<tilemap.width;x++){
    const t=layer.cells[idx(x,y,tilemap.width)],def=tilemap.tileset.tiles[String(t)]??tilemap.tileset.tiles['0'];walkable[idx(x,y,tilemap.width)]=def.walkable&&!def.solid?1:0;costs[idx(x,y,tilemap.width)]=Math.max(1,Math.round(def.cost??10));
  }
  for(const o of dynamicObstacles){
    const b=o.bounds??o,c0=worldToCell(tilemap,b.x,b.y),c1=worldToCell(tilemap,b.x+b.width-1,b.y+b.height-1);let count=0;
    for(let y=clamp(c0.y,0,tilemap.height-1);y<=clamp(c1.y,0,tilemap.height-1);y++)for(let x=clamp(c0.x,0,tilemap.width-1);x<=clamp(c1.x,0,tilemap.width-1);x++){walkable[idx(x,y,tilemap.width)]=0;count++;}
    blockedBy.push({obstacle_id:o.obstacle_id??o.node_id??`obstacle:${blockedBy.length}`,cells:count});
  }
  return seal({format:NAVIGATION_FORMAT,version:TILEMAP_VERSION,tilemap_id:tilemap.tilemap_id,tilemap_root:tilemap.tilemap_root,width:tilemap.width,height:tilemap.height,cell_size:tilemap.cell_size,origin:deep(tilemap.origin),allow_diagonal:allowDiagonal,walkable,costs,dynamic_obstacles:blockedBy},'navigation_root');
}

export function worldToCell(tilemap,x,y){return{x:Math.floor((x-tilemap.origin.x)/tilemap.cell_size),y:Math.floor((y-tilemap.origin.y)/tilemap.cell_size)};}
export function cellToWorld(tilemap,x,y,{center=true}={}){return{x:tilemap.origin.x+x*tilemap.cell_size+(center?Math.floor(tilemap.cell_size/2):0),y:tilemap.origin.y+y*tilemap.cell_size+(center?Math.floor(tilemap.cell_size/2):0)};}

function nearestWalkable(grid,start){
  if(inBounds(start.x,start.y,grid.width,grid.height)&&grid.walkable[idx(start.x,start.y,grid.width)])return start;
  const q=[start],seen=new Set([key(start.x,start.y)]);while(q.length){const p=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=key(n.x,n.y);if(!inBounds(n.x,n.y,grid.width,grid.height)||seen.has(k))continue;if(grid.walkable[idx(n.x,n.y,grid.width)])return n;seen.add(k);q.push(n);}}
  return null;
}

export function findPath(grid,start,end,{allowDiagonal=grid.allow_diagonal,maxVisited=200000}={}){
  const s=nearestWalkable(grid,start),g=nearestWalkable(grid,end);if(!s||!g)return seal({format:'reality-studio.navigation-path.v1.1',status:'unreachable',start,end,cells:[],cost:0,visited:0,navigation_root:grid.navigation_root},'path_root');
  const dirs=allowDiagonal?[[1,0,10],[-1,0,10],[0,1,10],[0,-1,10],[1,1,14],[1,-1,14],[-1,1,14],[-1,-1,14]]:[[1,0,10],[-1,0,10],[0,1,10],[0,-1,10]];
  const open=[{x:s.x,y:s.y,g:0,h:(Math.abs(g.x-s.x)+Math.abs(g.y-s.y))*10,f:0}],best=new Map([[key(s.x,s.y),0]]),came=new Map();open[0].f=open[0].h;let visited=0,found=null;
  while(open.length&&visited<maxVisited){open.sort((a,b)=>a.f-b.f||a.h-b.h||a.y-b.y||a.x-b.x);const cur=open.shift(),ck=key(cur.x,cur.y);if(cur.g!==best.get(ck))continue;visited++;if(cur.x===g.x&&cur.y===g.y){found=cur;break;}
    for(const [dx,dy,m] of dirs){const nx=cur.x+dx,ny=cur.y+dy;if(!inBounds(nx,ny,grid.width,grid.height)||!grid.walkable[idx(nx,ny,grid.width)])continue;if(dx&&dy){if(!grid.walkable[idx(cur.x+dx,cur.y,grid.width)]||!grid.walkable[idx(cur.x,cur.y+dy,grid.width)])continue;}
      const nk=key(nx,ny),ng=cur.g+m*grid.costs[idx(nx,ny,grid.width)];if(ng>=(best.get(nk)??Infinity))continue;best.set(nk,ng);came.set(nk,ck);const h=(Math.abs(g.x-nx)+Math.abs(g.y-ny))*10;open.push({x:nx,y:ny,g:ng,h,f:ng+h});
    }
  }
  if(!found)return seal({format:'reality-studio.navigation-path.v1.1',status:'unreachable',start:s,end:g,cells:[],cost:0,visited,navigation_root:grid.navigation_root},'path_root');
  const cells=[];let k=key(g.x,g.y);while(k){const [x,y]=k.split(',').map(Number);cells.push({x,y});if(k===key(s.x,s.y))break;k=came.get(k);}cells.reverse();
  return seal({format:'reality-studio.navigation-path.v1.1',status:'ok',start:s,end:g,cells,cost:found.g,visited,navigation_root:grid.navigation_root},'path_root');
}

function lineWalkable(grid,a,b){
  let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;
  while(true){if(!inBounds(x0,y0,grid.width,grid.height)||!grid.walkable[idx(x0,y0,grid.width)])return false;if(x0===x1&&y0===y1)return true;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
}
export function smoothPath(grid,path){
  if(path.status!=='ok'||path.cells.length<3)return path;const cells=[path.cells[0]];let i=0;while(i<path.cells.length-1){let j=path.cells.length-1;while(j>i+1&&!lineWalkable(grid,path.cells[i],path.cells[j]))j--;cells.push(path.cells[j]);i=j;}
  const out=deep(path);delete out.path_root;out.cells=cells;out.smoothed=true;out.original_cell_count=path.cells.length;return seal(out,'path_root');
}

export function collectDynamicObstacles(scene,{positions={},excludeNodeIds=[]}={}){
  const excluded=new Set(excludeNodeIds),out=[];for(const n of scene.nodes??[]){if(excluded.has(n.node_id)||n.visible===false)continue;const tags=n.components?.tags??[],explicit=n.components?.navigation_obstacle;if(explicit===false)continue;if(!explicit&&!tags.includes('navigation-obstacle')&&!n.components?.collider)continue;out.push({node_id:n.node_id,obstacle_id:`node:${n.node_id}`,bounds:nodeBounds(n,positions[n.node_id])});}return out;
}

export function compileSceneNavigation(scene,{positions={},excludeNodeIds=[],allowDiagonal=false}={}){
  const tilemap=scene.tilemaps?.[0];if(!tilemap)throw new StudioError('SCENE_TILEMAP_REQUIRED');const dynamic=collectDynamicObstacles(scene,{positions,excludeNodeIds});const grid=compileNavigationGrid(tilemap,{dynamicObstacles:dynamic,allowDiagonal});const collision=compileCollisionShapes(tilemap);return{tilemap,grid,collision,dynamic};
}

export function pathWorldPoints(tilemap,path){return(path.cells??[]).map(c=>cellToWorld(tilemap,c.x,c.y));}

export function navigationReceipt({sceneId,tilemap,grid,paths=[],agents=[]}={}){
  return seal({format:'reality-studio.navigation-receipt.v1.1',version:TILEMAP_VERSION,scene_id:sceneId,tilemap_id:tilemap.tilemap_id,tilemap_root:tilemap.tilemap_root,navigation_root:grid.navigation_root,paths:paths.map(p=>({path_root:p.path_root,status:p.status,cells:p.cells.length,cost:p.cost,visited:p.visited})),agents:deep(agents)},'receipt_root');
}
