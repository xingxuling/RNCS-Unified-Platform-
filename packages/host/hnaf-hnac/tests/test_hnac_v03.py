from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path

import wasmtime

from hnac.capsule import deterministic_zip_write, pack, read_zip_unique
from hnac.errors import HNACError
from hnac.host import HostProfile
from hnac.runtime import contract_capsule, plan_capsule, run_capsule
from hnac.trust import sign, verify

ROOT = Path(__file__).resolve().parents[1]


def write_component_project(root: Path, wat: str, *, capabilities: list[dict] | None = None, export: str = "run") -> Path:
    source = root / "source"
    (source / "components").mkdir(parents=True)
    (source / "wit").mkdir(parents=True)
    (source / "components" / "main.component.wasm").write_bytes(wasmtime.wat2wasm(wat))
    shutil.copy2(ROOT / "wit" / "hnaf-capabilities.wit", source / "wit" / "hnaf-capabilities.wit")
    manifest = {
        "format_version": "0.3",
        "app": {"id": "org.taowind.hnac.test-component", "name": "Test Component", "version": "0.3.0"},
        "execution": {
            "primary": {
                "profile": "wasm-component@1",
                "entry": "components/main.component.wasm",
                "world": "hnaf:capabilities/application@0.3.0",
                "export": export,
                "contract": "wit/hnaf-capabilities.wit",
            },
            "limits": {"fuel": 1000, "memory_bytes": 1048576},
        },
        "capabilities": capabilities or [],
        "security": {"sandbox": "deny-by-default", "signature": "optional"},
        "compatibility": {"min_runtime": "0.3.0"},
    }
    (source / "hnac.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
    capsule = root / "test.hnac"
    pack(source, capsule)
    return capsule


class HNACV03Tests(unittest.TestCase):
    def test_component_pack_sign_verify_plan_run_and_trace(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "hello-component.hnac"
            state = root / "state"
            trace = root / "trace.jsonl"
            pack(ROOT / "examples" / "hello-component", capsule)
            sign(capsule, root / "dev.pem", "test-signer")
            verified = verify(capsule, require_signature=True)
            self.assertEqual(verified["signature"]["status"], "valid")

            plan = plan_capsule(capsule, require_signature=True)
            self.assertEqual(plan["runtime"], "0.8.0")
            self.assertEqual(plan["negotiation"]["execution"]["profile"], "wasm-component@1")
            self.assertEqual(plan["component_contract"]["contract_status"], "valid")
            self.assertEqual(plan["component_contract"]["exports"]["run"]["result"], "u64")
            self.assertGreaterEqual(len(plan["component_contract"]["composition_graph"]["nodes"]), 8)

            result = run_capsule(capsule, state_root=state, trace_path=trace, require_signature=True)
            self.assertEqual(result["execution"]["profile"], "wasm-component@1")
            self.assertIsInstance(result["execution"]["result"], int)
            self.assertGreater(result["execution"]["fuel_remaining"], 0)
            events = [json.loads(line) for line in trace.read_text("utf-8").splitlines()]
            self.assertTrue(any(event["event"] == "capability.call" for event in events))
            self.assertTrue(any(event["event"] == "execution.completed" for event in events))

    def test_contract_command_reports_typed_interfaces(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            capsule = Path(directory) / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            report = contract_capsule(capsule)
            imports = report["contract"]["imports"]
            self.assertEqual(imports["hnaf:capabilities/log@0.3.0"]["exports"]["write"]["params"][0]["type"], "string")
            self.assertEqual(imports["hnaf:capabilities/clock@0.3.0"]["exports"]["now-unix-ms"]["result"], "u64")

    def test_component_import_requires_manifest_declaration_and_lease(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            shutil.copytree(ROOT / "examples" / "hello-component", source)
            manifest_path = source / "hnac.json"
            manifest = json.loads(manifest_path.read_text("utf-8"))
            manifest["capabilities"] = [item for item in manifest["capabilities"] if item["id"] != "host.clock"]
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
            capsule = root / "undeclared.hnac"
            pack(source, capsule)
            with self.assertRaisesRegex(HNACError, "undeclared capabilities|without leases"):
                run_capsule(capsule, state_root=root / "state")

    def test_unknown_component_import_is_rejected_before_instantiation(self) -> None:
        wat = '''(component
          (import "evil:host/root@1.0.0" (instance))
          (core module $m (func (export "run")))
          (core instance $i (instantiate $m))
          (func (export "run") (canon lift (core func $i "run")))
        )'''
        with tempfile.TemporaryDirectory() as directory:
            capsule = write_component_project(Path(directory), wat)
            with self.assertRaisesRegex(HNACError, "Unknown Component Model imports"):
                contract_capsule(capsule)

    def test_wit_signature_mismatch_is_rejected(self) -> None:
        wat = '''(component
          (import "hnaf:capabilities/log@0.3.0" (instance $log
            (export "write" (func (param "message" u32)))
          ))
          (core module $m (func (export "run")))
          (core instance $i (instantiate $m))
          (func (export "run") (canon lift (core func $i "run")))
        )'''
        caps = [{"id": "host.log", "version": "1", "required": True, "scope": "session"}]
        with tempfile.TemporaryDirectory() as directory:
            capsule = write_component_project(Path(directory), wat, capabilities=caps)
            with self.assertRaisesRegex(HNACError, "WIT interface mismatch"):
                contract_capsule(capsule)

    def test_missing_component_entry_export_is_rejected(self) -> None:
        wat = '''(component
          (core module $m (func (export "start")))
          (core instance $i (instantiate $m))
          (func (export "start") (canon lift (core func $i "start")))
        )'''
        with tempfile.TemporaryDirectory() as directory:
            capsule = write_component_project(Path(directory), wat)
            with self.assertRaisesRegex(HNACError, "must export run"):
                contract_capsule(capsule)

    def test_component_fuel_stops_nonterminating_guest(self) -> None:
        wat = '''(component
          (core module $m
            (func (export "run")
              (loop $loop br $loop)
            )
          )
          (core instance $i (instantiate $m))
          (func (export "run") (canon lift (core func $i "run")))
        )'''
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = write_component_project(root, wat)
            with self.assertRaisesRegex(HNACError, "fuel|Component execution failed"):
                run_capsule(capsule, state_root=root / "state")

    def test_core_only_host_selects_core_compatibility_executor(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            host = HostProfile(
                id="hnaf.test.core-only",
                family="desktop",
                execution_profiles=["wasm-core@1"],
                capabilities={
                    "host.log": ["1"],
                    "host.clock": ["1"],
                    "environment.summary": ["1"],
                    "storage.kv": ["1"],
                },
            )
            plan = plan_capsule(capsule, host=host)
            self.assertEqual(plan["negotiation"]["execution"]["profile"], "wasm-core@1")
            result = run_capsule(capsule, host=host, state_root=root / "state")
            self.assertEqual(result["execution"]["profile"], "wasm-core@1")

    def test_component_and_core_executors_share_semantic_capabilities(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            component_trace = root / "component.jsonl"
            core_trace = root / "core.jsonl"
            run_capsule(capsule, state_root=root / "component-state", trace_path=component_trace)
            core_host = HostProfile(
                id="hnaf.test.core-parity",
                family="desktop",
                execution_profiles=["wasm-core@1"],
                capabilities={
                    "host.log": ["1"],
                    "host.clock": ["1"],
                    "environment.summary": ["1"],
                    "storage.kv": ["1"],
                },
            )
            run_capsule(capsule, host=core_host, state_root=root / "core-state", trace_path=core_trace)

            def called_capabilities(path: Path) -> set[str]:
                return {
                    event["capability"]
                    for event in (json.loads(line) for line in path.read_text("utf-8").splitlines())
                    if event["event"] == "capability.call"
                }

            component_caps = called_capabilities(component_trace)
            core_caps = called_capabilities(core_trace)
            self.assertTrue({"host.log", "host.clock"}.issubset(component_caps))
            self.assertTrue({"host.log", "host.clock"}.issubset(core_caps))

    def test_restricted_host_selects_declarative_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            sign(capsule, root / "dev.pem", "test-signer")
            host = HostProfile.load(ROOT / "host-profiles" / "restricted-kiosk.json")
            plan = plan_capsule(capsule, host=host)
            self.assertEqual(plan["negotiation"]["execution"]["profile"], "declarative-v0")
            result = run_capsule(capsule, state_root=root / "state", host=host)
            self.assertEqual(result["execution"]["profile"], "declarative-v0")

    def test_contract_file_is_part_of_the_capsule_boundary(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            shutil.copytree(ROOT / "examples" / "hello-component", source)
            (source / "wit" / "hnaf-capabilities.wit").unlink()
            with self.assertRaisesRegex(HNACError, "Execution contract not found"):
                pack(source, root / "broken.hnac")

    def test_tamper_detection(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            capsule = Path(directory) / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            files = read_zip_unique(capsule)
            files["components/main.component.wasm"] += b"tamper"
            deterministic_zip_write(capsule, files)
            with self.assertRaises(HNACError):
                verify(capsule)

    def test_host_signature_policy_blocks_unsigned_capsule(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            capsule = Path(directory) / "hello.hnac"
            pack(ROOT / "examples" / "hello-component", capsule)
            host = HostProfile.load(ROOT / "host-profiles" / "restricted-kiosk.json")
            with self.assertRaisesRegex(HNACError, "Signature required"):
                plan_capsule(capsule, host=host)

    def test_v02_core_capsule_remains_runnable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "core.hnac"
            pack(ROOT / "examples" / "hello-wasm", capsule)
            result = run_capsule(capsule, state_root=root / "state")
            self.assertEqual(result["execution"]["profile"], "wasm-core@1")

    def test_legacy_v01_capsule_remains_runnable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "legacy.hnac"
            pack(ROOT / "examples" / "legacy-v01", capsule)
            result = run_capsule(capsule, state_root=root / "state")
            self.assertEqual(result["execution"]["profile"], "declarative-v0")


if __name__ == "__main__":
    unittest.main()
