import {rootHash} from './hash.mjs';
import {lowerStudioSequenceFrame} from './sequence-adapter.mjs';
import {combineVsr3DChannels} from './vsr3d-adapter.mjs';
import {combineUrrf2DChannels} from './urrf2d-adapter.mjs';

export const ANIMATION_FABRIC_VERSION='0.1.0-alpha.1';
export function evaluateAnimationFrame(sequenceFrame,options={}){
  const lowered=lowerStudioSequenceFrame(sequenceFrame,options),twoD=combineUrrf2DChannels(lowered.channels),threeD=combineVsr3DChannels(lowered.channels);const base={format:'rncs.animation-fabric.frame.v0.1',version:ANIMATION_FABRIC_VERSION,time:lowered.time,source_frame_root:lowered.source_frame_root,source_authority_root:lowered.source_authority_root,source_presentation_root:lowered.source_presentation_root,two_d:twoD,three_d:threeD,unlowered:lowered.unlowered,candidate_only:true,authoritative:false,canonical_state_mutated:false};return {...base,frameRoot:rootHash(base)};
}
export function createAnimationFabricRuntime(){return {id:'rncs.animation-fabric',version:ANIMATION_FABRIC_VERSION,evaluateFrame:evaluateAnimationFrame};}
