from __future__ import annotations

import copy
import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from websockets.sync.server import serve as websocket_serve

from hnac.adaptive_interface import interface_from_capsule_files
from hnac.capsule import pack
from hnac.errors import HNACError
from hnac.execution_fabric import verify_provider_registry
from hnac.host import HostProfile
from hnac.intent_fabric import bind_intent, execute_intent, load_binding_assets
from hnac.runtime import plan_capsule, run_capsule
from hnac.trust import verify
from rfe_core_sdk import RealityStore
from rncs_contract import verify as verify_envelope

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "examples" / "remote-execution-v08"
HOST = ROOT / "host-profiles" / "desktop-reference.json"
SUBJECT = {
    "subject_id": "subject:test",
    "kind": "human",
    "roles": ["owner"],
    "scopes": ["state.write", "remote.execute", "*"],
}
NOW = "2026-07-01T12:00:00Z"


class EchoHandler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        length = int(self.headers.get("content-length", "0"))
        request = json.loads(self.rfile.read(length).decode("utf-8"))
        body = json.dumps(
            {
                "http": request["payload"],
                "idempotency_key": request["context"]["idempotency_key"],
                "path": self.path,
            },
            ensure_ascii=False,
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):  # noqa: A003
        return


class HNACV08RemoteExecutionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.http = ThreadingHTTPServer(("127.0.0.1", 18708), EchoHandler)
        cls.http_thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.http_thread.start()

        def ws_handler(socket):
            request = json.loads(socket.recv())
            socket.send(json.dumps({
                "websocket": request["payload"],
                "idempotency_key": request["context"]["idempotency_key"],
            }, ensure_ascii=False))

        cls.ws = websocket_serve(ws_handler, "127.0.0.1", 18709)
        cls.ws_thread = threading.Thread(target=cls.ws.serve_forever, daemon=True)
        cls.ws_thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.http.shutdown()
        cls.http.server_close()
        cls.ws.shutdown()

    def _capsule(self, root: Path):
        capsule = root / "remote-execution.hnac"
        pack(EXAMPLE, capsule)
        verified = verify(capsule)
        graph = interface_from_capsule_files(verified["manifest"], verified["files"])
        assert graph is not None
        return capsule, verified, graph, HostProfile.load(HOST)

    def test_v08_capsule_packs_plans_and_runs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            capsule, _, _, host = self._capsule(Path(directory))
            plan = plan_capsule(capsule, host=host)
            self.assertEqual(plan["runtime"], "0.8.0")
            self.assertEqual(plan["format_version"], "0.8")
            result = run_capsule(capsule, host=host, state_root=Path(directory) / "state")
            self.assertEqual(result["runtime"], "0.8.0")

    def test_provider_supply_chain_is_verified_and_tampering_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, verified, _, _ = self._capsule(Path(directory))
            assets = load_binding_assets(verified["manifest"], verified["files"])
            self.assertTrue(assets["supply_chain"]["verified"])
            providers = copy.deepcopy(assets["providers"])
            providers[0]["capabilities"][0]["cost"]["cpu_millis"] = 999
            with self.assertRaises(HNACError):
                verify_provider_registry(providers, require_signed=True)

    def test_v08_proposal_is_valid_rncs_envelope(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, verified, graph, host = self._capsule(Path(directory))
            binding = bind_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, subject=SUBJECT, payload={"amount": 1}, now=NOW,
            )
            self.assertEqual(binding["status"], "bound")
            self.assertTrue(verify_envelope(binding["envelope"])["valid"])
            self.assertEqual(binding["supply_chain"]["unsigned"], [])

    def test_builtin_fallback_circuit_breaker_and_rfe_commit(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            first = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"amount": 2}, now=NOW, idempotency_key="counter-1",
            )
            self.assertEqual(first["status"], "executed")
            self.assertEqual(first["selected"]["provider_id"], "provider:local-fallback")
            self.assertEqual(first["rfe_commit"]["status"], "committed")
            self.assertEqual(first["rfe_commit"]["generation"]["generation"], 1)
            self.assertEqual([x["status"] for x in first["attempts"]], ["failed", "failed", "succeeded"])

            second = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"amount": 1}, now=NOW, idempotency_key="counter-2",
            )
            self.assertEqual(second["attempts"][0]["status"], "skipped-circuit-open")
            self.assertEqual(second["result"]["before"], 2)
            self.assertEqual(second["rfe_commit"]["generation"]["generation"], 2)
            store = RealityStore(root / "state" / ".rfe")
            self.assertEqual(store.current_generation()["realityRevision"], 2)

    def test_idempotency_replays_original_receipt_without_new_generation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            first = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"amount": 4}, now=NOW, idempotency_key="same-key",
            )
            replay = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.run", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"amount": 4}, now=NOW, idempotency_key="same-key",
            )
            self.assertEqual(replay["status"], "idempotent-replay")
            self.assertEqual(replay["original_receipt_root"], first["receipt_root"])
            store = RealityStore(root / "state" / ".rfe")
            self.assertEqual(store.current_generation()["realityRevision"], 1)

    def test_http_provider_executes_inside_network_allowlist(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            receipt = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.http", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"message": "你好"}, now=NOW, idempotency_key="http-1",
            )
            self.assertEqual(receipt["status"], "executed")
            self.assertEqual(receipt["result"]["http"]["message"], "你好")
            self.assertEqual(receipt["attempts"][0]["transport"]["kind"], "http")
            self.assertEqual(receipt["rfe_commit"]["status"], "committed")

    def test_websocket_provider_executes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            receipt = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.websocket", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"message": "ws"}, now=NOW, idempotency_key="ws-1",
            )
            self.assertEqual(receipt["status"], "executed")
            self.assertEqual(receipt["result"]["websocket"]["message"], "ws")
            self.assertEqual(receipt["attempts"][0]["transport"]["kind"], "websocket")

    def test_local_process_requires_approval_and_runs_under_sandbox(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            pending = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.process", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"message": "process"}, now=NOW, idempotency_key="process-pending",
            )
            self.assertEqual(pending["status"], "not-executed")
            approved = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.process", host=host, state_root=root / "state", subject=SUBJECT,
                payload={"message": "process"}, now=NOW, idempotency_key="process-1", approve=True,
            )
            self.assertEqual(approved["status"], "executed")
            self.assertEqual(approved["result"]["process"]["message"], "process")
            self.assertTrue(approved["attempts"][0]["sandbox"]["deny_by_default"])

    def test_timeout_and_cancel_are_recorded(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, verified, graph, host = self._capsule(root)
            timeout = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.timeout", host=host, state_root=root / "state", subject=SUBJECT,
                payload={}, now=NOW, idempotency_key="timeout-1", approve=True,
            )
            self.assertEqual(timeout["status"], "failed")
            self.assertIn("timed out", timeout["attempts"][0]["error"]["message"])

            cancel = root / "cancel.flag"
            cancel.write_text("cancel", "utf-8")
            cancelled = execute_intent(
                manifest=verified["manifest"], files=verified["files"], graph=graph,
                intent_id="app.http", host=host, state_root=root / "cancel-state", subject=SUBJECT,
                payload={}, now=NOW, idempotency_key="cancel-1", cancel_path=cancel,
            )
            self.assertEqual(cancelled["status"], "cancelled")
            self.assertEqual(cancelled["attempts"][0]["status"], "cancelled")


if __name__ == "__main__":
    unittest.main()
