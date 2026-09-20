import {createHumanRuntimeV3,forwardKinematics,evaluatePoseV2} from '../src/unified-index.mjs';
const rt=createHumanRuntimeV3(); const pose=rt.createPose();
const solved=rt.solveFullBody(pose,{legL:[-0.17,0.10,0.18],legR:[0.15,0.10,-0.06],armL:[-0.40,1.20,0.18],armR:[0.40,1.20,0.18]},{iterations:8,tolerance:0.02,rootGain:0.15,jointLimits:false});
const fk=forwardKinematics(rt.skeleton,solved.state),evaluation=evaluatePoseV2({skeleton:rt.skeleton,state:solved.state,fk,profile:{footHeightTol:0.12}});
console.log(JSON.stringify({protocol:rt.protocol,fullBodyOk:solved.ok,maxResidual:solved.maxResidual,poseGate:evaluation.ok,worldBody:rt.worldBodyIR(solved.state,fk,evaluation).format},null,2));
