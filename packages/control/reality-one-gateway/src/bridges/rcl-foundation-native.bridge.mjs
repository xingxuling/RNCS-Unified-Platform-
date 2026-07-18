export async function createBridge({ module }) {
  const health = () => ({
    status: 'ok',
    protocol: module.RCL_FOUNDATION_RNCS_BRIDGE_FORMAT,
    version: module.RCL_FOUNDATION_RNCS_BRIDGE_VERSION,
    mode: 'bridge',
    provider_id: 'rcl.foundation.batch-a',
    native_result_count: 6,
    authority: 'proposal-human-approval-explicit-commit',
  });

  return {
    health,
    invoke: async (action, payload = {}) => {
      if (action === 'health') return health();
      if (action === 'prepare') {
        return module.prepareFoundationNativeRncsTransition(
          payload.request ?? {},
          payload.options ?? {},
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
