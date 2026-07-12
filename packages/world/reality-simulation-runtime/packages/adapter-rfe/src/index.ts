import { deepClone, type VSRContext, type VSRDocument, type VSREvent, type VSRValue } from '../../spec/src/index.js';

export interface RFEProjectionOmission { category:string; reason:string }
export interface RFEVisualDeviceProfile { width?:number;height?:number;dpr?:number;locale?:string;inputModes?:string[] }
export interface RFEVisualSemantic {
  id:string;kind:'entity'|'relation'|'affordance'|'warning'|'label'|'environment';concept:string;importance?:number;
  position?:{x:number;y:number;z?:number};bounds?:{width:number;height:number;depth?:number};state?:Record<string,VSRValue>;styleHint?:string;provisional?:boolean;
}
export interface RFEObserverProjection {
  realityVersion:string;logicalTime:number;observerId:string;visualSemantics:RFEVisualSemantic[];deviceProfile?:RFEVisualDeviceProfile;
  omittedInformation?:RFEProjectionOmission[];provisional?:boolean;
}
export interface RFEAdapterOptions { variablePrefix?:string;timeScale?:number;strict?:boolean }
export interface VSRRuntimeInput {
  variables:Record<string,VSRValue>;events:VSREvent[];contextOverrides?:Partial<VSRContext>;projectionMetadata:{realityVersion:string;observerId:string;logicalTime:number;provisional:boolean};
}
export interface RFEVisualInteractionEvent { type:string;nodeId?:string;payload?:Record<string,VSRValue>;time:number }
export interface RFESubjectIntent { observerId:string;realityVersion:string;intentType:string;payload:Record<string,VSRValue>;createdAtLogicalTime:number;provisional:true }

export function projectionToVSR(projection:RFEObserverProjection,template:VSRDocument,options:RFEAdapterOptions={}):VSRRuntimeInput {
  const prefix=options.variablePrefix??'rfe';const semantics=projection.visualSemantics.map(s=>({id:s.id,kind:s.kind,concept:s.concept,importance:s.importance??0.5,position:s.position??null,bounds:s.bounds??null,state:s.state??{},styleHint:s.styleHint??'',provisional:Boolean(projection.provisional||s.provisional)})) as unknown as VSRValue;
  const variables:Record<string,VSRValue>={...deepClone(template.variables??{}),[prefix]:{realityVersion:projection.realityVersion,observerId:projection.observerId,logicalTime:projection.logicalTime,provisional:Boolean(projection.provisional),semantics}};
  const events:VSREvent[]=[];for(const semantic of projection.visualSemantics){if(semantic.kind==='warning')events.push({id:`rfe-warning-${semantic.id}`,time:projection.logicalTime*(options.timeScale??1),type:'set',target:`${prefix}.lastWarning`,value:semantic.concept})}
  const d=projection.deviceProfile;const contextOverrides=d?{width:d.width,height:d.height,dpr:d.dpr,locale:d.locale}:undefined;
  return{variables,events,contextOverrides,projectionMetadata:{realityVersion:projection.realityVersion,observerId:projection.observerId,logicalTime:projection.logicalTime,provisional:Boolean(projection.provisional)}};
}

export function interactionToSubjectIntent(projection:RFEObserverProjection,event:RFEVisualInteractionEvent):RFESubjectIntent {
  return{observerId:projection.observerId,realityVersion:projection.realityVersion,intentType:event.type,payload:{nodeId:event.nodeId??'',...(event.payload??{})},createdAtLogicalTime:event.time,provisional:true};
}
