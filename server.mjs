import {createTaoWindRealityService} from './packages/integration/taowind-reality-mcp/src/service.mjs';

// Vercel detects this root server entry and deploys the exported Express app as one Function.
// Long-lived engineering work is delegated to TAOWIND_EXECUTION_WORKER_URL.
const service=await createTaoWindRealityService();
export default service.app;
