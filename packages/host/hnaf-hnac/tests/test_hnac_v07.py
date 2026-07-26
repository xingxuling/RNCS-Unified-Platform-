from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from hnac.adaptive_interface import interface_from_capsule_files, route_event
from hnac.capsule import pack
from hnac.host import HostProfile
from hnac.intent_fabric import bind_event, bind_intent, execute_intent
from hnac.runtime import plan_capsule, run_capsule
from hnac.projection import project_web
from hnac.trust import verify

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "examples" / "capability-binding-v07"
JS_HOST = ROOT / "hnac" / "hosts" / "js" / "hnac-js.mjs"
HOST = ROOT / "host-profiles" / "desktop-reference.json"
SUBJECT = {
    "subject_id": "subject:test",
    "kind": "human",
    "roles": ["owner"],
    "scopes": ["state.write", "capsule.read", "remote.execute"],
}
NOW = "2026-07-01T12:00:00Z"


class HNACV07CapabilityBindingTests(unittest.TestCase):
    def _capsule(self, root: Path) -> tuple[Path, dict, dict, HostProfile]:
        capsule = root / "capability-binding.hnac"
        pack(EXAMPLE, capsule)
        verified = verify(capsule)
        graph = interface_from_capsule_files(verified["manifest"], verified["files"])
        assert graph is not None
        return capsule, verified, graph, HostProfile.load(HOST)

    def test_v07_capsule_packs_plans_and_runs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            capsule, _, _, host = self._capsule(Path(directory))
            plan = plan_capsule(capsule, host=host)
            self.assertEqual(plan["runtime"], "0.8.0")
            self.assertEqual(plan["format_version"], "0.7")
            self.assertEqual(plan["interface_projection"]["graph_version"], "0.7")
            self.assertTrue(plan["interface_projection"]["intents"][0].get("goal"))
            result = run_capsule(capsule, host=host, state_root=Path(directory) / "launch-state")
            self.assertEqual(result["runtime"], "0.8.0")
            self.assertEqual(result["state"]["generation"], 1)

    def test_intent_binding_uses_cnp_and_aaf(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, verified, graph, host = self._capsule(Path(directory))
            binding = bind_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, subject=SUBJECT, payload={"amount": 2}, now=NOW,
            )
            self.assertEqual(binding["status"], "bound")
            self.assertEqual(binding["authority"]["status"], "approved")
            self.assertEqual(binding["negotiation"]["plan"]["status"], "satisfied")
            self.assertEqual(len(binding["candidate_chain"]), 2)
            self.assertEqual(binding["negotiation_backend"], "local-pinned-cnp-v0.1")
            self.assertEqual(binding["authority_backend"], "local-pinned-aaf-v0.1")

    def test_authorized_provider_fallback_executes_and_records_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            receipt = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state",
                subject=SUBJECT, payload={"amount": 3}, now=NOW,
            )
            self.assertEqual(receipt["status"], "executed")
            self.assertEqual([item["status"] for item in receipt["attempts"]], ["failed", "succeeded"])
            self.assertEqual(receipt["selected"]["provider_id"], "provider:local-fallback")
            self.assertEqual(receipt["result"]["after"], 3)
            self.assertEqual(len(receipt["evidence_root"]), 64)
            second = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state",
                subject=SUBJECT, payload={"amount": 2}, now=NOW,
            )
            self.assertEqual(second["result"]["before"], 3)
            self.assertEqual(second["result"]["after"], 5)

    def test_high_risk_intent_requires_explicit_approval(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, verified, graph, host = self._capsule(Path(directory))
            pending = bind_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.high-risk", host=host, subject=SUBJECT, payload={"message": "test"}, now=NOW,
            )
            self.assertEqual(pending["status"], "pending_approval")
            approved = bind_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.high-risk", host=host, subject=SUBJECT, payload={"message": "test"}, now=NOW,
                approve=True,
            )
            self.assertEqual(approved["status"], "bound")
            self.assertEqual(approved["authority"]["status"], "approved")
            self.assertIsNotNone(approved["generated_approval"])

    def test_event_routes_into_capability_binding(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, verified, graph, host = self._capsule(Path(directory))
            routed = bind_event(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                event={"mode": "keyboard", "signal": "Enter"}, host=host,
                subject=SUBJECT, payload={"amount": 1}, now=NOW,
            )
            self.assertEqual(routed["route"]["intent"], "app.run")
            self.assertEqual(routed["binding"]["status"], "bound")

    def test_web_projection_contains_gateway_capability_host(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule = root / "binding.hnac"
            pack(EXAMPLE, capsule)
            output = root / "web"
            projected = project_web(capsule, output)
            self.assertIn("capability-binding.js", projected["files"])
            config = json.loads((output / "config.json").read_text("utf-8"))
            self.assertEqual(config["gateway_url"], "./api")
            provenance = json.loads((output / "projection.json").read_text("utf-8"))
            self.assertEqual(provenance["projection"]["capability_binding"], "hnaf.intent-capability-binding.v0.7")

    def test_python_and_node_capability_snapshots_are_equal(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            capsule, verified, graph, host = self._capsule(root)
            python_binding = bind_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, subject=SUBJECT, payload={"amount": 2}, now=NOW,
            )
            completed = subprocess.run(
                [
                    "node", str(JS_HOST), "intent-bind", str(capsule),
                    "--host-profile", str(HOST), "--intent", "app.run",
                    "--subject", json.dumps(SUBJECT, ensure_ascii=False, separators=(",", ":")),
                    "--payload", '{"amount":2}', "--now", NOW,
                ],
                capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            node_binding = json.loads(completed.stdout)
            self.assertEqual(node_binding["capability_snapshot"], python_binding["capability_snapshot"])
            self.assertEqual(node_binding["negotiation"]["request"]["request_root"], python_binding["negotiation"]["request"]["request_root"])
            self.assertEqual(node_binding["negotiation"]["plan"]["plan_root"], python_binding["negotiation"]["plan"]["plan_root"])
            self.assertEqual(node_binding["authority"]["decision_root"], python_binding["authority"]["decision_root"])


if __name__ == "__main__":
    unittest.main()
