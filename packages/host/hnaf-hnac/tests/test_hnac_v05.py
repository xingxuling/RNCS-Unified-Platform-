from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from hnac.capsule import pack
from hnac.errors import HNACError
from hnac.runtime import run_capsule
from hnac.state_fabric import MigrationGraph, PortableStateStore, compute_state_root

ROOT = Path(__file__).resolve().parents[1]
NODE_STATE = ROOT / "hosts" / "js" / "state-fabric.mjs"
WEB_STATE = ROOT / "hosts" / "web" / "state-fabric.js"


class HNACV05PortableStateTests(unittest.TestCase):
    APP_ID = "org.taowind.hnac.state-test"

    def test_content_root_is_equal_across_python_node_and_browser_modules(self) -> None:
        partitions = {
            "portable": {"profile": {"name": "杜衡界", "language": "zh-CN"}, "count": 3},
            "device_private": {"window": {"width": 1280}},
            "secret": {"token": "not-exported-in-plain-text"},
            "cache": {"projection": "v1"},
        }
        expected = compute_state_root(self.APP_ID, "2", partitions)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixture = root / "state.json"
            fixture.write_text(json.dumps({"app_id": self.APP_ID, "schema_version": "2", "partitions": partitions}, ensure_ascii=False), "utf-8")
            node = subprocess.run(["node", str(NODE_STATE), "root", str(fixture)], capture_output=True, text=True, check=False)
            self.assertEqual(node.returncode, 0, node.stderr)
            self.assertEqual(node.stdout.strip(), expected)

            smoke = root / "web-root.mjs"
            smoke.write_text(
                f'''import fs from "node:fs";\n'''
                f'''const module = await import({json.dumps(WEB_STATE.as_uri())});\n'''
                f'''const value = JSON.parse(fs.readFileSync({json.dumps(str(fixture))}, "utf8"));\n'''
                '''console.log(await module.computeStateRoot(value.app_id, value.schema_version, value.partitions));\n''',
                "utf-8",
            )
            web = subprocess.run(["node", str(smoke)], capture_output=True, text=True, check=False)
            self.assertEqual(web.returncode, 0, web.stderr)
            self.assertEqual(web.stdout.strip(), expected)

    def test_partition_boundary_export_encrypt_import_and_restore(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = PortableStateStore(root / "source", self.APP_ID, schema_version="2", replica_id="replica-source")
            source.set("profile", {"name": "杜衡界"}, partition="portable")
            source.set("device", "desktop-only", partition="device_private")
            source.set("token", "classified", partition="secret")
            source.set("render", "cache-v1", partition="cache")
            source.set("session", "temporary", partition="ephemeral")
            first = source.snapshot(label="before-export")
            source.set("profile", {"name": "changed"}, partition="portable")
            restored = source.restore(first["snapshot_root"])
            self.assertEqual(restored["state_root"], first["state_root"])
            self.assertEqual(source.get("profile", partition="portable"), {"name": "杜衡界"})

            bundle_path = root / "state.hnaf-state.json"
            export = source.export_bundle(bundle_path, include_cache=True, include_secret=True, password="correct horse battery staple")
            bundle_text = bundle_path.read_text("utf-8")
            self.assertNotIn("classified", bundle_text)
            bundle = PortableStateStore.verify_bundle(bundle_path)
            self.assertNotIn("device_private", bundle["partitions"])
            self.assertNotIn("ephemeral", bundle["partitions"])
            self.assertIn("secret_envelope", bundle)
            self.assertEqual(export["bundle_root"], bundle["bundle_root"])

            target = PortableStateStore(root / "target", self.APP_ID, schema_version="2", replica_id="replica-target")
            with self.assertRaisesRegex(HNACError, "decryption|authentication"):
                target.import_bundle(bundle_path, password="wrong password")
            result = target.import_bundle(bundle_path, password="correct horse battery staple")
            self.assertTrue(result["imported"])
            self.assertEqual(target.get("profile", partition="portable"), {"name": "杜衡界"})
            self.assertEqual(target.get("token", partition="secret"), "classified")
            self.assertIsNone(target.get("device", None, partition="device_private"))

    def test_conflicts_are_explicit_and_reconciliation_is_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            remote = PortableStateStore(root / "remote", self.APP_ID, schema_version="2", replica_id="remote")
            remote.set("theme", "blue")
            bundle = root / "remote.json"
            remote.export_bundle(bundle)

            local = PortableStateStore(root / "local", self.APP_ID, schema_version="2", replica_id="local")
            local.set("theme", "silver")
            with self.assertRaisesRegex(HNACError, "conflict"):
                local.import_bundle(bundle)
            result = local.import_bundle(bundle, policy="record-conflicts")
            self.assertEqual(result["conflicts"], 1)
            self.assertEqual(local.get("theme"), "silver")
            self.assertTrue((local.conflicts_dir / f"{result['conflict_roots'][0]}.json").is_file())

            remote_wins = PortableStateStore(root / "remote-wins", self.APP_ID, schema_version="2")
            remote_wins.set("theme", "silver")
            result2 = remote_wins.import_bundle(bundle, policy="prefer-remote")
            self.assertEqual(result2["conflicts"], 1)
            self.assertEqual(remote_wins.get("theme"), "blue")

    def test_migration_graph_transforms_incoming_schema_before_commit(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = PortableStateStore(root / "source-v1", self.APP_ID, schema_version="1")
            source.set("user", {"name": "杜衡界"})
            source.set("legacy_render", "obsolete", partition="cache")
            bundle = root / "v1.json"
            source.export_bundle(bundle, include_cache=True)

            graph_file = root / "migrations.json"
            graph_file.write_text(json.dumps({
                "format": "hnaf.state-migrations.v0.5",
                "app_id": self.APP_ID,
                "migrations": [{
                    "from": "1",
                    "to": "2",
                    "operations": [
                        {"op": "rename", "partition": "portable", "from": "user.name", "to": "profile.display_name"},
                        {"op": "set", "partition": "portable", "path": "profile.language", "value": "zh-CN"},
                        {"op": "delete", "partition": "cache", "path": "legacy_render"},
                    ],
                }],
            }, ensure_ascii=False), "utf-8")
            target = PortableStateStore(root / "target-v2", self.APP_ID, schema_version="2")
            result = target.import_bundle(bundle, migrations=MigrationGraph.load(graph_file))
            self.assertEqual(len(result["migration_path"]), 1)
            self.assertEqual(target.get("profile"), {"display_name": "杜衡界", "language": "zh-CN"})
            self.assertNotIn("legacy_render", target.read_partition("cache"))

    def test_v05_capsule_runs_with_five_partitions_and_autosnapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "portable-state.hnac"
            packed = pack(ROOT / "examples" / "portable-state-v05", capsule)
            self.assertEqual(packed["app"]["version"], "0.5.0")
            result = run_capsule(capsule, state_root=root / "state")
            self.assertEqual(result["runtime"], "0.8.0")
            self.assertEqual(result["execution"]["profile"], "declarative-v0")
            self.assertIsNotNone(result["snapshot"])
            self.assertEqual(result["state"]["generation"], 1)
            store = PortableStateStore(root / "state", "org.taowind.hnac.portable-state-demo", schema_version="2")
            self.assertEqual(store.get("profile", partition="portable")["language"], "zh-CN")
            self.assertEqual(store.get("window", partition="device_private")["width"], 1280)
            self.assertEqual(store.get("demo_token", partition="secret"), "secret-value")
            self.assertEqual(store.get("compiled_projection", partition="cache"), "cache-v1")
            self.assertEqual(store.get("session", None, partition="ephemeral"), None)

    def test_browser_host_executes_v05_capsule_with_equivalent_state_root(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "portable-state.hnac"
            pack(ROOT / "examples" / "portable-state-v05", capsule)
            python_result = run_capsule(capsule, state_root=root / "python-state")
            smoke = root / "browser-v05.mjs"
            runtime = ROOT / "hosts" / "web" / "runtime.js"
            script = (
                'import fs from "node:fs";\n'
                'Object.defineProperty(globalThis, "navigator", {value: {userAgent:"state-smoke", language:"zh-CN", onLine:true, deviceMemory:8, platform:"node"}, configurable:true});\n'
                'const memory = new Map();\n'
                'Object.defineProperty(globalThis, "localStorage", {value: {getItem:(k)=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v))}, configurable:true});\n'
                f'const runtime = await import({json.dumps(runtime.as_uri())});\n'
                f'const data = fs.readFileSync({json.dumps(str(capsule))});\n'
                'const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);\n'
                'const result = await runtime.runCapsule(buffer);\n'
                'console.log(JSON.stringify({state_root:result.state.state_root,generation:result.state.generation,partition_keys:result.state.partition_keys}));\n'
            )
            smoke.write_text(script, "utf-8")
            completed = subprocess.run(["node", str(smoke)], capture_output=True, text=True, check=False)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            browser = json.loads(completed.stdout)
            self.assertEqual(browser["state_root"], python_result["state"]["state_root"])
            self.assertEqual(browser["generation"], 1)
            self.assertEqual(browser["partition_keys"], {"portable": 1, "device_private": 1, "secret": 1, "cache": 1})

    def test_bundle_tampering_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = PortableStateStore(root / "state", self.APP_ID)
            store.set("count", 1)
            bundle_path = root / "bundle.json"
            store.export_bundle(bundle_path)
            bundle = json.loads(bundle_path.read_text("utf-8"))
            bundle["partitions"]["portable"]["count"] = 2
            bundle_path.write_text(json.dumps(bundle), "utf-8")
            with self.assertRaisesRegex(HNACError, "root mismatch"):
                PortableStateStore.verify_bundle(bundle_path)


if __name__ == "__main__":
    unittest.main()
