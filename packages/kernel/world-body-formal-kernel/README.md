# @taowind/world-body-formal-kernel

This package provides the machine-checkable receipt format shared by the RSR, VSR, and joint World Body theorem suites. It also ships an executable RCL semantic kernel.

The JavaScript predicate layer checks concrete World Body inputs. The aggregate RCL kernel and eight independently compilable formal drafts mirror the cross-layer invariants and authority boundary and are verified separately through the repository's real RCL compiler/reference runtime/native VM path. See `docs/RCL-FORMAL-DRAFTS.md`.

The RCL execution proves only that this declared kernel compiles and has native/reference execution parity for the exercised RCL subset. It does not prove a GPU backend, a commercial physics engine, or all RCL language semantics.

```bash
npm test --workspace @taowind/world-body-formal-kernel
npm run verify:rcl --workspace @taowind/world-body-formal-kernel
```
