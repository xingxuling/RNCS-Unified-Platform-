import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  compileStudioWorldBodyCandidate,
  summarizeStudioWorldBodyCandidate,
} from '../src/index.mjs';

const { session, compilation: networkCompilation } = createStudioNetworkWorld();
const bundle = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
console.log(JSON.stringify(summarizeStudioWorldBodyCandidate(bundle), null, 2));
