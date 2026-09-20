import {DEFAULT_ANATOMICAL_PROFILE} from './anatomical-skeleton-v4.mjs';
import {len,sub} from './math.mjs';

const d=(a,b)=>a&&b?len(sub(a,b)):null;
export function calibrateAnthropometryFromLandmarks(markers,{base=DEFAULT_ANATOMICAL_PROFILE,height=null}={}){
  const p={...base};const evidence={};
  const bilateral=(l,r)=>l&&r?d(l,r):null;
  const pelvisWidth=bilateral(markers.ASIS_L,markers.ASIS_R);if(pelvisWidth){p.pelvisWidth=pelvisWidth;evidence.pelvisWidth='ASIS distance'}
  const shoulderWidth=bilateral(markers.acromionL,markers.acromionR);if(shoulderWidth){p.shoulderWidth=shoulderWidth;evidence.shoulderWidth='acromion distance'}
  for(const side of ['L','R']){
    const up=d(markers[`acromion${side}`],markers[`elbowLat${side}`]??markers[`elbow${side}`]);if(up){p.upperArmLength=(p.upperArmLength+up)/2;evidence.upperArmLength='acromion-elbow'}
    const fore=d(markers[`elbowLat${side}`]??markers[`elbow${side}`],markers[`wristRad${side}`]??markers[`wrist${side}`]);if(fore){p.forearmLength=(p.forearmLength+fore)/2;evidence.forearmLength='elbow-wrist'}
    const thigh=d(markers[`hip${side}`],markers[`kneeLat${side}`]??markers[`knee${side}`]);if(thigh){p.thighLength=(p.thighLength+thigh)/2;evidence.thighLength='hip-knee'}
    const shank=d(markers[`kneeLat${side}`]??markers[`knee${side}`],markers[`ankleLat${side}`]??markers[`ankle${side}`]);if(shank){p.shankLength=(p.shankLength+shank)/2;evidence.shankLength='knee-ankle'}
  }
  if(height){const s=height/(p.height||height);p.height=height;evidence.height='provided';if(Object.keys(evidence).length<=1)for(const k of Object.keys(p))if(k!=='height'&&typeof p[k]==='number')p[k]*=s;}
  return {profile:p,evidence,calibratedFields:Object.keys(evidence)};
}
