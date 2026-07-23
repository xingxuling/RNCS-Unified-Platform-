import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  prepareFoundationNativeMetaRncsTransition,
  prepareFoundationNativeRncsTransition,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';

const realityId = 'reality:foundation-native-demo-stack';
const preparedBatchA = prepareFoundationNativeRncsTransition({
  input: {
    speechAct: 'create',
    utterance: 'Create one bounded world candidate for RNCS review.',
  },
  evidence: [{
    type: 'demo-operator-intent',
    id: 'rncs-foundation-demo-batch-a',
  }],
}, { realityId });
const authorizedBatchA = authorizeFoundationNativeRncsTransition(
  preparedBatchA,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'demo-human-owner',
  },
);
const committedBatchA = commitFoundationNativeRncsTransition(
  authorizedBatchA,
  { confirmed: true },
);

const preparedMeta = prepareFoundationNativeMetaRncsTransition({
  causalParents: [committedBatchA.roots.finalStateRoot],
  input: {
    speechAct: 'create',
    timeline: {
      tick: 1,
      observerFrame: 'subjective-bounded',
      eventCount: 2,
    },
    acceleration: {
      requestedFactor: 12,
      fidelityFloor: 0.95,
    },
    compression: {
      codec: 'content-addressed',
      restoreRequired: true,
    },
  },
  evidence: [{
    type: 'demo-operator-intent',
    id: 'rncs-foundation-demo-meta-batch-b',
  }],
}, {
  realityId,
  baseGeneration: 1,
  baseGenerationRoot: committedBatchA.roots.finalStateRoot,
});
const authorizedMeta = authorizeFoundationNativeRncsTransition(
  preparedMeta,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'demo-human-owner',
  },
);
const committedMeta = commitFoundationNativeRncsTransition(
  authorizedMeta,
  { confirmed: true },
);

console.log(JSON.stringify({
  status: committedMeta.status,
  generations: [
    {
      batch: 'batch-a',
      generation: committedBatchA.envelope.commit.result_generation,
      provider: committedBatchA.execution.providerHost,
    },
    {
      batch: 'meta-batch-b',
      generation: committedMeta.envelope.commit.result_generation,
      provider: committedMeta.execution.providerHost,
      semanticStateRoot: committedMeta.roots.semanticStateRoot,
      semanticOperations:
        committedMeta.envelope.provisional_delta.operations,
    },
  ],
  verification: verifyFoundationNativeRncsTransition(committedMeta),
}, null, 2));
