export function toVsrDebugVisualV2({entityId='human',skeleton,fk,evaluation}){
  const joints=skeleton.joints.map(j=>({kind:'sphere',name:j.name,position:fk.world[j.name].position,radius:0.018}));
  const bones=skeleton.joints.filter(j=>j.parent).map(j=>({kind:'line',name:`${j.parent}-${j.name}`,from:fk.world[j.parent].position,to:fk.world[j.name].position}));
  return {protocol:'vsr.spatial-reality-3d.v0.7',extension:'her.pose-state.v0.2',entity_id:`${entityId}:debug`,primitives:{joints,bones,com:evaluation?{kind:'sphere',name:'com',position:evaluation.com,radius:0.03}:null,support:evaluation?{kind:'polygon',name:'support',points:evaluation.support.polygon.map(([x,z])=>[x,0.002,z])}:null}};
}
