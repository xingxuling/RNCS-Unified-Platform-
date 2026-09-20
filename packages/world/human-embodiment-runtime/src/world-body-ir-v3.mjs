export function toWorldBodyIRV3({entityId='human',skeleton,state,fk,evaluation=null}={}){
  return {format:'rncs.world-body-ir.human.v0.3',id:entityId,kind:'human-body',root:{joint:skeleton.root,position:state.rootPosition,rotation:state.rootRotation},joints:skeleton.joints.map(j=>({name:j.name,parent:j.parent,position:fk.world[j.name].position,rotation:fk.world[j.name].rotation})),derived:{center_of_mass:evaluation?.com??null,support_polygon:evaluation?.support?.polygon??null,valid:evaluation?.ok??null}};
}
