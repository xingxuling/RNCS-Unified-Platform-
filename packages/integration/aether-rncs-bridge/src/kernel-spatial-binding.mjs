import { spatial, spatialVsr } from '@taowind/reality-simulation-runtime';
import { verifyEntityStateBatch } from '@taowind/rncs-core-contract';

function batchFrom(source, query = {}) {
  const batch = source && typeof source.readStateBatch === 'function' ? source.readStateBatch(query) : source?.format === 'rncs.entity-state-batch.v0.1' ? source : null;
  if (batch && verifyEntityStateBatch(batch)) return batch;
  if (batch) throw new TypeError('KERNEL_STATE_BATCH_ROOT_MISMATCH');
  throw new TypeError('KERNEL_STATE_BATCH_SOURCE_INVALID');
}

export function readKernelStateBatch(source, query = {}) {
  return batchFrom(source, query);
}

export async function materializeKernelStateToRSR(source, { query = {}, ...options } = {}) {
  const batch = batchFrom(source, query);
  const rsr = await spatial();
  return rsr.materializeKernelStateBatch(batch, options);
}

export async function projectKernelStateToReality(source, { query = {}, ...options } = {}) {
  const batch = batchFrom(source, query);
  const vsr = await spatialVsr();
  return vsr.projectKernelStateBatchToVSR(batch, options);
}
