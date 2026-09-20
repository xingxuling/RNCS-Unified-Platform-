import {CANONICAL_DIMENSIONS} from './skeleton.mjs';
export function retargetControl(control,target={}){
  const sx=(target.shoulderHalf??CANONICAL_DIMENSIONS.shoulderHalf)/CANONICAL_DIMENSIONS.shoulderHalf;
  const sy=(target.height??CANONICAL_DIMENSIONS.height)/CANONICAL_DIMENSIONS.height;
  const sz=sy;
  const scalePoint=p=>[p[0]*sx,p[1]*sy,p[2]*sz];
  return {...structuredClone(control),pelvis:scalePoint(control.pelvis),leftFoot:scalePoint(control.leftFoot),rightFoot:scalePoint(control.rightFoot),leftHand:scalePoint(control.leftHand),rightHand:scalePoint(control.rightHand)};
}
export function retargetMotion(motion,target={}){return {...structuredClone(motion),retarget:{target},keyframes:motion.keyframes.map(k=>({...k,control:retargetControl(k.control,target)}))}}
