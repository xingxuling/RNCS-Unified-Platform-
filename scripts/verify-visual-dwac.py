"""Execute RAGF factory-result verification through an explicitly selected DWAC checkout.

No donor code is copied. DWAC owns graph scheduling/operation receipts; the RNCS
provider owns Visual IR validation. This is local verification, not generation.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

RNCS = Path(__file__).resolve().parents[1]
NODE_VERIFY = r"""
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const p=JSON.parse(fs.readFileSync(0,'utf8'));
const {verifyVisualArtifacts}=await import(pathToFileURL(p.module));
const {verifySeal}=await import(pathToFileURL(p.canonical));
const bytes=Buffer.from(p.document_base64,'base64');
const d=JSON.parse(bytes.toString('utf8'));
const digest=createHash('sha256').update(bytes).digest('hex');
const validEnvelope=d.format==='ragf.visual-factory-result.v0.1' &&
  d.status==='LOCAL_CANDIDATE_EXECUTED' && d.candidate_only===true &&
  d.commit_status==='NOT_COMMITTED' && /^[a-f0-9]{64}$/.test(d.plan_root) &&
  verifySeal(d,'result_root') && digest===p.document_sha256;
const report=verifyVisualArtifacts(d.output,p.artifacts.map(a=>({id:a.id,bytes:Buffer.from(a.base64,'base64')})));
const receiptsValid=Array.isArray(d.receipts)&&d.receipts.length>0&&d.receipts.every(r=>verifySeal(r,'receipt_root'))&&d.receipts.at(-1).output_root===d.output?.visual_ir_root;
console.log(JSON.stringify({valid:validEnvelope&&receiptsValid&&report.valid,
  factory_result_root:d.result_root,plan_root:d.plan_root,visual_ir_root:d.output?.visual_ir_root,
  source_sha256:digest,artifact_count:p.artifacts.length,report}));
"""


def sha(data):
    return hashlib.sha256(data).hexdigest()


def execute(dwac_repo: Path, factory_result: Path, artifact_dir: Path, *, node="node", tamper=False):
    repo = dwac_repo.resolve(strict=True)
    required = repo / "structural_generation/dwac_structural/operation_worker.py"
    if not required.is_file():
        raise ValueError("DWAC_OPERATION_RUNTIME_MISSING")
    sys.path[:0] = [str(repo), str(repo / "structural_generation")]
    from dwac_runtime import UnifiedStore, WorkerBus
    from dwac_structural.artifact_graph import ArtifactGraph, ArtifactNode
    from dwac_structural.artifact_types import ArtifactTypeRef
    from dwac_structural.artifact_store import ContentAddressedArtifactStore
    from dwac_structural.operation_worker import ArtifactOperationWorker
    from dwac_structural.universal_artifact import UniversalArtifactIntent
    from dwac_structural.universal_compiler import execute_artifact_graph

    raw = factory_result.resolve(strict=True).read_bytes()
    document = json.loads(raw)
    directory = artifact_dir.resolve(strict=True)
    artifacts = []
    for artifact in document.get("output", {}).get("artifacts", []):
        identifier = artifact["id"]
        target = (directory / identifier).resolve(strict=True)
        if not target.is_relative_to(directory) or not target.is_file():
            raise ValueError("ARTIFACT_PATH_OUTSIDE_DIRECTORY")
        data = target.read_bytes()
        artifacts.append({"id": identifier, "base64": base64.b64encode(data).decode()})
    if not artifacts:
        raise ValueError("REAL_VISUAL_ARTIFACT_REQUIRED")
    if tamper:
        artifacts[0]["base64"] = base64.b64encode(b"tampered visual bytes").decode()
    payload = {"document_base64": base64.b64encode(raw).decode(), "document_sha256": sha(raw),
               "artifacts": artifacts,
               "module": str(RNCS / "packages/world/reality-asset-genesis-fabric/src/visual-ir.mjs"),
               "canonical": str(RNCS / "packages/world/reality-asset-genesis-fabric/src/canonical.mjs")}
    operations = ["rncs.visual.verify", "rncs.visual.accept-binding"]
    observed = []

    def verify(value):
        observed.append(operations[0])
        completed = subprocess.run([node, "--input-type=module", "-e", NODE_VERIFY],
                                   input=json.dumps(value), capture_output=True, text=True, timeout=30, check=True)
        return json.loads(completed.stdout)

    def accept(value):
        observed.append(operations[1])
        return {"accepted": value["verified_root"] == document["output"]["visual_ir_root"],
                "visual_ir_root": value["verified_root"], "source_sha256": value["source_sha256"]}

    def make_node(uid, operation, *, payload=None, dependencies=None, inputs=None, checks=None):
        return ArtifactNode(uid, "mixed", uid, dependencies=dependencies or [],
            required_capabilities=[operation], payload=payload or {}, metadata={"operation_contract": {
                "schema": "dwac.operation-binding.v1", "operation": operation, "inputs": inputs or {},
                "result_checks": checks}})

    nodes = [make_node("verify-visual-output", operations[0], payload=payload,
        checks=[{"path": ["valid"], "equals": True},
                {"path": ["source_sha256"], "equals": sha(raw)},
                {"path": ["factory_result_root"], "equals": document["result_root"]}]),
        make_node("accept-visual-binding", operations[1], dependencies=["verify-visual-output"],
            inputs={"verified_root": {"dependency": "verify-visual-output", "path": ["value", "visual_ir_root"]},
                    "source_sha256": {"dependency": "verify-visual-output", "path": ["value", "source_sha256"]}},
            checks=[{"path": ["accepted"], "equals": True}])]
    graph = ArtifactGraph("rncs-visual-result-verification", ArtifactTypeRef("custom", "visual", "candidate"),
        UniversalArtifactIntent("verify", "Verify existing RAGF Visual Factory output bytes"),
        {item.node_id: item for item in nodes})
    with tempfile.TemporaryDirectory(prefix="rncs-dwac-visual-") as temp:
        runtime = UnifiedStore(Path(temp) / "workers.sqlite")
        try:
            bus, cas = WorkerBus(runtime, Path(temp)), ContentAddressedArtifactStore(Path(temp) / "cas")
            bus.register("rncs-visual-verification", operations[0], verify)
            bus.register("rncs-visual-binding", operations[1], accept)
            workers = [ArtifactOperationWorker(bus, cas, worker_id=operation, operation=operation) for operation in operations]
            result = execute_artifact_graph(graph, worker_pool=workers)
            receipt_records = []
            for item in result.results:
                content = item.content if isinstance(item.content, dict) else {}
                ref = content.get("operation_receipt")
                if ref:
                    record = cas.read_json(ref["sha256"])
                    receipt_records.append({"ref": ref, "record": record, "plan": cas.read_json(record["plan"]["sha256"])})
                elif "OPERATION_REJECTED:" in str(content.get("detail", "")):
                    digest = content["detail"].split("OPERATION_REJECTED:", 1)[1].rsplit("/", 1)[-1]
                    record = cas.read_json(digest)
                    receipt_records.append({"sha256": digest, "record": record, "plan": cas.read_json(record["plan"]["sha256"])})
            statuses = [item.status for item in result.results]
            expected = ["EXECUTION_ERROR", "DEPENDENCY_FAILED"] if tamper else ["CANDIDATE", "CANDIDATE"]
            return {"format": "rncs.dwac-visual-verification.v0.1", "status": "PASS" if statuses == expected else "FAIL",
                "scope": "LOCAL_DWAC_OPERATION_GRAPH_VISUAL_VERIFICATION", "negative_case": tamper,
                "dwac_commit": subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip(),
                "dwac_source_hashes": {str(path.relative_to(repo)): sha(path.read_bytes()) for path in [
                    repo / "dwac_runtime.py", required,
                    repo / "structural_generation/dwac_structural/universal_compiler.py"]},
                "factory_result_sha256": sha(raw), "factory_result_root": document["result_root"],
                "plan_root": document["plan_root"], "visual_ir_root": document["output"]["visual_ir_root"],
                "observed_operations": observed, "unit_statuses": statuses,
                "result": result.to_dict(), "operation_receipts": receipt_records,
                "dwac_visual_generation": "NOT_RUN", "remote_execution": "NOT_RUN",
                "visual_acceptance": "NOT_EVALUATED", "canonical_promotion_performed": False}
        finally:
            runtime.con.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dwac-repo", type=Path, required=True)
    parser.add_argument("--factory-result", type=Path, required=True)
    parser.add_argument("--artifact-dir", type=Path)
    parser.add_argument("--node", default="node")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    directory = args.artifact_dir or args.factory_result.parent
    runs = [execute(args.dwac_repo, args.factory_result, directory, node=args.node)]
    if args.self_test:
        runs.append(execute(args.dwac_repo, args.factory_result, directory, node=args.node, tamper=True))
    evidence = {"format": "rncs.dwac-visual-bridge-evidence.v0.1", "status": "PASS" if all(r["status"] == "PASS" for r in runs) else "FAIL", "runs": runs}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": evidence["status"], "unit_statuses": [r["unit_statuses"] for r in runs], "output": str(args.output)}))
    return 0 if evidence["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
