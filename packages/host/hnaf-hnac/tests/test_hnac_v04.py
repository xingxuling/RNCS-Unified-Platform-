from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from hnac.capsule import deterministic_zip_write, pack, read_zip_unique
from hnac.conformance import compare_traces, cross_host_conformance
from hnac.projection import project_web
from hnac.runtime import plan_capsule, run_capsule
from hnac.trust import sign, verify

ROOT = Path(__file__).resolve().parents[1]
JS_HOST = ROOT / "hosts" / "js" / "hnac-js.mjs"
WEB_RUNTIME = ROOT / "hosts" / "web" / "runtime.js"


class HNACV04Tests(unittest.TestCase):
    def make_signed_capsule(self, root: Path) -> Path:
        capsule = root / "hello-portable-v0.4.hnac"
        pack(ROOT / "examples" / "hello-portable", capsule)
        sign(capsule, root / "dev.pem", "v0.4-test")
        return capsule

    def run_node(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["node", str(JS_HOST), *args], capture_output=True, text=True, check=False)

    def test_v04_component_capsule_runs_on_python_host(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            plan = plan_capsule(capsule, require_signature=True)
            self.assertEqual(plan["runtime"], "0.8.0")
            self.assertEqual(plan["format_version"], "0.4")
            self.assertEqual(plan["negotiation"]["execution"]["profile"], "wasm-component@1")
            result = run_capsule(capsule, state_root=root / "state", require_signature=True)
            self.assertEqual(result["execution"]["profile"], "wasm-component@1")

    def test_same_signed_capsule_runs_on_javascript_host(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            completed = self.run_node(
                "run",
                str(capsule),
                "--state-root",
                str(root / "state"),
                "--trace",
                str(root / "trace.jsonl"),
                "--require-signature",
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            result = json.loads(completed.stdout)
            self.assertEqual(result["runtime"], "0.8.0-js")
            self.assertEqual(result["signature"]["status"], "valid")
            self.assertEqual(result["execution"]["profile"], "wasm-core@1")
            self.assertEqual(result["negotiation"]["unsupported_profiles"], ["wasm-component@1"])

    def test_python_and_javascript_hosts_are_semantically_equivalent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            report = cross_host_conformance(
                capsule,
                JS_HOST,
                require_signature=True,
                workspace=root / "lab",
            )
            self.assertTrue(report["comparison"]["equivalent"], report["comparison"]["differences"])
            self.assertTrue(report["state_equivalence"]["equivalent"], report["state_equivalence"])
            self.assertEqual(report["selected_profiles"], {"python": "wasm-core@1", "javascript": "wasm-core@1"})
            self.assertGreaterEqual(report["comparison"]["left_events"], 8)

    def test_javascript_host_detects_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            files = read_zip_unique(capsule)
            files["components/main.wasm"] += b"tamper"
            deterministic_zip_write(capsule, files)
            completed = self.run_node("verify", str(capsule), "--require-signature")
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("Integrity mismatch", completed.stderr)

    def test_web_projection_preserves_capsule_and_provenance(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            output = root / "pwa"
            result = project_web(capsule, output, autorun=True, require_signature=True)
            self.assertEqual(result["signature"]["status"], "valid")
            self.assertTrue((output / "application.hnac").is_file())
            self.assertTrue((output / "service-worker.js").is_file())
            config = json.loads((output / "config.json").read_text("utf-8"))
            self.assertTrue(config["autorun"])
            self.assertEqual(config["capsule"], "./application.hnac")
            self.assertEqual(config["gateway_url"], "./api")
            provenance = json.loads((output / "projection.json").read_text("utf-8"))
            self.assertFalse(provenance["projection"]["canonical_application"])
            self.assertEqual(provenance["source"]["capsule_sha256"], result["capsule_sha256"])
            self.assertEqual(verify(output / "application.hnac", require_signature=True)["signature"]["status"], "valid")

    def test_browser_runtime_verifies_and_executes_capsule_logic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = self.make_signed_capsule(root)
            smoke = root / "browser-smoke.mjs"
            smoke.write_text(
                f'''import fs from "node:fs";\n'''
                '''Object.defineProperty(globalThis, "navigator", {value: {userAgent:"smoke", language:"en", onLine:true, deviceMemory:8, platform:"node"}, configurable:true});\n'''
                '''const memory = new Map();\n'''
                '''Object.defineProperty(globalThis, "localStorage", {value: {getItem:(k)=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)}, configurable:true});\n'''
                f'''const runtime = await import({json.dumps(WEB_RUNTIME.as_uri())});\n'''
                f'''const data = fs.readFileSync({json.dumps(str(capsule))});\n'''
                '''const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);\n'''
                '''const verified = await runtime.verifyCapsule(buffer, true);\n'''
                '''const events = []; const result = await runtime.runCapsule(buffer, (event)=>events.push(event), {requireSignature:true});\n'''
                '''console.log(JSON.stringify({signature:verified.signature.status, profile:result.execution.profile, calls:events.filter((e)=>e.event==="capability.call").map((e)=>e.capability)}));\n''',
                "utf-8",
            )
            completed = subprocess.run(["node", str(smoke)], capture_output=True, text=True, check=False)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            result = json.loads(completed.stdout)
            self.assertEqual(result["signature"], "valid")
            self.assertEqual(result["profile"], "wasm-core@1")
            self.assertEqual(result["calls"], ["host.log", "host.clock", "host.log"])

    def test_javascript_host_blocks_component_only_capsule(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            shutil.copytree(ROOT / "examples" / "hello-portable", source)
            manifest_path = source / "hnac.json"
            manifest = json.loads(manifest_path.read_text("utf-8"))
            manifest["execution"]["alternatives"] = []
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
            capsule = root / "component-only.hnac"
            pack(source, capsule)
            completed = self.run_node("run", str(capsule), "--state-root", str(root / "state"))
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("Launch blocked", completed.stderr)


    def test_javascript_host_rejects_invalid_security_boundary(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            shutil.copytree(ROOT / "examples" / "hello-portable", source)
            manifest_path = source / "hnac.json"
            manifest = json.loads(manifest_path.read_text("utf-8"))
            manifest["security"]["sandbox"] = "allow-by-default"
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
            # Python pack rejects this malformed source, so create a structurally valid
            # capsule first and then replace both manifest and integrity index.
            good = root / "good.hnac"
            pack(ROOT / "examples" / "hello-portable", good)
            files = read_zip_unique(good)
            files["hnac.json"] = manifest_path.read_bytes()
            from hnac.capsule import make_integrity_index
            payload = {name: data for name, data in files.items() if not name.startswith(("integrity/", "signatures/", "attestations/"))}
            files["integrity/index.json"] = json.dumps(make_integrity_index(payload), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
            deterministic_zip_write(good, files)
            completed = self.run_node("verify", str(good))
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("deny-by-default", completed.stderr)

    def test_trace_comparator_exposes_semantic_divergence(self) -> None:
        left = [
            {"event": "host.context"},
            {"event": "capability.call", "capability": "host.log", "method": "write", "lease_id": "a"},
        ]
        right = [
            {"event": "host.context"},
            {"event": "capability.call", "capability": "host.clock", "method": "now", "lease_id": "b"},
        ]
        result = compare_traces(left, right)
        self.assertFalse(result["equivalent"])
        self.assertEqual(result["differences"][0]["index"], 1)


if __name__ == "__main__":
    unittest.main()
