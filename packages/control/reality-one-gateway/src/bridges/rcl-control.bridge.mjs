export async function createBridge({module}) {
  const health = () => ({
    status: 'ok',
    protocol: 'rncs.rcl-control.v0.3',
    rcl_language_version: module.RCL_LANGUAGE_VERSION,
    rcl_bytecode_version: module.RCL_BYTECODE_VERSION,
    native_execution: true,
    parity_verification: true,
  });

  return {
    health,
    invoke: async (action, payload = {}) => {
      if (action === 'health') return health();
      if (action === 'compileExecute') {
        return module.compileRclSource(payload.source, {
          verifyParity: payload.verifyParity !== false,
          timeout: Number(payload.timeout ?? 30_000),
        });
      }
      if (action === 'controlPlane') return module.buildRclControlPlane();
      throw Object.assign(new Error(`Unsupported RCL control action: ${action}`), { code: 'RCL_CONTROL_ACTION_UNSUPPORTED' });
    },
  };
}
