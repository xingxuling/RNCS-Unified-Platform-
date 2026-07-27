# RCL Foundation Native RNCS Evidence

- status: **pass**
- canonical RCL commit: `549231a9b9d916d8790aa089cf0ccdd034603df9`
- scoped source root: `3d88cb487b070423de06fc46ccf5ef703b0ddee90f99094d5d7630c391df03ad` (19 files)
- Batch A provider: `rcl.foundation.batch-a`
- Batch A generation: 1 / `932cdfb284f297c0bb0eb655d04005403e879ab1b9a404ffacedba5a2b9b4b6a`
- Meta Batch B provider: `rcl.foundation.meta-batch-b`
- Meta Batch B generation: 2 / `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- Meta semantic state: `63cd16830a065e8f38d27c020e118d69dfae12f75702dce3ee400aa834141e7b`
- Batch C provider: `rcl.foundation.batch-c`
- Batch C generation: 3 / `9e73b28e35c1e79f6ebd81c77c9be4a0d788ce34ce56aacbf3f932c0aa018be3`
- Gateway runtime: `rncs.rcl-foundation-native` (18 registered runtimes)
- Gateway committed root: `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- evidence root: `8ce7ad45291857ebcc90e661ae6e1358e42ff2fc9aabbf5a5a4719e9a79ce00c`

| Check | Status |
| --- | --- |
| rclSourceScopeVerified | pass |
| wholePackageIdentityNotClaimed | pass |
| batchAStandardResultCount | pass |
| metaStandardResultCount | pass |
| batchCStandardResultCount | pass |
| nativeReplay | pass |
| proposalsVerified | pass |
| humanApprovalRecorded | pass |
| commitReceiptsBound | pass |
| generationContinuity | pass |
| metaTimelineMutation | pass |
| metaAccelerationBound | pass |
| metaCompressionRestore | pass |
| gatewayRuntimeRegistered | pass |
| gatewayAuthoritySeparated | pass |
| gatewayMetaCommitted | pass |
| gatewayBatchCCommitted | pass |

Batch A, Meta Batch B, and Batch C remain bridge mode. Human approval and commit confirmation are separate calls. Declared Foundation syntax is not counted as Native VM lowering.
