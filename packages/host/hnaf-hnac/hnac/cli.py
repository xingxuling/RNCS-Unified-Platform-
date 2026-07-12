from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import wasmtime

from .capsule import pack
from .conformance import cross_host_conformance
from .adaptive_interface import compile_projection, interface_from_capsule_files, route_event
from .intent_fabric import bind_event, bind_intent, execute_intent
from .errors import HNACError
from .host import HostProfile, default_host_profile
from .runtime import contract_capsule, inspect_capsule, plan_capsule, run_capsule
from .state_fabric import MigrationGraph, PortableStateStore
from .projection import project_web
from .trust import sign, verify


def emit(value: object) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True))


def compile_wat(source: Path, output: Path) -> dict[str, object]:
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        output.write_bytes(wasmtime.wat2wasm(source.read_text("utf-8")))
    except (OSError, wasmtime.WasmtimeError) as exc:
        raise HNACError(f"WAT compilation failed: {exc}") from exc
    return {"source": str(source), "output": str(output), "bytes": output.stat().st_size}


def init_project(target: Path) -> dict[str, str]:
    template = Path(__file__).resolve().parent / "templates" / "remote-execution-v08"
    if not template.is_dir():
        raise HNACError("Installed package is missing the remote-execution-v08 template")
    if target.exists() and any(target.iterdir()):
        raise HNACError(f"Target is not empty: {target}")
    shutil.copytree(template, target, dirs_exist_ok=True)
    return {"project": str(target), "template": "remote-execution-v08"}



def _interface_graph_from_capsule(capsule: Path, require_signature: bool = False) -> tuple[dict[str, object], dict[str, object]]:
    verified = verify(capsule, require_signature=require_signature)
    graph = interface_from_capsule_files(verified["manifest"], verified["files"])
    if graph is None:
        raise HNACError("Capsule does not contain an AIP v0.6/v0.7 adaptive interface graph")
    return verified, graph


def _json_argument(value: str) -> dict[str, object]:
    try:
        if value.startswith("@"):
            raw = Path(value[1:]).read_text("utf-8")
        else:
            raw = value
        parsed = json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        raise HNACError(f"Invalid JSON argument: {exc}") from exc
    if not isinstance(parsed, dict):
        raise HNACError("JSON argument must be an object")
    return parsed

def load_host(path: Path | None) -> HostProfile | None:
    return HostProfile.load(path) if path is not None else None


def add_host_option(command: argparse.ArgumentParser) -> None:
    command.add_argument("--host-profile", type=Path, help="JSON Resource Context/host profile")


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="hnac", description="HNAF/HNAC v0.8 reference toolchain with Remote Execution Fabric")
    sub = root.add_subparsers(dest="command", required=True)

    cmd = sub.add_parser("init")
    cmd.add_argument("target", type=Path)

    cmd = sub.add_parser("compile-wat")
    cmd.add_argument("source", type=Path)
    cmd.add_argument("output", type=Path)

    cmd = sub.add_parser("pack")
    cmd.add_argument("source", type=Path)
    cmd.add_argument("output", type=Path)

    cmd = sub.add_parser("sign")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--key", type=Path, required=True)
    cmd.add_argument("--signer", default="local-development")

    cmd = sub.add_parser("verify")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--require-signature", action="store_true")

    cmd = sub.add_parser("contract")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--require-signature", action="store_true")

    cmd = sub.add_parser("inspect")
    cmd.add_argument("capsule", type=Path)
    add_host_option(cmd)

    cmd = sub.add_parser("plan")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    cmd = sub.add_parser("run")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--state-root", type=Path)
    cmd.add_argument("--trace", type=Path)
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    cmd = sub.add_parser("conformance")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--js-host", type=Path)
    cmd.add_argument("--workspace", type=Path)
    cmd.add_argument("--require-signature", action="store_true")

    cmd = sub.add_parser("project-web")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("output", type=Path)
    cmd.add_argument("--autorun", action="store_true")
    cmd.add_argument("--require-signature", action="store_true")

    cmd = sub.add_parser("interface-plan", help="Compile a deterministic adaptive interface projection")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    cmd = sub.add_parser("interface-route", help="Resolve pointer/touch/keyboard/voice/neural input into an intent")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("event", help="JSON object or @path/to/event.json")
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)


    cmd = sub.add_parser("intent-bind", help="Negotiate providers and evaluate authority for an AIP v0.7 intent under HNAC v0.7/v0.8")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("intent")
    cmd.add_argument("--subject", default='{"subject_id":"subject:local-user","kind":"human","roles":["owner"],"scopes":["*"]}')
    cmd.add_argument("--payload", default="{}")
    cmd.add_argument("--approval")
    cmd.add_argument("--approve", action="store_true")
    cmd.add_argument("--gateway-url")
    cmd.add_argument("--now")
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    cmd = sub.add_parser("intent-bind-event", help="Route an interface event and bind the resolved AIP v0.7 intent under HNAC v0.7/v0.8")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("event")
    cmd.add_argument("--subject", default='{"subject_id":"subject:local-user","kind":"human","roles":["owner"],"scopes":["*"]}')
    cmd.add_argument("--payload", default="{}")
    cmd.add_argument("--approve", action="store_true")
    cmd.add_argument("--gateway-url")
    cmd.add_argument("--now")
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    cmd = sub.add_parser("intent-execute", help="Bind, authorize and execute an AIP v0.7 intent through the v0.7/v0.8 provider fabric")
    cmd.add_argument("capsule", type=Path)
    cmd.add_argument("intent")
    cmd.add_argument("--state-root", type=Path, required=True)
    cmd.add_argument("--subject", default='{"subject_id":"subject:local-user","kind":"human","roles":["owner"],"scopes":["*"]}')
    cmd.add_argument("--payload", default="{}")
    cmd.add_argument("--approval")
    cmd.add_argument("--approve", action="store_true")
    cmd.add_argument("--gateway-url")
    cmd.add_argument("--now")
    cmd.add_argument("--idempotency-key", help="Stable caller key used to replay the original v0.8 execution receipt")
    cmd.add_argument("--cancel-path", type=Path, help="Existing file that cancels execution before or between Provider attempts")
    cmd.add_argument("--rfe-root", type=Path, help="Override the RFE store used for v0.8 execution receipt commitments")
    cmd.add_argument("--require-signature", action="store_true")
    add_host_option(cmd)

    def add_state_identity(command: argparse.ArgumentParser) -> None:
        command.add_argument("root", type=Path)
        command.add_argument("--app-id", required=True)
        command.add_argument("--schema-version", default="1")

    cmd = sub.add_parser("state-status", help="Inspect partition roots and continuity metadata")
    add_state_identity(cmd)

    cmd = sub.add_parser("state-get", help="Read a value from a state partition")
    add_state_identity(cmd)
    cmd.add_argument("key")
    cmd.add_argument("--partition", default="portable")

    cmd = sub.add_parser("state-set", help="Write a JSON value into a state partition")
    add_state_identity(cmd)
    cmd.add_argument("key")
    cmd.add_argument("value", help="JSON value")
    cmd.add_argument("--partition", default="portable")

    cmd = sub.add_parser("state-snapshot", help="Create a content-addressed local snapshot")
    add_state_identity(cmd)
    cmd.add_argument("--label")

    cmd = sub.add_parser("state-restore", help="Restore a verified local snapshot")
    add_state_identity(cmd)
    cmd.add_argument("snapshot_root")

    cmd = sub.add_parser("state-export", help="Export portable state; secrets require encryption")
    add_state_identity(cmd)
    cmd.add_argument("output", type=Path)
    cmd.add_argument("--include-cache", action="store_true")
    cmd.add_argument("--include-secret", action="store_true")
    cmd.add_argument("--password")

    cmd = sub.add_parser("state-verify", help="Verify a portable state bundle root")
    cmd.add_argument("bundle", type=Path)

    cmd = sub.add_parser("state-import", help="Import, migrate and reconcile portable state")
    add_state_identity(cmd)
    cmd.add_argument("bundle", type=Path)
    cmd.add_argument("--password")
    cmd.add_argument("--policy", choices=["reject", "prefer-local", "prefer-remote", "record-conflicts"], default="reject")
    cmd.add_argument("--migrations", type=Path)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "init":
            emit(init_project(args.target))
        elif args.command == "compile-wat":
            emit(compile_wat(args.source, args.output))
        elif args.command == "pack":
            emit(pack(args.source, args.output))
        elif args.command == "sign":
            emit(sign(args.capsule, args.key, args.signer))
        elif args.command == "verify":
            result = verify(args.capsule, require_signature=args.require_signature)
            emit({"app": result["manifest"]["app"], "signature": result["signature"], "files": len(result["integrity"]["files"])})
        elif args.command == "contract":
            emit(contract_capsule(args.capsule, require_signature=args.require_signature))
        elif args.command == "inspect":
            emit(inspect_capsule(args.capsule, host=load_host(args.host_profile)))
        elif args.command == "plan":
            emit(plan_capsule(args.capsule, host=load_host(args.host_profile), require_signature=args.require_signature))
        elif args.command == "run":
            emit(run_capsule(
                args.capsule,
                state_root=args.state_root,
                trace_path=args.trace,
                require_signature=args.require_signature,
                host=load_host(args.host_profile),
            ))
        elif args.command == "conformance":
            emit(cross_host_conformance(
                args.capsule,
                args.js_host,
                require_signature=args.require_signature,
                workspace=args.workspace,
            ))
        elif args.command == "project-web":
            emit(project_web(
                args.capsule,
                args.output,
                autorun=args.autorun,
                require_signature=args.require_signature,
            ))
        elif args.command == "interface-plan":
            verified, graph = _interface_graph_from_capsule(args.capsule, args.require_signature)
            host = load_host(args.host_profile) or default_host_profile()
            emit({"app": verified["manifest"]["app"], "projection": compile_projection(graph, host)})
        elif args.command == "interface-route":
            verified, graph = _interface_graph_from_capsule(args.capsule, args.require_signature)
            host = load_host(args.host_profile) or default_host_profile()
            emit({"app": verified["manifest"]["app"], "route": route_event(graph, host, _json_argument(args.event))})
        elif args.command in {"intent-bind", "intent-bind-event", "intent-execute"}:
            verified, graph = _interface_graph_from_capsule(args.capsule, args.require_signature)
            host = load_host(args.host_profile) or default_host_profile()
            subject = _json_argument(args.subject)
            payload = _json_argument(args.payload)
            approval = _json_argument(args.approval) if getattr(args, "approval", None) else None
            if args.command == "intent-bind":
                emit(bind_intent(
                    manifest=verified["manifest"], files=verified["files"], graph=graph, intent_id=args.intent,
                    host=host, subject=subject, payload=payload, gateway_url=args.gateway_url,
                    approval=approval, approve=args.approve, now=args.now,
                ))
            elif args.command == "intent-bind-event":
                emit(bind_event(
                    manifest=verified["manifest"], files=verified["files"], graph=graph, event=_json_argument(args.event),
                    host=host, subject=subject, payload=payload, gateway_url=args.gateway_url, approve=args.approve, now=args.now,
                ))
            else:
                emit(execute_intent(
                    manifest=verified["manifest"], files=verified["files"], graph=graph, intent_id=args.intent,
                    host=host, state_root=args.state_root, subject=subject, payload=payload, gateway_url=args.gateway_url,
                    approval=approval, approve=args.approve, now=args.now,
                    idempotency_key=args.idempotency_key, cancel_path=args.cancel_path, rfe_root=args.rfe_root,
                ))
        elif args.command.startswith("state-"):
            if args.command == "state-verify":
                bundle = PortableStateStore.verify_bundle(args.bundle)
                emit({
                    "valid": True,
                    "bundle_root": bundle["bundle_root"],
                    "app_id": bundle["app_id"],
                    "schema_version": bundle["schema_version"],
                    "partitions": sorted(bundle["partitions"]),
                    "secret_encrypted": "secret_envelope" in bundle,
                })
            else:
                store = PortableStateStore(args.root, args.app_id, schema_version=args.schema_version)
                if args.command == "state-status":
                    emit(store.status())
                elif args.command == "state-get":
                    emit({"partition": args.partition, "key": args.key, "value": store.get(args.key, partition=args.partition)})
                elif args.command == "state-set":
                    try:
                        value = json.loads(args.value)
                    except json.JSONDecodeError as exc:
                        raise HNACError(f"State value must be valid JSON: {exc}") from exc
                    emit(store.set(args.key, value, partition=args.partition))
                elif args.command == "state-snapshot":
                    emit(store.snapshot(label=args.label))
                elif args.command == "state-restore":
                    emit(store.restore(args.snapshot_root))
                elif args.command == "state-export":
                    emit(store.export_bundle(
                        args.output,
                        include_cache=args.include_cache,
                        include_secret=args.include_secret,
                        password=args.password,
                    ))
                elif args.command == "state-import":
                    migrations = MigrationGraph.load(args.migrations) if args.migrations else None
                    emit(store.import_bundle(
                        args.bundle,
                        password=args.password,
                        policy=args.policy,
                        migrations=migrations,
                    ))
        return 0
    except HNACError as exc:
        print(f"HNAC error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
