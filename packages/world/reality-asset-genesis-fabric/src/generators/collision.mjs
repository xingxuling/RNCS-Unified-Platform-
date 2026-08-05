import {seal} from '../canonical.mjs';

export function generateCollisionShape({genome,variant}){
  const scale=variant==='mobile'?.92:1,is3d=String(genome.identity.kind).includes('3d'),assetId=genome.identity.asset_id,shapeId=`collision:${assetId.split(':').pop()}:${variant}`;
  if(is3d){
    const body={id:'body',role:'solid',type:'capsule-3d',center:[0,1.25,0],radius:.3*scale,half_height:.95*scale,layer:'character',mask:['world','enemy','trigger']};
    const fixtures=[
      body,
      {id:'torso',role:'secondary-solid',type:'box-3d',center:[0,1.56,0],half_extents:[.38*scale,.48*scale,.27*scale],layer:'character',mask:['world','enemy']},
      {id:'weapon-reach',role:'attack-sensor',type:'capsule-3d',from:[.35,1.1,0],to:[1.05,1.65,0],radius:.16*scale,layer:'sensor',mask:['enemy','trigger']},
      {id:'head',role:'hit-region',type:'sphere-3d',center:[0,2.32,0],radius:.28*scale,layer:'character-hit',mask:['damage']}
    ];
    return seal({format:'rsr.collision-shape.v0.6',version:'0.3.0',shape_id:shapeId,asset_id:assetId,variant,type:'capsule-3d',center:body.center,radius:body.radius,half_height:body.half_height,collision_layer:'character',mask:body.mask,fixtures,semantic_regions:[{name:'body',role:'solid',fixture_id:'body'},{name:'weapon-reach',role:'attack-sensor',fixture_id:'weapon-reach'},{name:'head',role:'hit-region',fixture_id:'head'}],authoring:{fit:'humanoid-rounded-v0.4',source:'skeleton-and-silhouette',coverage:{solid:.82,sensor:.18},runtime_primary:'body'},shape_root:''},'shape_root');
  }
  return seal({format:'rsr.collision-shape.v0.3',version:'0.2.0',shape_id:shapeId,asset_id:assetId,variant,type:'capsule',center:[0,2],radius:12*scale,half_height:23*scale,collision_layer:'character',mask:['world','enemy','trigger'],semantic_regions:[{name:'body',role:'solid'},{name:'weapon-reach',role:'attack-sensor',shape:{type:'segment',from:[12,-8],to:[35,15],radius:4}}],shape_root:''},'shape_root');
}
