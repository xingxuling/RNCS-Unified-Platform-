#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const javaSource = path.join(root, 'apps', 'aether-earth-android', 'app', 'src', 'main', 'java', 'com', 'taowind', 'aetherearth', 'FoundationProviderBridge.java');
const worldEngine = path.join(root, 'apps', 'aether-earth-android', 'app', 'src', 'main', 'java', 'com', 'taowind', 'aetherearth', 'WorldStateEngine.java');
const rclAsset = path.join(root, 'apps', 'aether-earth-android', 'app', 'src', 'main', 'assets', 'rcl', 'world-foundation.rcl');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-earth-foundation-'));
const verifier = path.join(temp, 'FoundationProviderVerifier.java');

const harness = `
import com.taowind.aetherearth.FoundationProviderBridge;
import java.nio.file.Files;
import java.nio.file.Path;

public final class FoundationProviderVerifier {
  public static void main(String[] args) throws Exception {
    String source = Files.readString(Path.of(args[0]));
    FoundationProviderBridge baseline = new FoundationProviderBridge(path -> source);
    FoundationProviderBridge.Policy baselinePolicy = baseline.policy();
    String changedSource = source.replace(
      "physical.biomass_regrowth_per_day : Number = 0.004",
      "physical.biomass_regrowth_per_day : Number = 0.2"
    );
    FoundationProviderBridge changed = new FoundationProviderBridge(path -> changedSource);
    double before = baselinePolicy.regrowBiomass(0.5);
    double after = changed.policy().regrowBiomass(0.5);
    if (Math.abs(before - 0.504) > 0.000001 || Math.abs(after - 0.7) > 0.000001 || before == after) {
      throw new AssertionError("RCL rule did not change world biomass behavior");
    }
    FoundationProviderBridge.AdvanceDecision denied = baseline.evaluateAdvance(10001);
    if (denied.accepted || denied.effectiveDays != 0) throw new AssertionError("authority boundary did not reject");
    if (!denied.replayRoot.equals(baseline.evaluateAdvance(10001).replayRoot)) throw new AssertionError("replay root drift");
    String result = denied.toStandardRuntimeResultJson();
    for (String key : new String[] {"proposal", "constraints", "stateDelta", "evidence", "confidence", "authorityRequired", "replayMetadata", "fourR"}) {
      if (!result.contains("\\\"" + key + "\\\"")) throw new AssertionError("missing result key: " + key);
    }
    boolean mismatchRejected = false;
    try {
      FoundationProviderBridge.parseWorldPolicy(source.replace(FoundationProviderBridge.CONTRACT_ROOT, "wrong-root"));
    } catch (IllegalArgumentException expected) {
      mismatchRejected = true;
    }
    if (!mismatchRejected) throw new AssertionError("manifest mismatch accepted");
    System.out.println("{\\\"ok\\\":true,\\\"mode\\\":\\\"bridge\\\",\\\"baselineBiomass\\\":" + before + ",\\\"changedBiomass\\\":" + after + ",\\\"authorityRejected\\\":true,\\\"deterministicReplayRoot\\\":true}");
  }
}
`;

try {
  fs.writeFileSync(verifier, harness);
  const compile = spawnSync('javac', ['-encoding', 'UTF-8', '-d', temp, javaSource, verifier], { encoding: 'utf8', windowsHide: true });
  assert.equal(compile.status, 0, `javac failed\n${compile.stderr}\n${compile.stdout}`);

  const run = spawnSync('java', ['-cp', temp, 'FoundationProviderVerifier', rclAsset], { encoding: 'utf8', windowsHide: true });
  assert.equal(run.status, 0, `provider verifier failed\n${run.stderr}\n${run.stdout}`);
  const result = JSON.parse(run.stdout.trim());
  assert.equal(result.ok, true);

  const engineSource = fs.readFileSync(worldEngine, 'utf8');
  assert.match(engineSource, /foundation\.evaluateAdvance\(days\)/u);
  assert.match(engineSource, /policy\.regrowBiomass/u);
  assert.match(engineSource, /policy\.dailyEnergyCost/u);
  assert.match(engineSource, /foundationRuntime/u);
  console.log(JSON.stringify({ ...result, worldEngineConsumesProvider: true }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
