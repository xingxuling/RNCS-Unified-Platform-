import {createAuthoritativeStateFrame, verifyAuthoritativeStateFrame} from '@taowind/reality-simulation-runtime/network-reconciliation';
import {clone, hash, NETWORK_PROTOCOL} from './protocol.mjs';

export const OBSERVER_RELEVANCE_FORMAT='network.observer-relevance.v0.1';
const asArray=value=>Array.isArray(value)?value:[];
const uniqueStrings=values=>[...new Set(asArray(values).filter(value=>typeof value==='string'&&value.length>0))].sort();
const finiteNumber=(value,fallback)=>Number.isFinite(value)?Number(value):fallback;

export function normalizeObserverProfile(profile={}){
  const radius=profile.radius===undefined||profile.radius===null?null:Math.max(0,finiteNumber(profile.radius,0));
  const maxObjects=profile.maxObjects===undefined||profile.maxObjects===null?null:Math.max(0,Math.floor(finiteNumber(profile.maxObjects,0)));
  const position=profile.position&&['x','y','z'].every(key=>Number.isFinite(profile.position[key]))?{x:Number(profile.position.x),y:Number(profile.position.y),z:Number(profile.position.z)}:null;
  return {
    observerId:String(profile.observerId??'observer:anonymous'),
    position,
    radius,
    semanticTags:uniqueStrings(profile.semanticTags),
    causalBodyIds:uniqueStrings(profile.causalBodyIds),
    focusBodyIds:uniqueStrings(profile.focusBodyIds),
    maxObjects,
    minPriority:finiteNumber(profile.minPriority,0)
  };
}

function distanceSquared(a,b){if(!a||!b)return Infinity;const x=a.x-b.x,y=a.y-b.y,z=a.z-b.z;return x*x+y*y+z*z;}
function scoreBody(body,profile){
  const tags=new Set(body.tags??[]),semanticMatches=profile.semanticTags.filter(tag=>tags.has(tag)).length;
  const focused=profile.focusBodyIds.includes(body.id),causal=profile.causalBodyIds.includes(body.id),distanceSq=distanceSquared(profile.position,body.position);
  const inRadius=profile.radius===null||distanceSq<=profile.radius*profile.radius;
  const semanticFilter=profile.semanticTags.length===0||semanticMatches>0||focused||causal;
  const required=focused||causal;
  const proximity=profile.radius===null||!Number.isFinite(distanceSq)?0:Math.max(0,Math.round((1-Math.sqrt(distanceSq)/Math.max(profile.radius,1))*1000));
  const priority=(required?1000000000:0)+(focused?100000000:0)+semanticMatches*1000000+proximity*1000+(body.grounded?100:0);
  return {eligible:required||(inRadius&&semanticFilter&&priority>=profile.minPriority),required,focused,causal,semanticMatches,distanceSq,priority};
}

function projectEventIds(events,selectedIds){
  const ids=[];for(const event of asArray(events)){const bodyId=event?.bodyId??event?.sourceBodyId??event?.source_entity_id??event?.entityId;if(bodyId&&selectedIds.has(bodyId))ids.push(event.id??event.contactId??`${event.kind}:${event.tick}`);}return [...new Set(ids)].sort();
}

export function makeObserverRelevanceView(snapshot,{sessionId='session:unknown',...inputProfile}={}){
  const profile=normalizeObserverProfile(inputProfile),frame=createAuthoritativeStateFrame(snapshot,{reason:'observer-relevance'});
  if(!verifyAuthoritativeStateFrame(frame))throw new Error('RSR_AUTHORITY_FRAME_INVALID');
  const bodies=new Map(snapshot.bodies.map(body=>[body.id,body]));
  const candidates=frame.objects.map(object=>{const body=bodies.get(object.objectId)??{};return {...scoreBody({...body,id:object.objectId},profile),object}}).filter(candidate=>candidate.eligible).sort((a,b)=>b.priority-a.priority||a.object.objectId.localeCompare(b.object.objectId));
  const required=candidates.filter(candidate=>candidate.required).sort((a,b)=>a.object.objectId.localeCompare(b.object.objectId));
  const selected=[];const selectedIds=new Set();
  for(const candidate of required){if(!selectedIds.has(candidate.object.objectId)){selected.push(candidate);selectedIds.add(candidate.object.objectId);}}
  for(const candidate of candidates){if(selectedIds.has(candidate.object.objectId))continue;if(profile.maxObjects!==null&&selected.length>=profile.maxObjects)break;selected.push(candidate);selectedIds.add(candidate.object.objectId);}
  selected.sort((a,b)=>b.priority-a.priority||a.object.objectId.localeCompare(b.object.objectId));
  const allIds=new Set(frame.objects.map(object=>object.objectId)),selectedObjectIds=new Set(selected.map(candidate=>candidate.object.objectId));
  const base={
    format:OBSERVER_RELEVANCE_FORMAT,protocol:NETWORK_PROTOCOL,sessionId,observerId:profile.observerId,worldId:snapshot.worldId,tick:snapshot.tick,
    sourceStateRoot:snapshot.stateRoot,authorityFrameRoot:frame.frameRoot,profile,selectedObjects:selected.map(candidate=>candidate.object),
    priorities:selected.map(candidate=>({objectId:candidate.object.objectId,priority:candidate.priority,required:candidate.required,focused:candidate.focused,causal:candidate.causal,semanticMatches:candidate.semanticMatches})),
    omittedBodyIds:[...allIds].filter(id=>!selectedObjectIds.has(id)).sort(),missingRequiredBodyIds:profile.focusBodyIds.concat(profile.causalBodyIds).filter(id=>!bodies.has(id)).sort(),
    eventIds:projectEventIds(frame.events,selectedObjectIds),summary:{considered:frame.objects.length,eligible:candidates.length,selected:selected.length,omitted:frame.objects.length-selected.length,budget:profile.maxObjects},
    authority:{stateRoot:snapshot.stateRoot,frameRoot:frame.frameRoot,authorityOnly:true},integrityVersion:'observer-relevance.v0.1'
  };
  return {...base,viewRoot:hash(base)};
}
