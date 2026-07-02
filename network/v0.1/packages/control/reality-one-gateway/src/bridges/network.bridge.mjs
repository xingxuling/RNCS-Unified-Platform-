export async function createBridge({module}) {
  const runtime = module.createRuntime();
  return {
    health: () => runtime.invoke('health', {}),
    invoke: (action, payload) => runtime.invoke(action, payload)
  };
}
