import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ContinuityLedger,
  createContinuityClaim,
  createSubjectSovereigntyEnvelope,
  forkContinuityClaim,
  nextContinuityClaim
} from '../src/continuity.mjs';

function claim(overrides = {}) {
  return createContinuityClaim({
    subjectId: 'subject:alice',
    authorityRoot: 'authority-root',
    ...overrides
  });
}

test('typed continuity claims advance, roll epochs, and preserve predecessor roots', () => {
  const first = claim();
  const second = nextContinuityClaim(first, {issuedAt: 1});
  const epochReset = nextContinuityClaim(second, {epoch: 1, sequence: 0, issuedAt: 2});

  assert.equal(first.sequence, 0);
  assert.equal(second.sequence, 1);
  assert.equal(second.previousClaimRoot, first.claimRoot);
  assert.equal(epochReset.epoch, 1);
  assert.equal(epochReset.sequence, 0);
  assert.equal(epochReset.previousClaimRoot, second.claimRoot);

  const ledger = new ContinuityLedger();
  ledger.accept({
    claim: first,
    sovereignty: createSubjectSovereigntyEnvelope({
      claim: first,
      transitionId: 'transition:1',
      leaseId: 'lease:alice',
      fencingToken: 1,
      nonce: 'nonce:1'
    })
  }, 'transition:1');
  ledger.accept({
    claim: second,
    sovereignty: createSubjectSovereigntyEnvelope({
      claim: second,
      transitionId: 'transition:2',
      leaseId: 'lease:alice',
      fencingToken: 1,
      nonce: 'nonce:2'
    })
  }, 'transition:2');
  ledger.accept({
    claim: epochReset,
    sovereignty: createSubjectSovereigntyEnvelope({
      claim: epochReset,
      transitionId: 'transition:3',
      leaseId: 'lease:alice',
      fencingToken: 2,
      nonce: 'nonce:3'
    })
  }, 'transition:3');

  assert.deepEqual(ledger.getHead('subject:alice'), epochReset);
});

test('continuity ledger rejects replay, gaps, stale fencing, and unauthorized forks', () => {
  const first = claim();
  const ledger = new ContinuityLedger();
  const sovereignty = (current, transitionId, fencingToken = 7) => createSubjectSovereigntyEnvelope({
    claim: current,
    transitionId,
    leaseId: 'lease:alice',
    fencingToken,
    nonce: `nonce:${transitionId}`
  });

  ledger.accept({claim: first, sovereignty: sovereignty(first, 'transition:1')}, 'transition:1');
  assert.throws(
    () => ledger.accept({claim: first, sovereignty: sovereignty(first, 'transition:replay')}, 'transition:replay'),
    /RK_CONTINUITY_REPLAY/
  );

  const gap = claim({sequence: 3, previousClaimRoot: first.claimRoot});
  assert.throws(
    () => ledger.accept({claim: gap, sovereignty: sovereignty(gap, 'transition:gap')}, 'transition:gap'),
    /RK_CONTINUITY_GAP/
  );

  const staleFence = nextContinuityClaim(first);
  assert.throws(
    () => ledger.accept({claim: staleFence, sovereignty: sovereignty(staleFence, 'transition:stale', 6)}, 'transition:stale'),
    /RK_FENCING_TOKEN_STALE/
  );

  const fork = forkContinuityClaim(first, {branchId: 'branch:what-if'});
  assert.throws(
    () => ledger.accept({claim: fork, sovereignty: sovereignty(fork, 'transition:fork')}, 'transition:fork'),
    /RK_CONTINUITY_FORK_DENIED/
  );
});
