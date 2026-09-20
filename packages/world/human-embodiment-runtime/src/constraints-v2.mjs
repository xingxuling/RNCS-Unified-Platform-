import {angleABC,projectXZ,dot,sub,norm,deg,clamp,rad} from './math.mjs';
import {centerOfMass,trunkTiltDeg} from './biomechanics.mjs';
import {convexHull,pointInPolygon,polygonMargin} from './geometry.mjs';
import {qRotateVec} from './quaternion.mjs';

function footCorners(center,rotation,length,width){
  const f=qRotateVec(rotation,[0,0,1]),yaw=Math.atan2(f[0],f[2]),c=Math.cos(yaw),s=Math.sin(yaw),hx=width/2,hz=length/2;
  return [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]].map(([x,z])=>[center[0]+x*c+z*s,center[2]-x*s+z*c]);
}
export function evaluatePoseV2({skeleton,state,fk,final=false,profile={},contacts={left:true,right:true}}){
  fk=fk??(awaitImportImpossible());
  const pos=Object.fromEntries(Object.entries(fk.world).map(([k,v])=>[k,v.position]));
  const com=centerOfMass(pos),pts=[];
  const d=skeleton.profile;
  if(contacts.left!==false)pts.push(...footCorners(fk.world.footL.position,fk.world.footL.rotation,d.footForward*2.1,d.footForward*0.78));
  if(contacts.right!==false)pts.push(...footCorners(fk.world.footR.position,fk.world.footR.rotation,d.footForward*2.1,d.footForward*0.78));
  const polygon=convexHull(pts),projection=projectXZ(com),support={polygon,projection,inside:pointInPolygon(projection,polygon),margin:polygonMargin(projection,polygon)};
  const kneeL=angleABC(pos.hipL,pos.kneeL,pos.ankleL),kneeR=angleABC(pos.hipR,pos.kneeR,pos.ankleR),elbowL=angleABC(pos.shoulderL,pos.elbowL,pos.wristL),elbowR=angleABC(pos.shoulderR,pos.elbowR,pos.wristR);
  const trunk=trunkTiltDeg(pos),rightAxis=qRotateVec(fk.world.pelvis.rotation,[1,0,0]);
  const leftLat=dot(sub(pos.footL,pos.pelvis),rightAxis),rightLat=dot(sub(pos.footR,pos.pelvis),rightAxis),lateralGap=rightLat-leftLat;
  const floorY=profile.floorY??0,footTol=profile.footHeightTol??0.035;
  const leftContact=contacts.left===false||Math.abs(pos.footL[1]-floorY)<=footTol,rightContact=contacts.right===false||Math.abs(pos.footR[1]-floorY)<=footTol;
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),guardThreshold=profile.guardThreshold??0.68;
  const guardOk=!final||(dist(pos.wristL,pos.chest)<guardThreshold&&dist(pos.wristR,pos.chest)<guardThreshold);
  const range=(v,lo,hi)=>v>=lo&&v<=hi;
  const checks=[
    {id:'support',ok:support.inside,value:support.margin,label:'COM projection inside support polygon'},
    {id:'leg-crossing',ok:lateralGap>=(profile.minLateralGap??0.025),value:lateralGap,label:'Feet preserve lateral ordering'},
    {id:'foot-contact',ok:leftContact&&rightContact,value:{left:leftContact,right:rightContact},label:'Declared foot contact matches floor'},
    {id:'trunk-axis',ok:trunk<=(profile.maxTrunkTiltDeg??18),value:trunk,label:'Trunk axis within limit'},
    {id:'knee-range',ok:range(kneeL,10,179)&&range(kneeR,10,179),value:{left:kneeL,right:kneeR},label:'Knees within configured range'},
    {id:'elbow-range',ok:range(elbowL,10,179)&&range(elbowR,10,179),value:{left:elbowL,right:elbowR},label:'Elbows within configured range'},
    {id:'return-guard',ok:guardOk,value:final?guardOk:'process',label:'Final frame returned to guard'}
  ];
  return {ok:checks.every(c=>c.ok),checks,com,support,jointAngles:{kneeL,kneeR,elbowL,elbowR},trunkTiltDeg:trunk,lateralGap};
}
function awaitImportImpossible(){throw new Error('evaluatePoseV2 requires fk from forwardKinematics')}
