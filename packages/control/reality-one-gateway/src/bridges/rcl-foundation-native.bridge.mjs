export async function createBridge({ module }) {
  const health = () => ({
    status: 'ok',
    protocol: module.RCL_FOUNDATION_RNCS_BRIDGE_FORMAT,
    version: module.RCL_FOUNDATION_RNCS_BRIDGE_VERSION,
    mode: 'bridge',
    provider_id: 'rcl.foundation.batch-a',
    native_result_count: 6,
    provider_ids: [
      'rcl.foundation.batch-a',
      'rcl.foundation.meta-batch-b',
      'rcl.foundation.batch-c',
    ],
    batches: module.RCL_FOUNDATION_RNCS_BATCHES,
    authority: 'proposal-human-approval-explicit-commit',
  });

  return {
    health,
    invoke: async (action, payload = {}) => {
      if (action === 'health') return health();
      if (action === 'prepare') {
        const options = {
          ...(payload.options ?? {}),
          ...(payload.batch ? { batch: payload.batch } : {}),
        };
        return module.prepareFoundationNativeRncsTransition(
          payload.request ?? {},
          options,
        );
      }
      if (action === 'authorize') {
        return module.authorizeFoundationNativeRncsTransition(
          payload.prepared,
          payload.approval ?? {},
        );
      }
      if (action === 'commit') {
        return module.commitFoundationNativeRncsTransition(
          payload.authorized,
          payload.confirmation ?? {},
        );
      }
      if (action === 'verify') {
        return module.verifyFoundationNativeRncsTransition(payload.transition);
      }
      throw Object.assign(
        new Error(`Unsupported RCL Foundation Native action: ${action}`),
        { code: 'RCL_FOUNDATION_NATIVE_ACTION_UNSUPPORTED' },
      );
    },
  };
}
