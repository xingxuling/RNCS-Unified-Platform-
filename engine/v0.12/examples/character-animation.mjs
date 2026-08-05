import {normalizeIntent,deriveGenomeFromIntent,generateMesh3d,inspectGlb} from '@taowind/reality-asset-genesis-fabric';
import {importGlbToSpatialScene} from '@taowind/visual-state-runtime/gltf-asset';
import {CharacterAnimationStudioSession,normalizeSequence,evaluateSequence} from '@taowind/reality-studio-native';

export function createCharacterAnimationDemo(){
  const intent=normalizeIntent({description:'Create a three-dimensional character with a waving animation.',asset_kind:'character-3d',constraints:{max_triangles:2400,pbr_texture_size:128,max_bones:64}});
  const genome=deriveGenomeFromIntent(intent);
  const generated=generateMesh3d({genome,variant:'cinematic',lod:0});
  const inspection=inspectGlb(generated.glb);
  const imported=importGlbToSpatialScene(generated.glb,{sceneId:'v012-character'});
  const node=imported.scene.nodes.find(entry=>entry.skinId&&entry.meshId);
  const rig=imported.scene.characterRigs?.[0];
  if(!inspection.valid||!node||!rig?.clips?.[0])throw new Error('Character GLB is not animatable.');
  const session=new CharacterAnimationStudioSession(imported.scene,node.id,{graph:{initialState:'motion',states:[{id:'motion',clipId:rig.clips[0].id,loop:false}],transitions:[]}});
  const rest=session.preview();
  const sequence=normalizeSequence({sequence_id:'v012',fps:30,duration:1,tracks:[{track_id:'animation',type:'animation',clips:[{clip_id:'motion',start:0,duration:1,payload:{clipId:rig.clips[0].id,loop:false}}]}]});
  session.applySequenceFrame(evaluateSequence(sequence,.5,{previousTime:0}));
  const animated=session.preview();
  return {inspection,imported,rest,animated};
}
