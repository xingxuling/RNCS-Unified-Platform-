import {clone,seal} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {BODY_PARAMETER_DEFINITIONS,FACE_PARAMETER_DEFINITIONS,SEMANTIC_MORPH_GRAPH_FORMAT,getCostumeFamily,getHairFamily,getTopologyFamily} from './catalog.mjs';

const round=value=>Math.round(Number(value)*1000000)/1000000;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export class CharacterGenomeError extends Error{
  constructor(code,message,details={}){super(message);this.name='CharacterGenomeError';this.code=code;this.details=details}
}

export function createSemanticMorphParameterGraph(values={}){
  const definitions=[...FACE_PARAMETER_DEFINITIONS,...BODY_PARAMETER_DEFINITIONS];
  const parameters=definitions.map(definition=>{
    const raw=values[definition.parameter_id]??values[definition.parameter_id.split('.').at(-1)]??definition.default;
    return{...clone(definition),normalized_value:round(Number(raw))};
  });
  return seal({format:SEMANTIC_MORPH_GRAPH_FORMAT,version:'0.1.0-alpha.1',parameters,dependencies:parameters.flatMap(item=>item.dependent_parameters.map(dependency=>({from:dependency,to:item.parameter_id,kind:'semantic-constraint'}))),graph_root:''},'graph_root');
}

function relationChecks(map){
  const errors=[],warnings=[];
  const eyeSpacing=map.get('face.eye_spacing'),eyeSize=map.get('face.eye_size');
  if(eyeSpacing.normalized_value<eyeSize.normalized_value*.58)errors.push({code:'EYE_SPACING_EXPOSES_EYEBALLS',parameters:['face.eye_spacing','face.eye_size']});
  const mouth=map.get('face.mouth_width'),jaw=map.get('face.jaw_width');
  if(mouth.normalized_value>jaw.normalized_value+.23)errors.push({code:'MOUTH_WIDTH_EXCEEDS_JAW',parameters:['face.mouth_width','face.jaw_width']});
  const lips=map.get('face.upper_lip').normalized_value+map.get('face.lower_lip').normalized_value;
  if(lips>1.34)errors.push({code:'LIP_VOLUME_COLLISION',parameters:['face.upper_lip','face.lower_lip']});
  if(map.get('face.chin_projection').normalized_value>map.get('face.jaw_definition').normalized_value+.24)errors.push({code:'CHIN_DETACHED_FROM_JAW',parameters:['face.chin_projection','face.jaw_definition']});
  if(map.get('face.nose_length').normalized_value>map.get('face.philtrum_length').normalized_value+.3)warnings.push({code:'NOSE_MOUTH_CLEARANCE_LOW',parameters:['face.nose_length','face.philtrum_length']});
  return{errors,warnings};
}

export function solveCharacterConstraints(graph,{topologyFamily='young-male-slim',hairFamily='black-wavy-medium',costumeFamily='lan-default-v1',strict=true}={}){
  const parameters=clone(graph.parameters),errors=[],warnings=[],adjustments=[];
  for(const parameter of parameters){
    if(!Number.isFinite(parameter.normalized_value)){errors.push({code:'PARAMETER_NON_FINITE',parameter_id:parameter.parameter_id});continue}
    if(parameter.normalized_value<parameter.safe_min||parameter.normalized_value>parameter.safe_max){
      const next=round(clamp(parameter.normalized_value,parameter.safe_min,parameter.safe_max));
      const issue={code:'PARAMETER_OUT_OF_SAFE_RANGE',parameter_id:parameter.parameter_id,actual:parameter.normalized_value,safe_min:parameter.safe_min,safe_max:parameter.safe_max,clamped:next};
      if(strict)errors.push(issue);else{warnings.push(issue);adjustments.push({parameter_id:parameter.parameter_id,from:parameter.normalized_value,to:next,reason:'safe-range'});parameter.normalized_value=next}
    }
  }
  const map=new Map(parameters.map(item=>[item.parameter_id,item])),relations=relationChecks(map);errors.push(...relations.errors);warnings.push(...relations.warnings);
  const topology=getTopologyFamily(topologyFamily),hair=getHairFamily(hairFamily),costume=getCostumeFamily(costumeFamily);
  if(!topology)errors.push({code:'TOPOLOGY_FAMILY_UNKNOWN',topology_family:topologyFamily});
  if(!hair)errors.push({code:'HAIR_FAMILY_UNKNOWN',hair_family:hairFamily});else if(!hair.compatible_topologies.includes(topologyFamily))errors.push({code:'HAIR_TOPOLOGY_INCOMPATIBLE',hair_family:hairFamily,topology_family:topologyFamily});
  if(!costume)errors.push({code:'COSTUME_FAMILY_UNKNOWN',costume_family:costumeFamily});else if(!costume.compatible_topologies.includes(topologyFamily))errors.push({code:'COSTUME_TOPOLOGY_INCOMPATIBLE',costume_family:costumeFamily,topology_family:topologyFamily});
  const solvedGraph=seal({...graph,parameters,graph_root:''},'graph_root');
  const report=seal({format:'rncs.character-constraint-report.v0.1',valid:errors.length===0,strict,topology_family:topologyFamily,hair_family:hairFamily,costume_family:costumeFamily,errors,warnings,adjustments,input_graph_root:graph.graph_root,solved_graph_root:solvedGraph.graph_root,report_root:''},'report_root');
  return{valid:report.valid,graph:solvedGraph,report};
}

export function assertSolvedCharacterConstraints(result){if(!result.valid)throw new CharacterGenomeError('CHARACTER_CONSTRAINTS_INVALID',result.report.errors.map(item=>item.code).join(','),result.report);return result}
