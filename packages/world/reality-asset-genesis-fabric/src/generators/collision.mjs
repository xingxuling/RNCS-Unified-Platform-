import {seal} from '../canonical.mjs';
import {isRiggedAssetKind,isCreatureAssetKind,static3dBounds} from '../contracts.mjs';
import {CREATURE_BOUNDS,CREATURE_PROFILE} from './creature-profile.mjs';

export function generateCollisionShape({genome,variant}){
  const scale=variant==='mobile'?.92:1,is3d=String(genome.identity.kind).includes('3d'),assetId=genome.identity.asset_id,shapeId=`collision:${assetId.split(':').pop()}:${variant}`;
  if(is3d&&isCreatureAssetKind(genome.identity.kind)){
    const center=CREATURE_BOUNDS.center,half_extents=CREATURE_BOUNDS.halfExtents.map(value=>value*scale);
    const body={id:'body',role:'solid',type:'box-3d',center,half_extents,layer:'creature',mask:['world','enemy','sensor']};
    const fixtures=[body,{id:'torso',role:'secondary-solid',type:'box-3d',center:[0,.96,.1],half_extents:[.58,.52,1.02].map(value=>value*scale),layer:'creature',mask:['world','enemy']},{id:'head',role:'hit-region',type:'box-3d',center:[0,.9,1.48],half_extents:[.34,.32,.54].map(value=>value*scale),layer:'creature-hit',mask:['damage']},{id:'gait-sensor',role:'ground-sensor',type:'box-3d',center:[0,.05,.1],half_extents:[.62,.12,1.25].map(value=>value*scale),layer:'sensor',mask:['world']},{id:'tail-reach',role:'secondary-solid',type:'capsule-3d',from:[0,.76,-.4],to:[0,.78,-2.02],radius:.16*scale,layer:'creature',mask:['world','enemy']}];
    return seal({format:'rsr.collision-shape.v0.6',version:'0.3.0',shape_id:shapeId,asset_id:assetId,asset_kind:genome.identity.kind,variant,type:'box-3d',center,half_extents,collision_layer:'creature',mask:body.mask,fixtures,semantic_regions:[{name:'body',role:'solid',fixture_id:'body'},{name:'head',role:'hit-region',fixture_id:'head'},{name:'gait-sensor',role:'ground-sensor',fixture_id:'gait-sensor'},{name:'tail-reach',role:'secondary-solid',fixture_id:'tail-reach'}],authoring:{fit:CREATURE_PROFILE,source:'skeleton-and-silhouette',coverage:{solid:.9,sensor:.1},runtime_primary:'body'},shape_root:''},'shape_root');
  }
  if(is3d&&!isRiggedAssetKind(genome.identity.kind)){
    const {center,halfExtents}=static3dBounds(genome.identity.kind);
    const body={id:'body',role:'solid',type:'box-3d',center,half_extents:halfExtents,layer:'world',mask:['dynamic','character','sensor']};
    const fixtures=[body,{id:'interaction-volume',role:'interaction-sensor',type:'box-3d',center:body.center,half_extents:halfExtents.map(value=>value*1.08),layer:'sensor',mask:['character','interactable']}];
    return seal({format:'rsr.collision-shape.v0.6',version:'0.3.0',shape_id:shapeId,asset_id:assetId,asset_kind:genome.identity.kind,variant,type:'box-3d',center:body.center,half_extents:halfExtents,collision_layer:'world',mask:body.mask,fixtures,semantic_regions:[{name:'body',role:'solid',fixture_id:'body'},{name:'interaction-volume',role:'interaction-sensor',fixture_id:'interaction-volume'}],authoring:{fit:`${genome.identity.kind}-static-bounds-v0.1`,source:'profile-archetype-bounds',coverage:{solid:.94,sensor:.06},runtime_primary:'body'},shape_root:''},'shape_root');
  }
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
