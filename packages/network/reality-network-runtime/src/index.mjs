export * from './protocol.mjs';
export * from './authority.mjs';
export * from './world-fixture.mjs';
export * from './transport.mjs';
export * from './interpolation.mjs';
export * from './server.mjs';
export * from './client.mjs';
export * from './runtime.mjs';
export * from './relevance.mjs';
import {NETWORK_PROTOCOL,NETWORK_RUNTIME_ID,NETWORK_VERSION} from './protocol.mjs';
export const health=()=>({status:'ok',runtime_id:NETWORK_RUNTIME_ID,version:NETWORK_VERSION,protocol:NETWORK_PROTOCOL,rsrAuthorityProtocol:'rsr.authoritative-state.v0.7'});

import {createNetworkRuntime} from './runtime.mjs';
export const createRuntime=createNetworkRuntime;
