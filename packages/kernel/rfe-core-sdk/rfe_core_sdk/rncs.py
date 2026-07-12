from __future__ import annotations
from typing import Any
from .store import RealityStore
from .errors import ValidationError, ConflictError


def commit_authorized_envelope(store: RealityStore, envelope: dict[str, Any], *, branch_id: str | None = None) -> dict[str, Any]:
    """Commit an authorized RNCS Transition Envelope into RFE Local Core.

    RNCS Core Contract is an optional peer package, intentionally not copied into
    this SDK. The function imports it at runtime and returns both the RFE receipt
    and the same envelope advanced to ``committed``.
    """
    try:
        from rncs_contract import verify as verify_envelope, commit as commit_envelope
    except ImportError as exc:
        raise ValidationError('RFE_RNCS_CONTRACT_NOT_INSTALLED', 'install rncs-core-contract or add it to PYTHONPATH') from exc
    result=verify_envelope(envelope)
    if not result.get('valid'):
        raise ValidationError('RFE_RNCS_ENVELOPE_INVALID', ','.join(result.get('errors',[])))
    if envelope.get('phase')!='authorized' or envelope.get('authority',{}).get('status')!='approved':
        raise ValidationError('RFE_RNCS_ENVELOPE_NOT_AUTHORIZED', str(envelope.get('phase')))
    branch_id=branch_id or envelope.get('extensions',{}).get('rfe_branch_id') or store.default_branch
    current=store.current_generation(branch_id)
    base=envelope['base_generation']
    if base['reality_id']!=current['worldId']:
        raise ConflictError('RFE_RNCS_REALITY_MISMATCH', f"{base['reality_id']} != {current['worldId']}")
    if int(base['generation'])!=int(current['realityRevision']) or base['generation_root']!=current['integrityHash']:
        raise ConflictError('RFE_RNCS_BASE_GENERATION_MISMATCH', current['generationId'])
    subject=envelope['subject']['subject_id']
    intent={
      'intent_id':envelope['intent']['intent_id'],
      'source':envelope['intent'].get('source',''),
      'goals':envelope['intent'].get('goals',[]),
      'constraints':envelope['intent'].get('constraints',[]),
      'transition_id':envelope['transition_id'],
    }
    evidence=[{'kind':'rncs-envelope','proposal_root':envelope['proposal_root'],'decision_root':envelope['authority']['decision_root'],'envelope_root':envelope['envelope_root']}]
    for node in envelope.get('evidence',{}).get('nodes',[]):
        evidence.append({'kind':'rncs-evidence-node','node':node})
    tx=store.transaction(actor=subject,intent=intent,authority=envelope['authority']['resolver'],branch_id=branch_id,base_generation_id=current['generationId'],transaction_id=envelope['transition_id'],evidence=evidence)
    tx.operations=envelope['provisional_delta']['operations']
    committed=tx.commit()
    g=committed['generation']
    advanced=commit_envelope(envelope,generation=g['realityRevision'],generation_root=g['integrityHash'],receipt_refs=[committed['receipt']['integrityHash'],g['evidenceRoot']])
    return {'envelope':advanced,**committed}


def federation_candidate(commit_result: dict[str, Any], *, domain_id: str, requested_policy: str='quorum') -> dict[str, Any]:
    """Create a stable hand-off object for RFE C7–C12 federation adapters."""
    from .canonical import with_integrity
    g=commit_result['generation']; receipt=commit_result['receipt']
    return with_integrity({
      'format':'rfe.federation-candidate.v0.1',
      'domainId':domain_id,
      'worldId':g['worldId'],
      'branchId':g['branchId'],
      'generationId':g['generationId'],
      'generationRoot':g['integrityHash'],
      'semanticRoot':g['semanticRoot'],
      'evidenceRoot':g['evidenceRoot'],
      'localReceiptRoot':receipt['integrityHash'],
      'requestedPolicy':requested_policy,
      'status':'candidate-not-federated',
    })
