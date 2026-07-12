import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runConstitutionalAcceptanceScenario } from './reference-js/src/constitutional-reality-v100.js';

const vectorPath = new URL('./conformance/vectors/c12-constitutional-reality.json', import.meta.url);
const vector = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));
const statePath = path.join(os.tmpdir(), `rfe-c12-vector-${process.pid}.json`);
try {
  const expected = runConstitutionalAcceptanceScenario(vector, statePath);
  vector.expected = expected;
  vector.helpers = {
    oldConfigurationHash: expected.oldConfiguration.configurationHash,
    newConfigurationHash: expected.newConfiguration.configurationHash,
    transitionHash: expected.transition.transitionHash,
    oldAuthorizationCertificateHash: expected.oldAuthorizationCertificate.oldAuthorizationCertificateHash,
    newAcceptanceCertificateHash: expected.newAcceptanceCertificate.newAcceptanceCertificateHash,
    jointActivationCertificateHash: expected.jointActivationCertificate.jointActivationCertificateHash,
    finalTopologyRoot: expected.finalTopologyRoot,
    finalFederationRoot: expected.finalFederationRoot,
    confirmationCertificateHash: expected.confirmationCertificate.confirmationCertificateHash,
  };
  fs.writeFileSync(vectorPath, `${JSON.stringify(vector, null, 2)}\n`);
  console.log(JSON.stringify(expected, null, 2));
} finally {
  fs.rmSync(statePath, { force: true });
}
