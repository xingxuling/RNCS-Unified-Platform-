export async function createBridge({ module }) {
  const runtime = module.createRuntime({ seed: 20260704 });
  return {
    health: () => module.health(),
    invoke: async (action, payload = {}) => {
      if (action === 'health') return module.health();
      if (action === 'advance') return runtime.advance(Number(payload.days ?? 1), { crystalInterval: Number(payload.crystalInterval ?? 60) });
      if (action === 'report') return runtime.report();
      if (action === 'snapshot') return runtime.snapshot({ includeEncyclopedia: payload.includeEncyclopedia !== false });
      if (action === 'compress') return runtime.compress();
      if (action === 'setTimeScale') return { timeScale: runtime.setTimeScale(Number(payload.scale ?? 1)) };
      throw Object.assign(new Error(`Unsupported Aether Earth action: ${action}`), { code: 'AETHER_EARTH_ACTION_UNSUPPORTED' });
    },
  };
}
