from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from hnac.adaptive_interface import compile_projection, load_graph, route_event
from hnac.capsule import pack
from hnac.conformance import cross_host_conformance
from hnac.host import HostProfile
from hnac.projection import project_web
from hnac.runtime import plan_capsule, run_capsule

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "examples" / "adaptive-interface-v06"
GRAPH = EXAMPLE / "ui" / "main.aip.json"
JS_HOST = ROOT / "hnac" / "hosts" / "js" / "hnac-js.mjs"


class HNACV06AdaptiveInterfaceTests(unittest.TestCase):
    def test_v06_capsule_packs_plans_and_runs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "adaptive.hnac"
            packed = pack(EXAMPLE, capsule)
            self.assertEqual(packed["app"]["version"], "0.6.0")
            plan = plan_capsule(capsule)
            self.assertEqual(plan["runtime"], "0.8.0")
            self.assertEqual(plan["format_version"], "0.6")
            self.assertEqual(plan["interface_projection"]["profile"], "desktop")
            result = run_capsule(capsule, state_root=root / "state")
            self.assertEqual(result["runtime"], "0.8.0")
            self.assertEqual(result["state"]["generation"], 1)
            self.assertEqual(result["interface_projection"]["semantic_snapshot"], plan["interface_projection"]["semantic_snapshot"])

    def test_five_projection_profiles_are_deterministic_and_distinct(self) -> None:
        graph = load_graph(GRAPH)
        expected = {
            "desktop-reference.json": "desktop",
            "tablet-reference.json": "tablet",
            "phone-reference.json": "phone",
            "accessibility-reference.json": "accessibility",
            "spatial-reference.json": "spatial",
        }
        snapshots: set[str] = set()
        for filename, profile in expected.items():
            host = HostProfile.load(ROOT / "host-profiles" / filename)
            first = compile_projection(graph, host)
            second = compile_projection(graph, host)
            self.assertEqual(first, second)
            self.assertEqual(first["profile"], profile)
            self.assertEqual(first["root"], "document.main")
            self.assertTrue(first["nodes"])
            snapshots.add(first["semantic_snapshot"])
        self.assertEqual(len(snapshots), 5)

    def test_accessibility_visibility_and_spatial_fallback(self) -> None:
        graph = load_graph(GRAPH)
        accessibility = compile_projection(graph, HostProfile.load(ROOT / "host-profiles" / "accessibility-reference.json"))
        ids = {node["id"] for node in accessibility["nodes"]}
        self.assertIn("information.accessibility", ids)
        spatial = next(node for node in accessibility["nodes"] if node["id"] == "spatial.anchor")
        self.assertEqual(spatial["affordance"], "spatial-description")
        phone = compile_projection(graph, HostProfile.load(ROOT / "host-profiles" / "phone-reference.json"))
        phone_ids = {node["id"] for node in phone["nodes"]}
        self.assertNotIn("information.accessibility", phone_ids)
        phone_spatial = next(node for node in phone["nodes"] if node["id"] == "spatial.anchor")
        self.assertEqual(phone_spatial["affordance"], "spatial-fallback-card")

    def test_input_modes_route_to_same_intent(self) -> None:
        graph = load_graph(GRAPH)
        host = HostProfile.load(ROOT / "host-profiles" / "spatial-reference.json")
        events = [
            {"mode": "pointer", "signal": "activate", "target": "action.run"},
            {"mode": "keyboard", "signal": "Enter"},
            {"mode": "voice", "signal": "utterance", "value": "运行应用"},
            {"mode": "neural", "signal": "confirm"},
        ]
        for event in events:
            result = route_event(graph, host, event)
            self.assertEqual(result["status"], "resolved")
            self.assertEqual(result["intent"], "app.run")
        unsupported = route_event(graph, host, {"mode": "touch", "signal": "tap"})
        self.assertEqual(unsupported["status"], "unsupported-mode")

    def test_python_and_node_semantic_snapshots_are_equal(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "adaptive.hnac"
            pack(EXAMPLE, capsule)
            host_path = ROOT / "host-profiles" / "desktop-reference.json"
            python_plan = plan_capsule(capsule, host=HostProfile.load(host_path))["interface_projection"]
            completed = subprocess.run(
                ["node", str(JS_HOST), "plan", str(capsule), "--host-profile", str(host_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            node_plan = json.loads(completed.stdout)["interface_projection"]
            self.assertEqual(node_plan["semantic_snapshot"], python_plan["semantic_snapshot"])
            self.assertEqual(node_plan["nodes"], python_plan["nodes"])

    def test_v06_cross_host_conformance_includes_state_and_interface(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "adaptive.hnac"
            pack(EXAMPLE, capsule)
            report = cross_host_conformance(capsule, JS_HOST, workspace=root / "conformance")
            self.assertTrue(report["comparison"]["equivalent"])
            self.assertTrue(report["state_equivalence"]["equivalent"])
            self.assertTrue(report["interface_equivalence"]["equivalent"])
            self.assertEqual(report["contract_version"], "0.7")

    def test_web_projection_contains_v06_host_and_provenance(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "adaptive.hnac"
            pack(EXAMPLE, capsule)
            output = root / "web"
            projected = project_web(capsule, output, autorun=True)
            self.assertIn("adaptive-interface.js", projected["files"])
            provenance = json.loads((output / "projection.json").read_text("utf-8"))
            self.assertEqual(provenance["version"], "0.8")
            self.assertEqual(provenance["projection"]["interface_fabric"], "hnaf.adaptive-interface.v0.6")
            self.assertTrue((output / "application.hnac").is_file())


if __name__ == "__main__":
    unittest.main()
