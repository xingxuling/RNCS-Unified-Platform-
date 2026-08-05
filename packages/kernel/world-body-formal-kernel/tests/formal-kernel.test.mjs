import test from 'node:test';
import assert from 'node:assert/strict';
import { semanticHash } from '@taowind/world-body-ir';
import {
  classifyFormalMaturity,
  REQUIRED_F5_EXTERNAL_BACKEND_IDS,
  REQUIRED_REFERENCE_DOMAINS,
  createProofBundle,
  defineTheorem,
  evaluateTheorem,
  evaluateTheoremSuite,
  verifyProofBundle,
  verifyTheoremReceipt,
} from '../src/index.mjs';

const fiveLevels = [1, 2, 3, 4, 5].map(level => defineTheorem({
  id: `WB-T${level}`,
  domain: 'world-body-test',
  level,
  title: `Level ${level}`,
  statement: `Level ${level} executable test predicate holds.`,
  classification: level === 5 ? 'CONDITIONAL' : 'EXACT',
  assumptions: level === 5 ? ['test adapter is declared'] : [],
  predicate: subject => ({ ok: subject.value === 7, observations: { value: subject.value } }),
}));

test('theorem receipt is deterministic and tamper evident', async () => {
  const first = await evaluateTheorem(fiveLevels[0], { value: 7 });
  const second = await evaluateTheorem(fiveLevels[0], { value: 7 });
  assert.deepEqual(first, second);
  assert.equal(verifyTheoremReceipt(first), true);
  const tampered = structuredClone(first);
  tampered.status = 'FAIL';
  assert.equal(verifyTheoremReceipt(tampered), false);
  const forged = structuredClone(first);
  forged.theorem.id = 'FORGED';
  const { witnessRoot, ...base } = forged;
  forged.witnessRoot = semanticHash(base);
  assert.equal(verifyTheoremReceipt(forged), false);
});

test('five-level theorem suite closes as a sealed proof bundle', async () => {
  const bundle = await evaluateTheoremSuite(fiveLevels, { value: 7 });
  assert.equal(bundle.status, 'PASS');
  assert.deepEqual(bundle.counts, { FAIL: 0, PASS: 5, UNVERIFIED: 0 });
  assert.equal(verifyProofBundle(bundle), true);
});

test('predicate failure is evidence, not an exception escape', async () => {
  const receipt = await evaluateTheorem(fiveLevels[0], { value: 8 });
  assert.equal(receipt.status, 'FAIL');
  assert.equal(verifyTheoremReceipt(receipt), true);
});

test('external theorem remains explicitly unverified', async () => {
  const theorem = defineTheorem({
    id: 'WB-T5.1',
    domain: 'world-body-test',
    level: 5,
    title: 'External GPU parity',
    statement: 'A real target GPU has equivalent observable pixels.',
    classification: 'UNVERIFIED_EXTERNAL',
    assumptions: ['real target GPU execution is available'],
  });
  const receipt = await evaluateTheorem(theorem, { value: 7 }, { evidenceClass: 'EXTERNAL_BACKEND' });
  assert.equal(receipt.status, 'UNVERIFIED');
  assert.match(receipt.reason, /not executed/);
});

test('proof bundle rejects a tampered receipt', async () => {
  const receipt = await evaluateTheorem(fiveLevels[0], { value: 7 });
  const tampered = structuredClone(receipt);
  tampered.observations.value = 9;
  assert.throws(() => createProofBundle([tampered]), /valid sealed theorem receipts/);

  const bundle = await evaluateTheoremSuite(fiveLevels, { value: 7 });
  const resealedSummary = structuredClone(bundle);
  resealedSummary.counts.PASS = 0;
  const { bundleRoot, receipts, ...base } = resealedSummary;
  resealedSummary.bundleRoot = semanticHash(base);
  assert.equal(verifyProofBundle(resealedSummary), false);
});

test('maturity classification never promotes reference-only evidence to parity', async () => {
  const references = await Promise.all(REQUIRED_REFERENCE_DOMAINS.map(domain => evaluateTheoremSuite(
    fiveLevels.map(theorem => defineTheorem({ ...theorem, domain })),
    { value: 7 },
    { domain },
  )));
  const evidenceRoot = '0'.repeat(64);
  const partialDifferential = { status: 'PASS', evidenceClass: 'PARTIAL_PRODUCTION_DIFFERENTIAL', evidenceRoot };
  const fullDifferential = { status: 'PASS', evidenceClass: 'FULL_PRODUCTION_DIFFERENTIAL', evidenceRoot };
  const externalPasses = REQUIRED_F5_EXTERNAL_BACKEND_IDS.map(id => ({ id, status: 'PASS', evidenceClass: 'EXTERNAL_BACKEND', evidenceRoot }));
  assert.equal(classifyFormalMaturity({ referenceBundles: references.slice(0, 1) }).verdict, 'Candidate');
  assert.equal(classifyFormalMaturity({ referenceBundles: references }).verdict, 'F4 Verified');
  const tamperedReferences = structuredClone(references);
  tamperedReferences[0].receipts[0].status = 'FAIL';
  assert.equal(classifyFormalMaturity({ referenceBundles: tamperedReferences }).verdict, 'Blocked');
  assert.equal(classifyFormalMaturity({ referenceBundles: references, productionDifferentials: [{ status: 'PASS' }] }).verdict, 'F4 Verified');
  assert.equal(classifyFormalMaturity({ referenceBundles: references, productionDifferentials: [partialDifferential] }).verdict, 'F4.5 Partial Production Parity');
  assert.equal(classifyFormalMaturity({
    referenceBundles: references,
    productionDifferentials: [fullDifferential],
    externalBackends: externalPasses.slice(0, 1),
  }).verdict, 'F4.5 Partial Production Parity');
  assert.equal(classifyFormalMaturity({
    referenceBundles: references,
    productionDifferentials: [partialDifferential],
    externalBackends: externalPasses,
  }).verdict, 'F4.5 Partial Production Parity');
  assert.equal(classifyFormalMaturity({
    referenceBundles: references,
    productionDifferentials: [fullDifferential],
    externalBackends: [...externalPasses, externalPasses[0]],
  }).verdict, 'F4.5 Partial Production Parity');
  assert.equal(classifyFormalMaturity({
    referenceBundles: references,
    productionDifferentials: [fullDifferential],
    externalBackends: externalPasses,
  }).verdict, 'F5 Differentially Verified');
});
