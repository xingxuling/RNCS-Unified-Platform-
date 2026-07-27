# RCL Foundation Native RNCS Evidence

- status: **pass**
- canonical RCL commit: `0857429f0c120982f1e895c741c22ab936ddac9e`
- scoped source root: `6f4b98e09899daa2df6d211693ed4d715a8778483ee998149c83dfd3b1810a2d` (22 files)
- Batch A provider: `rcl.foundation.batch-a`
- Batch A generation: 1 / `932cdfb284f297c0bb0eb655d04005403e879ab1b9a404ffacedba5a2b9b4b6a`
- Meta Batch B provider: `rcl.foundation.meta-batch-b`
- Meta Batch B generation: 2 / `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- Meta semantic state: `63cd16830a065e8f38d27c020e118d69dfae12f75702dce3ee400aa834141e7b`
- Batch C provider: `rcl.foundation.batch-c`
- Batch C generation: 3 / `9e73b28e35c1e79f6ebd81c77c9be4a0d788ce34ce56aacbf3f932c0aa018be3`
- Batch D provider: `rcl.foundation.batch-d`
- Batch D generation: 4 / `be4f3ec2e23b1de5c71a13a20da862fa617b695d443401c35de7e8a48572bdbd`
- Gateway runtime: `rncs.rcl-foundation-native` (18 registered runtimes)
- Gateway committed root: `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- evidence root: `32286848581dad52396106a67e8bd41f31963fc2473cd503b163e2d5039bb9db`

| Check | Status |
| --- | --- |
| rclSourceScopeVerified | pass |
| wholePackageIdentityNotClaimed | pass |
| batchAStandardResultCount | pass |
| metaStandardResultCount | pass |
| batchCStandardResultCount | pass |
| batchDStandardResultCount | pass |
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
| gatewayBatchDCommitted | pass |

Batch A, Meta Batch B, Batch C, and Batch D remain bridge mode. Human approval and commit confirmation are separate calls. Declared Foundation syntax is not counted as Native VM lowering.
