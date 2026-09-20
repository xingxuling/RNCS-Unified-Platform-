import {defaultControl,evaluateMotion} from '../src/unified-index.mjs';
const C=(patch={})=>Object.assign(defaultControl(),patch); const k=(t,label,control)=>({t,label,control});
const motion={id:'wf-step-diagonal-left-45',name:'万风步法｜左45°斜步',duration:2.8,keyframes:[
  k(0,'起架',defaultControl()),
  k(.18,'重心预移',C({pelvis:[.035,.95,-.015]})),
  k(.38,'前脚斜出',C({pelvis:[-.02,.95,.03],leftFoot:[-.30,0,.38],rightFoot:[.14,0,-.14],torsoYaw:-6})),
  k(.58,'落点承重',C({pelvis:[-.12,.95,.13],leftFoot:[-.30,0,.38],rightFoot:[.14,0,-.14],torsoYaw:-8})),
  k(.78,'后脚跟进',C({pelvis:[-.16,.96,.17],leftFoot:[-.30,0,.38],rightFoot:[.02,0,.05],torsoYaw:-8})),
  k(1,'归轴',C({pelvis:[-.16,.96,.18],leftFoot:[-.30,0,.38],rightFoot:[.01,0,.07],torsoYaw:-7}))
]};
const r=evaluateMotion(motion,{samples:80});
console.log(JSON.stringify({ok:r.ok,samples:r.samples,summary:r.summary,firstFailure:r.failures[0]?.evaluation.checks.filter(c=>!c.ok)},null,2));
