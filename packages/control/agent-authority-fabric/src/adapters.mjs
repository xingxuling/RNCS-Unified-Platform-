import {clone,hash} from './canonical.mjs';
import {toProposedEnvelope} from './rncs.mjs';
export function fromIcarPreview(preview){const envelope=toProposedEnvelope(preview.envelope);return{envelope,identity_scopes:clone(preview.authority?.actor?.scopes??[]),context:{request_id:`aaf:${preview.envelope.transition_id}`,source:'icar-v0.5-preview',preview_root:preview.preview_root,environment:'local',now:'2026-06-30T12:00:00Z'}};}
export function fromCnpNegotiation(negotiation){return{negotiation,negotiation_root:negotiation.negotiation_root??hash(negotiation),capability_steps:clone(negotiation.plan?.steps??[])};}
