import {
  RealityGraph,
  RealityTransitionVM,
  authorizeTransition,
  buildTransitionEnvelope,
  compileEvidence,
  createRealityObject,
  createRealityRelation
} from '../src/index.mjs';

const alice = createRealityObject({id: 'subject:alice', kind: 'subject', state: {role: 'keeper'}});
const door = createRealityObject({id: 'object:door', kind: 'door', state: {locked: true}});
const room = createRealityObject({id: 'place:room', kind: 'room', state: {name: 'archive'}});
const graph = new RealityGraph({worldId: 'world:demo'})
  .addObject(alice)
  .addObject(door)
  .addObject(room)
  .addRelation(createRealityRelation({type: 'owns', from: alice.id, to: door.id}))
  .addRelation(createRealityRelation({type: 'located-in', from: door.id, to: room.id}));

const envelope = authorizeTransition(buildTransitionEnvelope({
  transitionId: 'transition:demo-unlock',
  worldId: graph.worldId,
  baseRoot: graph.realityRoot,
  actor: alice.id,
  intent: {goal: 'unlock archive door'},
  operations: [{op: 'set-state', objectId: door.id, state: {locked: false}}]
}), {decisionId: 'decision:demo-unlock', principal: 'authority:demo', scope: [door.id]});

const vm = new RealityTransitionVM();
const preview = vm.execute(graph, envelope);
const evidence = compileEvidence({
  envelope,
  receipt: preview.receipt,
  observations: [{
    id: 'observation:demo',
    source: 'fixture:demo',
    claim: 'the transition preview unlocks the door',
    value: {locked: preview.snapshot.objects.find((object) => object.id === door.id).state.locked},
    observedAt: preview.snapshot.logicalTime
  }]
});

console.log(JSON.stringify({
  graphRootBefore: graph.realityRoot,
  query: graph.query({from: alice.id, depth: 2}),
  proposalRoot: envelope.proposalRoot,
  decisionRoot: envelope.authority.decisionRoot,
  previewReceipt: preview.receipt,
  evidenceRoot: evidence.evidenceRoot
}, null, 2));
