# Reality Kernel v0.2 verification matrix

| ID | Source | Observable result | Test seam | Command | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RK-01 | Object ABI | same object has same root; tampering is rejected | `createRealityObject`, `verifyRealityObject` | `npm test -- --test-name-pattern="object ABI"` | 1 passing test | GREEN |
| RK-02 | Reality graph | relation traversal is deterministic and depth-bounded | `RealityGraph.query` | `npm test -- --test-name-pattern="graph query"` | 1 passing test | GREEN |
| RK-03 | Transition envelope | approved transition commits; stale or unauthorized transition leaves graph unchanged | `RealityTransitionVM.execute`, `commit` | `npm test -- --test-name-pattern="transition"` | 3 passing tests | GREEN |
| RK-04 | Evidence root | evidence root verifies and changes when evidence changes | `compileEvidence`, `verifyEvidence` | `npm test -- --test-name-pattern="evidence"` | 2 passing tests | GREEN |
| RK-05 | RFE bridge | bridge forwards deterministic RFE operations and evidence without owning persistence | `commitToRfe` | `npm test -- --test-name-pattern="RFE"` | 1 passing test | GREEN |
| RK-06 | Release | package test and demo pass on Node 20+ | package scripts | `npm test && npm run demo` | 13 tests + demo + syntax checks | GREEN |
| RK-07 | Typed continuity | claims advance by sequence/epoch and reject replay, gaps, stale fencing, and unauthorized forks | `createContinuityClaim`, `ContinuityLedger` | `npm test -- --test-name-pattern="typed continuity|continuity ledger"` | 2 passing tests | GREEN |
| RK-08 | Sovereignty-bound commit | transition VM and RFE bridge bind actor/transition to continuity and advance the ledger only after commit | `RealityTransitionVM`, `commitToRfe` | `npm test -- --test-name-pattern="continuity|RFE"` | 3 passing tests | GREEN |
