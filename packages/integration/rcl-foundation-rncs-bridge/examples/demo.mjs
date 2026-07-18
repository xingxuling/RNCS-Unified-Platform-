import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  prepareFoundationNativeRncsTransition,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';

const prepared = prepareFoundationNativeRncsTransition({
  input: {
    speechAct: 'create',
    utterance: 'Create one bounded world candidate for RNCS review.',
  },
  evidence: [{ type: 'demo-operator-intent', id: 'rncs-foundation-demo' }],
});
const authorized = authorizeFoundationNativeRncsTransition(prepared, {
  approved: true,
  roles: ['owner'],
  resolver: 'demo-human-owner',
});
const committed = commitFoundationNativeRncsTransition(authorized, { confirmed: true });

console.log(JSON.stringify({
  status: committed.status,
  provider: committed.execution.providerHost,
  domains: committed.execution.results.map(item => item.domain),
  selectedAction: committed.execution.finalCandidate.selectedAction,
  receiptRoot: committed.roots.receiptRoot,
  proposalRoot: committed.envelope.proposal_root,
  commitRoot: committed.envelope.commit.commit_root,
  finalStateRoot: committed.roots.finalStateRoot,
  verification: verifyFoundationNativeRncsTransition(committed),
}, null, 2));
