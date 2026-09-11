import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  compileTypedNativeLink,
  compileTypedNativeLinkFromPackage,
  verifyTypedNativeLink,
  RCL_TYPED_NATIVE_LINK_FORMAT,
  runTypedPackageDemo,
} from '../src/index.mjs';

const typeModuleSources = {
  'core.rcltype': `module core
export record SpatialCommand<T> {
  id: Text
  payload: T
}`,
  'app.rcltype': `module app
import core
record Session {
  command: core.SpatialCommand<Text>
}`,
};

const source = `reality TypedAuthority {
  facet rncs.world.ready : Truth = true
  facet app.command : core.SpatialCommand<Text> = { id: "command-1", payload: "patch-heightfield" }
}`;

test('P3 typed native link executes the existing typed compiler and native VM with rooted parity', async () => {
  const result = await compileTypedNativeLink(source, { typeModuleSources });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.format, RCL_TYPED_NATIVE_LINK_FORMAT);
  assert.equal(result.receipt.status, 'CANDIDATE_EXECUTION_VERIFIED');
  assert.match(result.receipt.link_root, /^[0-9a-f]{64}$/);
  assert.match(result.receipt.type_modules.ir_root, /^[0-9a-f]{64}$/);
  assert.match(result.receipt.program.program_root, /^[0-9a-f]{64}$/);
  assert.equal(result.receipt.bytecode.typed_instruction_count, 1);
  assert.equal(result.receipt.execution.native.state_root_verified, true);
  assert.equal(result.receipt.execution.native.state_root_parity, true);
  assert.equal(result.receipt.execution.semantic_state_parity, true);
  assert.equal(result.receipt.authority.candidate_only, true);
  assert.equal(result.receipt.authority.canonical_write_authorized, false);
  assert.equal(result.receipt.package.lock_root, null);
  assert.deepEqual(verifyTypedNativeLink(result.receipt, { source, typeModuleReport: result.program.typeModules }), { ok: true, errors: [] });
});

test('P3 typed native link requires a typed module graph', async () => {
  const result = await compileTypedNativeLink(source);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, 'RCL_TYPED_LINK_TYPE_MODULES_REQUIRED');
});

test('P3 typed native package link consumes a verified manifest and lock root', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-typed-package-native-link-'));
  const packageDemo = runTypedPackageDemo({ baseDir: dir });
  assert.equal(packageDemo.ok, true);

  const result = await compileTypedNativeLinkFromPackage(dir);
  assert.equal(result.ok, true);
  assert.equal(result.packageVerification.ok, true);
  assert.equal(result.packageBuild.ok, true);
  assert.equal(result.receipt.package.lock_root, packageDemo.lockRoot);
  assert.equal(result.receipt.package.manifest_name, 'firstlight.typed');
  assert.equal(result.receipt.package.manifest_version, '0.1.0');
  assert.deepEqual(verifyTypedNativeLink(result.receipt, {
    source: result.packageBuild.source,
    typeModuleReport: result.packageBuild.typeModuleReport,
    packageLock: result.packageBuild.lock,
    packageLockRoot: packageDemo.lockRoot,
  }), { ok: true, errors: [] });
});

test('P3 typed native package link rejects a missing or drifted lock', async () => {
  const missingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-typed-package-native-missing-'));
  runTypedPackageDemo({ baseDir: missingDir });
  fs.rmSync(path.join(missingDir, 'rcl.package.lock.json'));
  const missing = await compileTypedNativeLinkFromPackage(missingDir);
  assert.equal(missing.ok, false);
  assert.equal(missing.diagnostics[0].code, 'RCL_TYPED_PACKAGE_LOCK_MISSING');

  const driftDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-typed-package-native-drift-'));
  runTypedPackageDemo({ baseDir: driftDir });
  fs.appendFileSync(path.join(driftDir, 'types', 'core.rcltype'), '\nexport alias Drift = Text\n');
  const drift = await compileTypedNativeLinkFromPackage(driftDir);
  assert.equal(drift.ok, false);
  assert.ok(drift.diagnostics.some(item => item.code === 'RCL_TYPED_PACKAGE_LOCK_MISMATCH'));
});

test('P3 typed native link rejects receipt and authority tampering', async () => {
  const result = await compileTypedNativeLink(source, { typeModuleSources });
  assert.equal(result.ok, true);

  const rootTampered = structuredClone(result.receipt);
  rootTampered.program.program_root = '0'.repeat(64);
  assert.deepEqual(verifyTypedNativeLink(rootTampered), { ok: false, errors: ['RCL_TYPED_LINK_ROOT_MISMATCH'] });

  const authorityTampered = structuredClone(result.receipt);
  authorityTampered.authority.canonical_write_authorized = true;
  assert.ok(verifyTypedNativeLink(authorityTampered).errors.includes('RCL_TYPED_LINK_ROOT_MISMATCH'));
  assert.ok(verifyTypedNativeLink(authorityTampered).errors.includes('RCL_TYPED_LINK_CANONICAL_WRITE_FORBIDDEN'));
});
