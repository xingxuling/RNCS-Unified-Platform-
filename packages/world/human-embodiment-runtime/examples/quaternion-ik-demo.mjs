import {createHumanRuntime,forwardKinematics,evaluatePoseV2,toRsrSpatialEmbodimentV2,toVsrDebugVisualV2} from '../src/unified-index.mjs';
const rt=createHumanRuntime();
let state=rt.createPose({rootPosition:[0,0.94,0]});
const solved=rt.solveTargets(state,{legL:[-0.16,0.105,0.08],legR:[0.15,0.105,-0.05],armL:[-0.24,1.32,0.32],armR:[0.24,1.28,0.28]},{iterations:4,tolerance:0.015});
state=solved.state;const fk=rt.fk(state);const evaluation=evaluatePoseV2({skeleton:rt.skeleton,state,fk,profile:{footHeightTol:0.08}});
console.log(JSON.stringify({protocol:rt.protocol,ik:solved.evidence,valid:evaluation.ok,com:evaluation.com,rsrBodies:toRsrSpatialEmbodimentV2({skeleton:rt.skeleton,fk,evaluation}).bodies.length,vsrBones:toVsrDebugVisualV2({skeleton:rt.skeleton,fk,evaluation}).primitives.bones.length},null,2));
