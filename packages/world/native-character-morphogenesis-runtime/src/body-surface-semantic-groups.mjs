const set=values=>new Set(values);

export const BODY_SURFACE_GROUP_BONES=Object.freeze({
  head:set(['skull']),
  torso:set(['pelvis','spine','ribcage','clavicle-left','clavicle-right']),
  neck:set(['neck']),
  'arm-left':set(['shoulder-left','upper-arm-left','elbow-left','forearm-left','wrist-left']),
  'arm-right':set(['shoulder-right','upper-arm-right','elbow-right','forearm-right','wrist-right']),
  'hand-left':set(['hand-left']),
  'hand-right':set(['hand-right']),
  'leg-left':set(['hip-left','thigh-left','knee-left','shin-left','ankle-left']),
  'leg-right':set(['hip-right','thigh-right','knee-right','shin-right','ankle-right']),
  'foot-left':set(['foot-left']),
  'foot-right':set(['foot-right'])
});

export const BODY_MESH_SILHOUETTE_GROUPS=Object.freeze(['torso','neck','arm-left','arm-right','hand-left','hand-right','leg-left','leg-right','foot-left','foot-right']);
export const BODY_CEL_SHADING_GROUPS=Object.freeze(['head',...BODY_MESH_SILHOUETTE_GROUPS]);

function sideFromWeights(weights={}){
  let left=0,right=0;
  for(const [bone,weight] of Object.entries(weights)){if(bone.endsWith('-left'))left+=Number(weight);else if(bone.endsWith('-right'))right+=Number(weight);}
  if(left===right)return null;return left>right?'left':'right';
}

function semanticVote(region,weights){
  const value=String(region??'').toLowerCase();
  if(/skull|head/.test(value))return'head';
  if(value.includes('neck'))return'neck';
  if(/pelvis|spine|ribcage|clavicle/.test(value))return'torso';
  const side=sideFromWeights(weights);if(!side)return null;
  if(/palm|hand/.test(value))return`hand-${side}`;
  if(value.includes('foot'))return`foot-${side}`;
  if(/hip|thigh|knee|shin|ankle/.test(value))return`leg-${side}`;
  if(/deltoid|shoulder|upper_arm|upper-arm|elbow|forearm|wrist/.test(value))return`arm-${side}`;
  return null;
}

export function classifyBodySurfaceTriangle(mesh,triangle,{minimumSemanticVotes=2,minimumWeight=.04}={}){
  const regionVotes=new Map();
  for(const vertexIndex of triangle??[]){const group=semanticVote(mesh?.region_ids?.[vertexIndex],mesh?.bone_weights?.[vertexIndex]??{});if(group)regionVotes.set(group,(regionVotes.get(group)??0)+1);}
  let semantic=null,votes=0;for(const [group,count] of regionVotes)if(count>votes){semantic=group;votes=count;}
  if(semantic&&votes>=minimumSemanticVotes)return semantic;

  const totals=new Map();
  for(const vertexIndex of triangle??[])for(const [bone,weight] of Object.entries(mesh?.bone_weights?.[vertexIndex]??{}))for(const [group,bones] of Object.entries(BODY_SURFACE_GROUP_BONES))if(bones.has(bone))totals.set(group,(totals.get(group)??0)+Number(weight));
  let best=null,bestWeight=0;for(const [group,weight] of totals)if(weight>bestWeight){best=group;bestWeight=weight;}
  return bestWeight>minimumWeight?best:null;
}

export function bodySurfaceMaterialClass(group){
  if(group==='head'||group==='neck'||group?.startsWith('hand-'))return'skin';
  return'garment';
}

export function bodySurfaceGroupSide(group){if(group?.endsWith('-left'))return'left';if(group?.endsWith('-right'))return'right';return'center';}
