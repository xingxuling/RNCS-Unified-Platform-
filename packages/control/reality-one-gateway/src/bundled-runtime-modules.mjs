import * as aafModule from '@taowind/agent-authority-fabric';
import * as aafBridge from './bridges/aaf.bridge.mjs';
import * as aetherEarthModule from '@taowind/aether-earth-runtime';
import * as aetherEarthBridge from './bridges/aether-earth.bridge.mjs';
import * as aetherworldModule from '@taowind/aether-rncs-bridge';
import * as aetherworldBridge from './bridges/aetherworld-native.bridge.mjs';
import * as behaviorModule from '@taowind/reality-behavior-fabric';
import * as behaviorBridge from './bridges/behavior.bridge.mjs';
import * as cnpModule from '@taowind/capability-negotiation-protocol';
import * as cnpBridge from './bridges/cnp.bridge.mjs';
import * as developerModule from '@taowind/developer-execution-runtime';
import * as developerBridge from './bridges/developer-execution.bridge.mjs';
import * as dmlModule from '@taowind/dml-core-runtime';
import * as dmlBridge from './bridges/dml-core.bridge.mjs';
import * as icarModule from '@taowind/icar-native-envelope-runtime';
import * as icarBridge from './bridges/icar.bridge.mjs';
import * as lafModule from '@taowind/living-artifact-format';
import * as lafBridge from './bridges/laf.bridge.mjs';
import * as networkModule from '@taowind/reality-network-runtime';
import * as networkBridge from './bridges/network.bridge.mjs';
import * as ragfModule from '@taowind/reality-asset-genesis-fabric';
import * as ragfBridge from './bridges/ragf.bridge.mjs';
import * as rbfModule from '@taowind/reality-branch-fabric';
import * as rbfBridge from './bridges/rbf.bridge.mjs';
import * as rclControlModule from '@taowind/rncs-rcl-control-plane';
import * as rclControlBridge from './bridges/rcl-control.bridge.mjs';
import * as rfeModule from '@taowind/rfe-core-sdk';
import * as rfeBridge from './bridges/rfe.bridge.mjs';
import * as rncsCoreModule from '@taowind/rncs-core-contract';
import * as rncsCoreBridge from './bridges/rncs-core.bridge.mjs';
import * as rsrModule from '@taowind/reality-simulation-runtime';
import * as rsrBridge from './bridges/rsr.bridge.mjs';
import * as vsrModule from '@taowind/visual-state-runtime';
import * as vsrBridge from './bridges/vsr.bridge.mjs';

export const BUNDLED_RUNTIME_MODULES = new Map([
  ['@taowind/agent-authority-fabric', { module: aafModule, bridge: aafBridge }],
  ['@taowind/aether-earth-runtime', { module: aetherEarthModule, bridge: aetherEarthBridge }],
  ['@taowind/aether-rncs-bridge', { module: aetherworldModule, bridge: aetherworldBridge }],
  ['@taowind/reality-behavior-fabric', { module: behaviorModule, bridge: behaviorBridge }],
  ['@taowind/capability-negotiation-protocol', { module: cnpModule, bridge: cnpBridge }],
  ['@taowind/developer-execution-runtime', { module: developerModule, bridge: developerBridge }],
  ['@taowind/dml-core-runtime', { module: dmlModule, bridge: dmlBridge }],
  ['@taowind/icar-native-envelope-runtime', { module: icarModule, bridge: icarBridge }],
  ['@taowind/living-artifact-format', { module: lafModule, bridge: lafBridge }],
  ['@taowind/reality-network-runtime', { module: networkModule, bridge: networkBridge }],
  ['@taowind/reality-asset-genesis-fabric', { module: ragfModule, bridge: ragfBridge }],
  ['@taowind/reality-branch-fabric', { module: rbfModule, bridge: rbfBridge }],
  ['@taowind/rncs-rcl-control-plane', { module: rclControlModule, bridge: rclControlBridge }],
  ['@taowind/rfe-core-sdk', { module: rfeModule, bridge: rfeBridge }],
  ['@taowind/rncs-core-contract', { module: rncsCoreModule, bridge: rncsCoreBridge }],
  ['@taowind/reality-simulation-runtime', { module: rsrModule, bridge: rsrBridge }],
  ['@taowind/visual-state-runtime', { module: vsrModule, bridge: vsrBridge }],
]);
