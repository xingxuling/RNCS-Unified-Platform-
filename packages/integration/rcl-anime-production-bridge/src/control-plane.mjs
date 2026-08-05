import {compileRclAuthorityPlan} from '@taowind/rncs-rcl-control-plane';
import {clone,rootHash} from '../../../world/anime-production-runtime/src/index.mjs';

export const ANIME_CONTROL_PLANE_CANDIDATE_FORMAT='rncs.anime-control-plane-candidate.v0.1';

export async function buildAnimeControlPlaneCandidate(compiled,{verifyParity=false}={}){
  const authorityPlan=await compileRclAuthorityPlan(compiled.shadow_rcl,{verifyParity});
  const plan=authorityPlan.plan;
  const candidate={format:ANIME_CONTROL_PLANE_CANDIDATE_FORMAT,version:'0.1.0-alpha.1',status:'candidate',production_root:compiled.production.production_root,compiled_root:compiled.compiled_root,source_root:compiled.source_root,plan_id:plan.plan_id,candidate_branch:clone(plan.candidate_branch),state_root:authorityPlan.stateRoot,domain_state_root:authorityPlan.domainStateRoot,projection_targets:clone(plan.projection_targets),authority_requirements:clone(plan.authority_requirements),evidence_requirements:clone(plan.evidence_requirements),rollback_policy:clone(plan.rollback_policy),commit_authority:'RNCS RCL Control Plane',commit_permitted:false,authority_boundary:'Anime Forge can propose and evidence-bind a candidate; RNCS authority commit remains an explicit external action'};
  return{...candidate,candidate_root:rootHash(candidate),authority_plan:plan};
}
