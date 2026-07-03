import {generateAssetPackage} from '@taowind/reality-asset-genesis';
import {importGlbToSpatialScene} from '@taowind/visual-state-runtime/gltf-asset';
import {CharacterAnimationStudioSession} from '@taowind/reality-studio-native/character-animation';

export function createCharacterAnimationDemo(intent, outDir) {
  const asset = generateAssetPackage(intent, {outDir});
  const imported = importGlbToSpatialScene(asset.files.glb);
  const node = imported.scene.nodes.find(entry => entry.skinId);
  const session = new CharacterAnimationStudioSession(imported.scene, node.id);
  const rest = session.preview();
  session.applySequenceFrame({presentation_state:[{track_type:'animation',local_time:0.55,payload:{clipId:imported.scene.characterRigs[0].clips[0].id,timeSeconds:0.55}}]});
  const animated = session.preview();
  return {asset, imported, rest, animated, inspection: session.inspect()};
}
