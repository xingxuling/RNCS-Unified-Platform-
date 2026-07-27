# RCL Foundation Native RNCS Evidence

- status: **pass**
- canonical RCL commit: `9d6a5e133a459bd9322fcef9514abbb9dddbfd88`
- scoped source root: `25356982e044edf50788c44cb48378d8fe1f5400fdb2caff034c6b8564375c4f` (25 files)
- Batch A provider: `rcl.foundation.batch-a`
- Batch A generation: 1 / `932cdfb284f297c0bb0eb655d04005403e879ab1b9a404ffacedba5a2b9b4b6a`
- Meta Batch B provider: `rcl.foundation.meta-batch-b`
- Meta Batch B generation: 2 / `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- Meta semantic state: `63cd16830a065e8f38d27c020e118d69dfae12f75702dce3ee400aa834141e7b`
- Batch C provider: `rcl.foundation.batch-c`
- Batch C generation: 3 / `9e73b28e35c1e79f6ebd81c77c9be4a0d788ce34ce56aacbf3f932c0aa018be3`
- Batch D provider: `rcl.foundation.batch-d`
- Batch D generation: 4 / `be4f3ec2e23b1de5c71a13a20da862fa617b695d443401c35de7e8a48572bdbd`
- Batch E provider: `rcl.foundation.batch-e`
- Batch E generation: 5 / `fb7a23235447aa97c6cff9646121cca3380e1f4fb84bbe94469089f912f3b1ec`
- Gateway runtime: `rncs.rcl-foundation-native` (18 registered runtimes)
- Gateway committed root: `39ac942239870c105c1894c9d81f292a823479626c0422215b3a392ea5baadb6`
- evidence root: `fed41df8555ae41dc9e1220bf74fa983c738f0cc017074c991c3c588e9be5fa2`

| Check | Status |
| --- | --- |
| rclSourceScopeVerified | pass |
| wholePackageIdentityNotClaimed | pass |
| batchAStandardResultCount | pass |
| metaStandardResultCount | pass |
| batchCStandardResultCount | pass |
| batchDStandardResultCount | pass |
| batchEStandardResultCount | pass |
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
| gatewayBatchECommitted | pass |

Batch A, Meta Batch B, Batch C, Batch D, and Batch E remain bridge mode. Human approval and commit confirmation are separate calls. Declared Foundation syntax is not counted as Native VM lowering.
