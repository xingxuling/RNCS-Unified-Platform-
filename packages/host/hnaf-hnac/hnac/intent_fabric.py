from __future__ import annotations

import copy
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from .adaptive_interface import compile_projection, route_event, validate_graph
from .errors import HNACError
from .host import HostProfile
from .state_fabric import PortableStateStore
from .execution_fabric import (
    ExecutionPolicy, IdempotencyLedger, execute_authorized_chain, verify_provider_registry, parse_time
)
from .vendor import aaf_v01 as aaf
from .vendor import cnp_v01 as cnp

BINDING_VERSION = "0.8"
BINDING_FORMAT = "hnaf.intent-capability-binding.v0.8"
RECEIPT_FORMAT = "hnaf.intent-execution-receipt.v0.8"
RISK_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _seal(value: dict[str, Any], field: str) -> dict[str, Any]:
    result = copy.deepcopy(value)
    result.pop(field, None)
    result[field] = cnp.sha256_root(result)
    return result


def _read_json(files: dict[str, bytes], logical_path: str, label: str) -> Any:
    if logical_path not in files:
        raise HNACError(f"{label} not found in capsule: {logical_path}")
    try:
        return json.loads(files[logical_path].decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError(f"{label} must be valid UTF-8 JSON: {logical_path}") from exc


def _binding_section(manifest: dict[str, Any]) -> dict[str, Any]:
    section = manifest.get("capability_binding")
    if not isinstance(section, dict) or section.get("version") not in {"0.7", "0.8"}:
        raise HNACError("Capsule does not declare capability_binding.version=0.7 or 0.8")
    return section


def _binding_version(manifest: dict[str, Any]) -> str:
    return str(_binding_section(manifest)["version"])


def _binding_format(manifest: dict[str, Any]) -> str:
    version = _binding_version(manifest)
    return f"hnaf.intent-capability-binding.v{version}"


def _receipt_format(manifest: dict[str, Any]) -> str:
    version = _binding_version(manifest)
    return f"hnaf.intent-execution-receipt.v{version}"


def load_binding_assets(manifest: dict[str, Any], files: dict[str, bytes]) -> dict[str, Any]:
    section = _binding_section(manifest)
    provider_value = _read_json(files, str(section["providers"]), "Capability provider registry")
    providers = provider_value.get("providers") if isinstance(provider_value, dict) else provider_value
    if not isinstance(providers, list) or not providers:
        raise HNACError("Capability provider registry must contain a non-empty providers array")
    policy = _read_json(files, str(section["authority_policy"]), "Authority policy")
    if not isinstance(policy, dict):
        raise HNACError("Authority policy must be a JSON object")
    execution_policy = ExecutionPolicy.from_manifest(manifest)
    supply_chain = verify_provider_registry(
        providers,
        require_signed=execution_policy.require_signed_providers if section.get("version") == "0.8" else False,
    )
    return {
        "section": section,
        "providers": providers,
        "policy": policy,
        "execution_policy": execution_policy,
        "supply_chain": supply_chain,
        "provider_registry_root": cnp.sha256_root(providers),
        "policy_source_root": cnp.sha256_root(policy),
    }


def _flatten_host_capabilities(host: HostProfile) -> list[str]:
    values = set(host.capabilities)
    values.update(f"interaction.{mode}" for mode in host.interaction_modes)
    if host.resources.get("spatial"):
        values.add("projection.spatial")
    if host.resources.get("screen_reader"):
        values.add("projection.screen-reader")
    if host.policies.get("network_default") == "allow":
        values.add("network.https")
    return sorted(values)


def _validate_payload(intent: dict[str, Any], payload: dict[str, Any]) -> None:
    schema = intent.get("input_schema")
    if not schema:
        return
    errors = sorted(Draft202012Validator(schema).iter_errors(payload), key=lambda item: list(item.path))
    if errors:
        details = "; ".join(
            f"{'.'.join(map(str, item.path)) or '<root>'}: {item.message}" for item in errors[:8]
        )
        raise HNACError(f"Intent payload validation failed: {details}")


def _subject(value: dict[str, Any] | None) -> dict[str, Any]:
    raw = dict(value or {})
    subject_id = str(raw.get("subject_id", "subject:local-user"))
    return {
        "subject_id": subject_id,
        "kind": str(raw.get("kind", "human")),
        "roles": sorted({str(item) for item in raw.get("roles", ["owner"])}),
        "scopes": sorted({str(item) for item in raw.get("scopes", ["*"])}),
        "responsibility_boundary": str(raw.get("responsibility_boundary", "local-session")),
    }


def build_negotiation_request(
    *,
    manifest: dict[str, Any],
    graph: dict[str, Any],
    intent_id: str,
    host: HostProfile,
    subject: dict[str, Any] | None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    validate_graph(graph)
    intent = graph.get("intents", {}).get(intent_id)
    if not isinstance(intent, dict):
        raise HNACError(f"Unknown adaptive interface intent: {intent_id}")
    goal = intent.get("goal")
    if not isinstance(goal, dict) or not goal.get("type"):
        raise HNACError(f"AIP v0.7 intent has no capability goal: {intent_id}")
    actual_payload = dict(payload or {})
    _validate_payload(intent, actual_payload)
    actor = _subject(subject)
    strategy = _binding_section(manifest).get("strategy", {})
    request_seed = {
        "app_id": manifest["app"]["id"],
        "app_version": manifest["app"]["version"],
        "intent_id": intent_id,
        "host_id": host.id,
        "subject_id": actor["subject_id"],
        "payload": actual_payload,
    }
    max_risk = str(strategy.get("max_risk", intent.get("risk", "high")))
    if max_risk == "moderate":
        max_risk = "medium"
    request = {
        "request_id": f"request:hnaf:{cnp.sha256_root(request_seed)[:24]}",
        "protocol_versions": ["0.1.0"],
        "subject": {"subject_id": actor["subject_id"], "scopes": actor["scopes"]},
        "host": {"host_id": host.id, "capabilities": _flatten_host_capabilities(host)},
        "goals": [
            {
                "goal_id": f"goal:{intent_id}",
                "type": str(goal["type"]),
                "version_range": str(goal.get("version_range", "*")),
                "inputs": copy.deepcopy(goal.get("inputs", {})),
            }
        ],
        "policy": {
            "max_risk": max_risk,
            "require_reversible": bool(strategy.get("require_reversible", False)),
            "required_evidence": sorted({str(item) for item in goal.get("required_evidence", [])}),
            "minimum_trust": int(strategy.get("minimum_trust", 0)),
            "cost_budget": {
                "cpu_millis": int(strategy.get("cost_budget", {}).get("cpu_millis", 2147483647)),
                "memory_mb": int(strategy.get("cost_budget", {}).get("memory_mb", 2147483647)),
                "network_kb": int(strategy.get("cost_budget", {}).get("network_kb", 2147483647)),
                "monetary_microunits": int(strategy.get("cost_budget", {}).get("monetary_microunits", 2147483647)),
            },
        },
        "constraints": {
            "prefer_local": bool(strategy.get("prefer_local", True)),
            "offline_first": bool(strategy.get("offline_first", True)),
            **copy.deepcopy(goal.get("constraints", {})),
        },
    }
    return request


class GatewayClient:
    def __init__(self, base_url: str, *, timeout_seconds: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def invoke(self, runtime_id: str, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        body = json.dumps(
            {"runtime_id": runtime_id, "action": action, "payload": payload},
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/api/invoke",
            data=body,
            headers={"content-type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                decoded = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HNACError(f"Reality One Gateway invocation failed: {exc}") from exc
        if isinstance(decoded, dict) and decoded.get("error"):
            raise HNACError(f"Reality One Gateway returned an error: {decoded['error']}")
        if not isinstance(decoded, dict):
            raise HNACError("Reality One Gateway returned a non-object response")
        return decoded


def _candidate_chain(negotiation: dict[str, Any], goal_id: str, max_fallbacks: int) -> list[dict[str, Any]]:
    offers = negotiation.get("offers", {}).get(goal_id, [])
    eligible = [copy.deepcopy(item) for item in offers if item.get("eligible")]
    return eligible[: max(1, max_fallbacks + 1)]


def _authority_negotiation(
    request: dict[str, Any],
    negotiation: dict[str, Any],
    chain: list[dict[str, Any]],
) -> dict[str, Any]:
    goal = request["goals"][0]
    steps: list[dict[str, Any]] = []
    for index, offer in enumerate(chain, start=1):
        steps.append(
            {
                "step_id": f"authorized-fallback:{index}",
                "goal_id": goal["goal_id"],
                "goal_type": goal["type"],
                "capability_id": offer["capability_id"],
                "capability_version": offer["capability_version"],
                "provider_id": offer["provider_id"],
                "protocol_version": offer.get("protocol_version"),
                "depends_on": [],
                "execution_phase": offer.get("execution_phase", "transaction"),
                "reversible": bool(offer.get("reversible", False)),
                "risk": copy.deepcopy(offer.get("risk", {"level": "medium", "reasons": []})),
                "cost": copy.deepcopy(offer.get("cost", {})),
                "required_scopes": copy.deepcopy(offer.get("required_scopes", [])),
                "host_requirements": copy.deepcopy(offer.get("host_requirements", [])),
                "evidence": copy.deepcopy(offer.get("evidence", {})),
                "descriptor_root": offer.get("descriptor_root"),
                "transport": copy.deepcopy(offer.get("transport", {"kind": "local"})),
            }
        )
    total_cost = {
        key: sum(int(step.get("cost", {}).get(key, 0)) for step in steps)
        for key in ("cpu_millis", "memory_mb", "network_kb", "monetary_microunits")
    }
    plan = _seal(
        {
            "format": "cnp.negotiation-plan.v0.1",
            "request_id": request["request_id"],
            "request_root": negotiation["request"]["request_root"],
            "provider_roots": negotiation["plan"].get("provider_roots", []),
            "status": "satisfied" if steps else "unsatisfied",
            "unresolved_goals": [] if steps else [goal["goal_id"]],
            "steps": steps,
            "total_cost": total_cost,
            "required_scopes": sorted({scope for step in steps for scope in step.get("required_scopes", [])}),
            "warnings": sorted({"contains-irreversible-step" for step in steps if not step.get("reversible", False)}),
        },
        "plan_root",
    )
    return _seal(
        {
            "format": "cnp.negotiation-result.v0.1",
            "request": copy.deepcopy(negotiation["request"]),
            "offers": copy.deepcopy(negotiation.get("offers", {})),
            "plan": plan,
        },
        "negotiation_root",
    )


def _make_envelope_v07(
    *,
    manifest: dict[str, Any],
    intent_id: str,
    intent: dict[str, Any],
    actor: dict[str, Any],
    payload: dict[str, Any],
    authority_negotiation: dict[str, Any],
    host: HostProfile,
) -> dict[str, Any]:
    proposal = {
        "app_id": manifest["app"]["id"],
        "app_version": manifest["app"]["version"],
        "intent_id": intent_id,
        "goal": copy.deepcopy(intent["goal"]),
        "payload": copy.deepcopy(payload),
        "subject_id": actor["subject_id"],
        "host_id": host.id,
        "authority_plan_root": authority_negotiation["plan"]["plan_root"],
    }
    proposal_root = aaf.root_hash(proposal)
    steps = authority_negotiation["plan"].get("steps", [])
    envelope = {
        "format": "rncs.reality-transition-envelope.v0.1",
        "contract_version": "0.1.0",
        "transition_id": f"transition:hnaf:{proposal_root[:24]}",
        "phase": "proposed",
        "proposal_root": proposal_root,
        "base_generation": {
            "reality_id": f"reality:hnaf:{manifest['app']['id']}",
            "generation": 0,
            "generation_root": "0" * 64,
        },
        "subject": {
            "subject_id": actor["subject_id"],
            "kind": actor["kind"],
            "roles": actor["roles"],
            "responsibility_boundary": actor["responsibility_boundary"],
        },
        "intent": {
            "intent_id": intent_id,
            "source": "adaptive-interface",
            "goals": [copy.deepcopy(intent["goal"])],
            "constraints": ["capability-negotiation-required", "authority-before-execution"],
            "intent_root": aaf.root_hash({"intent_id": intent_id, "goal": intent["goal"], "payload": payload}),
        },
        "capability_plan": {
            "plan_id": f"plan:hnaf:{authority_negotiation['plan']['plan_root'][:24]}",
            "capabilities": [
                {
                    "capability_id": step["capability_id"],
                    "provider": step["provider_id"],
                    "required_scopes": step.get("required_scopes", []),
                    "risk": step.get("risk", {}).get("level", "medium"),
                    "reversible": step.get("reversible", False),
                    "cost": step.get("cost", {}),
                }
                for step in steps
            ],
            "host_bindings": [{"host_id": host.id}],
            "required_scopes": authority_negotiation["plan"].get("required_scopes", []),
            "plan_root": authority_negotiation["plan"]["plan_root"],
        },
        "inputs": [{"kind": "intent-payload", "id": intent_id, "root": aaf.root_hash(payload)}],
        "provisional_delta": {"operations": [], "provisional": True, "delta_root": aaf.root_hash([])},
        "causal_basis": {
            "events": [{"event_id": f"event:{proposal_root[:16]}", "kind": "interface-intent-received"}],
            "rules": [
                {"rule_id": "cnp-before-execution", "expression": "capability plan must be satisfied"},
                {"rule_id": "aaf-before-execution", "expression": "authority status must be approved"},
            ],
            "simulation_refs": [],
            "causal_root": aaf.root_hash({"proposal_root": proposal_root, "host_id": host.id}),
        },
        "authority": {"status": "pending", "claims": [], "constraints": []},
        "evidence": {
            "nodes": [
                {
                    "evidence_id": "evidence:capability-plan",
                    "kind": "capability-plan",
                    "source": "CNP v0.1",
                    "content_root": authority_negotiation["plan"]["plan_root"],
                }
            ],
            "edges": [],
            "evidence_root": aaf.root_hash(authority_negotiation["plan"]),
        },
        "commit": {"status": "not_committed"},
        "projections": [],
        "host_state_refs": [],
        "extensions": {"hnaf": {"binding_version": "0.7", "proposal": proposal}},
    }
    envelope["envelope_root"] = aaf.root_hash(envelope)
    return envelope



def _make_envelope(
    *,
    manifest: dict[str, Any],
    intent_id: str,
    intent: dict[str, Any],
    actor: dict[str, Any],
    payload: dict[str, Any],
    authority_negotiation: dict[str, Any],
    host: HostProfile,
    base_generation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if _binding_version(manifest) == "0.7":
        return _make_envelope_v07(
            manifest=manifest,
            intent_id=intent_id,
            intent=intent,
            actor=actor,
            payload=payload,
            authority_negotiation=authority_negotiation,
            host=host,
        )
    try:
        from rncs_contract import new_proposal
    except ImportError as exc:  # packaged with v0.8 wheel
        raise HNACError("RNCS Core Contract is unavailable") from exc
    base = copy.deepcopy(base_generation or {
        "reality_id": f"reality:hnaf:{manifest['app']['id']}",
        "generation": 0,
        "generation_root": "0" * 64,
    })
    steps = authority_negotiation["plan"].get("steps", [])
    proposal = {
        "app_id": manifest["app"]["id"],
        "app_version": manifest["app"]["version"],
        "intent_id": intent_id,
        "goal": copy.deepcopy(intent["goal"]),
        "payload": copy.deepcopy(payload),
        "subject_id": actor["subject_id"],
        "host_id": host.id,
        "authority_plan_root": authority_negotiation["plan"]["plan_root"],
    }
    return new_proposal(
        reality_id=str(base["reality_id"]),
        base_generation=int(base["generation"]),
        base_generation_root=str(base["generation_root"]),
        subject={
            "subject_id": actor["subject_id"],
            "kind": actor["kind"],
            "roles": actor["roles"],
            "responsibility_boundary": actor["responsibility_boundary"],
        },
        intent={
            "intent_id": intent_id,
            "source": "adaptive-interface",
            "goals": [copy.deepcopy(intent["goal"])],
            "constraints": ["capability-negotiation-required", "authority-before-execution", "sandbox-before-provider"],
        },
        capability_plan={
            "plan_id": f"plan:hnaf:{authority_negotiation['plan']['plan_root'][:24]}",
            "capabilities": [
                {
                    "capability_id": step["capability_id"],
                    "provider": step["provider_id"],
                    "required_scopes": step.get("required_scopes", []),
                    "risk": step.get("risk", {}).get("level", "medium"),
                    "reversible": step.get("reversible", False),
                    "cost": step.get("cost", {}),
                    "descriptor_root": step.get("descriptor_root"),
                    "transport": copy.deepcopy(step.get("transport", {})),
                }
                for step in steps
            ],
            "host_bindings": [{"host_id": host.id}],
            "required_scopes": authority_negotiation["plan"].get("required_scopes", []),
        },
        inputs=[{"kind": "intent-payload", "id": intent_id, "root": aaf.root_hash(payload)}],
        provisional_delta={"operations": []},
        causal_basis={
            "events": [{"event_id": f"event:{aaf.root_hash(proposal)[:16]}", "kind": "interface-intent-received"}],
            "rules": [
                {"rule_id": "cnp-before-execution", "expression": "capability plan must be satisfied"},
                {"rule_id": "aaf-before-execution", "expression": "authority status must be approved"},
                {"rule_id": "sandbox-before-provider", "expression": "provider transport must satisfy execution policy"},
            ],
            "simulation_refs": [],
        },
        evidence={
            "nodes": [
                {
                    "evidence_id": "evidence:capability-plan",
                    "kind": "capability-plan",
                    "source": "CNP v0.1",
                    "content_root": authority_negotiation["plan"]["plan_root"],
                }
            ],
            "edges": [],
        },
        transition_id=f"transition:hnaf:{aaf.root_hash(proposal)[:24]}",
        extensions={"hnaf": {"binding_version": "0.8", "proposal": proposal}},
    )

def _negotiate(
    request: dict[str, Any], providers: list[dict[str, Any]], gateway: GatewayClient | None
) -> tuple[dict[str, Any], str]:
    if gateway is not None:
        return gateway.invoke("rncs.cnp", "negotiate", {"request": request, "providers": providers}), "reality-one-gateway"
    return cnp.negotiate(request, providers), "local-pinned-cnp-v0.1"


def _evaluate_authority(
    *,
    envelope: dict[str, Any],
    negotiation: dict[str, Any],
    policy_raw: dict[str, Any],
    actor: dict[str, Any],
    now: str,
    approvals: list[dict[str, Any]],
    gateway: GatewayClient | None,
) -> tuple[dict[str, Any], str, dict[str, Any]]:
    if gateway is not None:
        policy = gateway.invoke("rncs.aaf", "sealPolicy", {"raw": policy_raw})
        decision = gateway.invoke(
            "rncs.aaf",
            "evaluate",
            {
                "envelope": envelope,
                "negotiation": negotiation,
                "policy_bundle": policy,
                "identity_scopes": actor["scopes"],
                "context": {"now": now, "environment": "local", "request_id": f"authority:{envelope['transition_id']}"},
                "approvals": approvals,
            },
        )
        return decision, "reality-one-gateway", policy
    policy = aaf.seal_policy_bundle(policy_raw)
    decision = aaf.evaluate_authority(
        envelope=envelope,
        negotiation=negotiation,
        policy_bundle=policy,
        identity_scopes=actor["scopes"],
        context={"now": now, "environment": "local", "request_id": f"authority:{envelope['transition_id']}"},
        approvals=approvals,
    )
    return decision, "local-pinned-aaf-v0.1", policy


def _seal_approval(raw: dict[str, Any], gateway: GatewayClient | None) -> dict[str, Any]:
    if gateway is not None:
        return gateway.invoke("rncs.aaf", "sealApproval", {"raw": raw})
    return aaf.seal_approval(raw)


def bind_intent(
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    intent_id: str,
    host: HostProfile,
    subject: dict[str, Any] | None = None,
    payload: dict[str, Any] | None = None,
    gateway_url: str | None = None,
    approval: dict[str, Any] | None = None,
    approve: bool = False,
    now: str | None = None,
    base_generation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    assets = load_binding_assets(manifest, files)
    validate_graph(graph)
    intent = graph.get("intents", {}).get(intent_id)
    if not isinstance(intent, dict):
        raise HNACError(f"Unknown adaptive interface intent: {intent_id}")
    actual_payload = dict(payload or {})
    actor = _subject(subject)
    request = build_negotiation_request(
        manifest=manifest,
        graph=graph,
        intent_id=intent_id,
        host=host,
        subject=actor,
        payload=actual_payload,
    )
    gateway = GatewayClient(gateway_url) if gateway_url else None
    negotiation, negotiation_backend = _negotiate(request, assets["providers"], gateway)
    goal_id = request["goals"][0]["goal_id"]
    max_fallbacks = int(assets["section"].get("strategy", {}).get("max_fallbacks", 2))
    chain = _candidate_chain(negotiation, goal_id, max_fallbacks)
    capability_snapshot = cnp.sha256_root(
        {
            "request": negotiation.get("request"),
            "providers": assets["provider_registry_root"],
            "goal_id": goal_id,
            "candidates": [
                {
                    "capability_id": item["capability_id"],
                    "capability_version": item["capability_version"],
                    "provider_id": item["provider_id"],
                    "descriptor_root": item["descriptor_root"],
                    "transport": item.get("transport"),
                }
                for item in chain
            ],
        }
    )
    if negotiation.get("plan", {}).get("status") != "satisfied" or not chain:
        result = {
            "format": _binding_format(manifest),
            "version": _binding_version(manifest),
            "status": "unsatisfied",
            "app": copy.deepcopy(manifest["app"]),
            "intent_id": intent_id,
            "host_id": host.id,
            "subject_id": actor["subject_id"],
            "negotiation_backend": negotiation_backend,
            "negotiation": negotiation,
            "candidate_chain": [],
            "capability_snapshot": capability_snapshot,
            "authority": None,
        }
        return _seal(result, "binding_root")

    authority_negotiation = _authority_negotiation(request, negotiation, chain)
    envelope = _make_envelope(
        manifest=manifest,
        intent_id=intent_id,
        intent=intent,
        actor=actor,
        payload=actual_payload,
        authority_negotiation=authority_negotiation,
        host=host,
        base_generation=base_generation,
    )
    effective_now = now or _utc_now()
    approvals: list[dict[str, Any]] = []
    if approval:
        raw = copy.deepcopy(approval)
        raw.setdefault("proposal_root", envelope["proposal_root"])
        approvals.append(_seal_approval(raw, gateway))
    decision, authority_backend, policy = _evaluate_authority(
        envelope=envelope,
        negotiation=authority_negotiation,
        policy_raw=assets["policy"],
        actor=actor,
        now=effective_now,
        approvals=approvals,
        gateway=gateway,
    )
    generated_approval = None
    if approve and decision.get("status") == "pending_approval":
        generated_approval = _seal_approval(
            {
                "approval_id": f"approval:hnaf:{envelope['proposal_root'][:24]}",
                "proposal_root": envelope["proposal_root"],
                "approver_id": actor["subject_id"],
                "approver_roles": actor["roles"],
                "decision": "approved",
                "scopes": ["*"],
                "conditions": [{"type": "explicit-interface-confirmation", "intent_id": intent_id}],
                "issued_at": effective_now,
                "expires_at": "2099-01-01T00:00:00Z",
            },
            gateway,
        )
        approvals.append(generated_approval)
        decision, authority_backend, policy = _evaluate_authority(
            envelope=envelope,
            negotiation=authority_negotiation,
            policy_raw=assets["policy"],
            actor=actor,
            now=effective_now,
            approvals=approvals,
            gateway=gateway,
        )
    result = {
        "format": _binding_format(manifest),
        "version": _binding_version(manifest),
        "status": "bound" if decision.get("status") == "approved" else decision.get("status", "denied"),
        "app": copy.deepcopy(manifest["app"]),
        "intent_id": intent_id,
        "intent_label": intent.get("label", intent_id),
        "host_id": host.id,
        "subject_id": actor["subject_id"],
        "payload_root": cnp.sha256_root(actual_payload),
        "negotiation_backend": negotiation_backend,
        "authority_backend": authority_backend,
        "negotiation": negotiation,
        "authority_negotiation": authority_negotiation,
        "candidate_chain": chain,
        "capability_snapshot": capability_snapshot,
        "envelope": envelope,
        "authority": decision,
        "policy_bundle_root": policy.get("policy_bundle_root"),
        "generated_approval": generated_approval,
        "supply_chain": assets["supply_chain"],
        "execution_policy_root": cnp.sha256_root(assets["execution_policy"].as_dict()),
    }
    return _seal(result, "binding_root")


def bind_event(
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    event: dict[str, Any],
    host: HostProfile,
    subject: dict[str, Any] | None = None,
    payload: dict[str, Any] | None = None,
    gateway_url: str | None = None,
    approve: bool = False,
    now: str | None = None,
) -> dict[str, Any]:
    route = route_event(graph, host, event)
    if route.get("status") != "resolved":
        return {"route": route, "binding": None}
    return {
        "route": route,
        "binding": bind_intent(
            manifest=manifest,
            files=files,
            graph=graph,
            intent_id=str(route["intent"]),
            host=host,
            subject=subject,
            payload=payload,
            gateway_url=gateway_url,
            approve=approve,
            now=now,
        ),
    }


def _builtin_handler(
    handler: str,
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    host: HostProfile,
    payload: dict[str, Any],
    state: PortableStateStore,
) -> Any:
    if handler == "echo":
        return {"echo": copy.deepcopy(payload), "host_id": host.id}
    if handler == "state.increment":
        key = str(payload.get("key", "run_count"))
        amount = int(payload.get("amount", 1))
        before = state.get(key, partition="portable", default=0)
        if not isinstance(before, int) or isinstance(before, bool):
            raise HNACError(f"Portable state value is not an integer: {key}")
        after = before + amount
        state.set(key, after, partition="portable")
        return {"key": key, "before": before, "after": after, "state_root": state.status()["state_root"]}
    if handler == "state.read":
        key = str(payload.get("key", "run_count"))
        return {"key": key, "value": state.get(key, partition="portable", default=None)}
    if handler == "capsule.inspect":
        return {
            "app": copy.deepcopy(manifest["app"]),
            "format_version": manifest["format_version"],
            "files": len(files),
            "intents": sorted(graph.get("intents", {})),
        }
    if handler == "interface.export-plan":
        return compile_projection(graph, host)
    if handler == "fail":
        raise HNACError("Provider requested deterministic failure")
    raise HNACError(f"Unsupported HNAF builtin handler: {handler}")


def _execute_offer(
    offer: dict[str, Any],
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    host: HostProfile,
    payload: dict[str, Any],
    state: PortableStateStore,
    gateway_url: str | None,
) -> Any:
    transport = offer.get("transport") or {}
    kind = str(transport.get("kind", "local"))
    if kind in {"hnaf-builtin", "local"} and transport.get("handler"):
        return _builtin_handler(
            str(transport["handler"]),
            manifest=manifest,
            files=files,
            graph=graph,
            host=host,
            payload=payload,
            state=state,
        )
    if kind == "reality-one-gateway":
        endpoint = str(transport.get("endpoint") or gateway_url or "")
        runtime_id = str(transport.get("runtime_id", ""))
        action = str(transport.get("action", ""))
        if not endpoint or not runtime_id or not action:
            raise HNACError("Reality One provider transport is missing endpoint/runtime_id/action")
        return GatewayClient(endpoint).invoke(runtime_id, action, copy.deepcopy(payload))
    raise HNACError(f"Unsupported provider transport: {kind}")


def _execute_intent_v07(
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    intent_id: str,
    host: HostProfile,
    state_root: Path,
    subject: dict[str, Any] | None = None,
    payload: dict[str, Any] | None = None,
    gateway_url: str | None = None,
    approval: dict[str, Any] | None = None,
    approve: bool = False,
    now: str | None = None,
) -> dict[str, Any]:
    actual_payload = dict(payload or {})
    binding = bind_intent(
        manifest=manifest,
        files=files,
        graph=graph,
        intent_id=intent_id,
        host=host,
        subject=subject,
        payload=actual_payload,
        gateway_url=gateway_url,
        approval=approval,
        approve=approve,
        now=now,
    )
    if binding.get("status") != "bound":
        return _seal(
            {
                "format": _receipt_format(manifest),
                "version": _binding_version(manifest),
                "status": "not-executed",
                "intent_id": intent_id,
                "binding_root": binding["binding_root"],
                "authority_status": (binding.get("authority") or {}).get("status"),
                "attempts": [],
                "result": None,
                "result_root": None,
            },
            "receipt_root",
        )
    state = PortableStateStore(
        state_root,
        manifest["app"]["id"],
        schema_version=str(manifest.get("state", {}).get("schema_version", "1")),
    )
    attempts: list[dict[str, Any]] = []
    result: Any = None
    selected: dict[str, Any] | None = None
    for offer in binding.get("candidate_chain", []):
        attempt = {
            "capability_id": offer["capability_id"],
            "capability_version": offer["capability_version"],
            "provider_id": offer["provider_id"],
            "descriptor_root": offer["descriptor_root"],
            "transport": copy.deepcopy(offer.get("transport", {})),
        }
        try:
            result = _execute_offer(
                offer,
                manifest=manifest,
                files=files,
                graph=graph,
                host=host,
                payload=actual_payload,
                state=state,
                gateway_url=gateway_url,
            )
            attempt["status"] = "succeeded"
            attempt["result_root"] = cnp.sha256_root(result)
            attempts.append(attempt)
            selected = offer
            break
        except Exception as exc:  # execution boundary records provider failure and continues
            attempt["status"] = "failed"
            attempt["error"] = {"type": type(exc).__name__, "message": str(exc)}
            attempts.append(attempt)
    status = "executed" if selected is not None else "failed"
    intent = graph["intents"][intent_id]
    result_binding = (intent.get("execution") or {}).get("result_binding")
    if selected is not None and isinstance(result_binding, str) and "." in result_binding:
        partition, key = result_binding.split(".", 1)
        if partition in {"portable", "device_private", "secret", "cache", "ephemeral"}:
            state.set(key, result, partition=partition)
    evidence = {
        "binding_root": binding["binding_root"],
        "capability_snapshot": binding["capability_snapshot"],
        "authority_decision_root": binding["authority"].get("decision_root"),
        "provider_descriptor_root": selected.get("descriptor_root") if selected else None,
        "state_root": state.status()["state_root"],
    }
    receipt = {
        "format": _receipt_format(manifest),
        "version": _binding_version(manifest),
        "status": status,
        "app_id": manifest["app"]["id"],
        "intent_id": intent_id,
        "binding_root": binding["binding_root"],
        "authority_status": binding["authority"].get("status"),
        "selected": (
            {
                "capability_id": selected["capability_id"],
                "capability_version": selected["capability_version"],
                "provider_id": selected["provider_id"],
                "descriptor_root": selected["descriptor_root"],
            }
            if selected
            else None
        ),
        "attempts": attempts,
        "result": result,
        "result_root": cnp.sha256_root(result) if selected else None,
        "evidence": evidence,
        "evidence_root": cnp.sha256_root(evidence),
    }
    return _seal(receipt, "receipt_root")


def _open_rfe_store(root: Path, app_id: str):
    try:
        from rfe_core_sdk import RealityStore
    except ImportError as exc:
        raise HNACError("RFE Core SDK is unavailable") from exc
    world_id = f"reality:hnaf:{app_id}"
    if (root / "store.json").exists():
        store = RealityStore(root)
        if store.world_id != world_id:
            raise HNACError(f"RFE reality mismatch: {store.world_id} != {world_id}")
        return store
    return RealityStore.init(root, world_id=world_id, branch_id="branch:main")


def _rfe_base_generation(store: Any) -> dict[str, Any]:
    current = store.current_generation()
    return {
        "reality_id": current["worldId"],
        "generation": int(current["realityRevision"]),
        "generation_root": current["integrityHash"],
    }


def _commit_execution_record(
    *,
    store: Any,
    manifest: dict[str, Any],
    actor: dict[str, Any],
    intent_id: str,
    execution_record: dict[str, Any],
    policy_raw: dict[str, Any],
    now: str,
) -> dict[str, Any]:
    try:
        from rncs_contract import new_proposal
        from rfe_core_sdk import commit_authorized_envelope
    except ImportError as exc:
        raise HNACError("RFE/RNCS commit bridge is unavailable") from exc
    current = store.current_generation()
    record_root = cnp.sha256_root(execution_record)
    receipt_id = f"execution-receipt:{record_root[:32]}"
    operations = [
        {
            "op": "createIdentity",
            "identity": {
                "id": receipt_id,
                "kind": "hnaf-execution-receipt",
                "continuityPolicy": "persistent",
                "metadata": {"app_id": manifest["app"]["id"], "intent_id": intent_id},
            },
        },
        {
            "op": "setFact",
            "fact": {
                "subject": receipt_id,
                "predicate": "hnaf.execution.record",
                "value": copy.deepcopy(execution_record),
                "source": "source:hnaf-v0.8",
                "confidence": 1,
                "visibility": {"type": "private", "subject": actor["subject_id"]},
            },
        },
    ]
    envelope = new_proposal(
        reality_id=current["worldId"],
        base_generation=int(current["realityRevision"]),
        base_generation_root=current["integrityHash"],
        subject={
            "subject_id": actor["subject_id"],
            "kind": actor["kind"],
            "roles": actor["roles"],
            "responsibility_boundary": actor["responsibility_boundary"],
        },
        intent={
            "intent_id": f"{intent_id}:commit-receipt",
            "source": "hnaf-execution-fabric",
            "goals": [{"type": "rfe.execution-receipt.commit", "record_root": record_root}],
            "constraints": ["original-authority-decision-linked", "append-only-evidence"],
        },
        capability_plan={
            "plan_id": f"plan:rfe-commit:{record_root[:24]}",
            "capabilities": [
                {
                    "capability_id": "rfe.execution-receipt.commit",
                    "provider": "provider:rfe-local-core",
                    "required_scopes": ["state.write"],
                    "risk": "low",
                    "reversible": True,
                    "cost": {"cpu_millis": 1, "memory_mb": 1, "network_kb": 0, "monetary_microunits": 0},
                }
            ],
            "host_bindings": [{"host_id": "rfe.local-core"}],
            "required_scopes": ["state.write"],
        },
        inputs=[{"kind": "execution-record", "id": receipt_id, "root": record_root}],
        provisional_delta={"operations": operations},
        causal_basis={
            "events": [{"event_id": f"event:{record_root[:16]}", "kind": "provider-execution-completed"}],
            "rules": [{"rule_id": "commit-after-authorized-execution", "expression": "record only completed provider result"}],
            "simulation_refs": [],
        },
        evidence={
            "nodes": [
                {
                    "evidence_id": f"evidence:{record_root[:24]}",
                    "kind": "execution-record",
                    "source": "HNAF v0.8",
                    "content_root": record_root,
                }
            ],
            "edges": [],
        },
        transition_id=f"transition:rfe-receipt:{record_root[:24]}",
        extensions={"hnaf": {"execution_record_root": record_root}},
    )
    policy = aaf.seal_policy_bundle(policy_raw)
    negotiation = {
        "plan": {
            "steps": [
                {
                    "capability_id": "rfe.execution-receipt.commit",
                    "required_scopes": ["state.write"],
                    "risk": {"level": "low", "reasons": ["append-execution-evidence"]},
                    "reversible": True,
                    "cost": {"cpu_millis": 1, "memory_mb": 1, "network_kb": 0, "monetary_microunits": 0},
                }
            ]
        }
    }
    decision = aaf.evaluate_authority(
        envelope=envelope,
        negotiation=negotiation,
        policy_bundle=policy,
        identity_scopes=actor["scopes"],
        context={"now": now, "environment": "local", "request_id": f"authority:{envelope['transition_id']}"},
        approvals=[],
    )
    if decision.get("status") != "approved":
        return {
            "status": "not-committed",
            "reason": decision.get("reason"),
            "decision_root": decision.get("decision_root"),
            "execution_record_root": record_root,
        }
    committed = commit_authorized_envelope(store, decision["authorized_envelope"])
    generation = committed["generation"]
    return {
        "status": "committed",
        "execution_record_root": record_root,
        "decision_root": decision["decision_root"],
        "generation": {
            "reality_id": generation["worldId"],
            "generation": generation["realityRevision"],
            "generation_id": generation["generationId"],
            "generation_root": generation["integrityHash"],
            "evidence_root": generation["evidenceRoot"],
        },
        "rfe_receipt_root": committed["receipt"]["integrityHash"],
        "committed_envelope_root": committed["envelope"]["envelope_root"],
    }


def execute_intent(
    *,
    manifest: dict[str, Any],
    files: dict[str, bytes],
    graph: dict[str, Any],
    intent_id: str,
    host: HostProfile,
    state_root: Path,
    subject: dict[str, Any] | None = None,
    payload: dict[str, Any] | None = None,
    gateway_url: str | None = None,
    approval: dict[str, Any] | None = None,
    approve: bool = False,
    now: str | None = None,
    idempotency_key: str | None = None,
    cancel_path: Path | None = None,
    rfe_root: Path | None = None,
) -> dict[str, Any]:
    if _binding_version(manifest) == "0.7":
        return _execute_intent_v07(
            manifest=manifest,
            files=files,
            graph=graph,
            intent_id=intent_id,
            host=host,
            state_root=state_root,
            subject=subject,
            payload=payload,
            gateway_url=gateway_url,
            approval=approval,
            approve=approve,
            now=now,
        )
    assets = load_binding_assets(manifest, files)
    execution_policy: ExecutionPolicy = assets["execution_policy"]
    actual_payload = dict(payload or {})
    actor = _subject(subject)
    effective_now = now or _utc_now()
    rfe_store = None
    base_generation = None
    if execution_policy.commit_receipts_to_rfe or rfe_root is not None:
        rfe_store = _open_rfe_store(rfe_root or (state_root / ".rfe"), manifest["app"]["id"])
        base_generation = _rfe_base_generation(rfe_store)
    binding = bind_intent(
        manifest=manifest,
        files=files,
        graph=graph,
        intent_id=intent_id,
        host=host,
        subject=actor,
        payload=actual_payload,
        gateway_url=gateway_url,
        approval=approval,
        approve=approve,
        now=effective_now,
        base_generation=base_generation,
    )
    if binding.get("status") != "bound":
        return _seal(
            {
                "format": _receipt_format(manifest),
                "version": "0.8",
                "status": "not-executed",
                "intent_id": intent_id,
                "binding_root": binding["binding_root"],
                "authority_status": (binding.get("authority") or {}).get("status"),
                "attempts": [],
                "result": None,
                "result_root": None,
            },
            "receipt_root",
        )
    key_source = "caller" if idempotency_key else "auto"
    effective_key = idempotency_key or f"auto:{cnp.sha256_root({'app': manifest['app']['id'], 'intent': intent_id, 'subject': actor['subject_id'], 'payload': actual_payload, 'now': effective_now})}"
    ledger = IdempotencyLedger(state_root)
    replay = ledger.get(effective_key, now_epoch=parse_time(effective_now))
    if replay is not None:
        return _seal(
            {
                "format": "hnaf.idempotency-replay.v0.8",
                "version": "0.8",
                "status": "idempotent-replay",
                "idempotency_key": effective_key,
                "original_receipt_root": replay.get("receipt_root"),
                "receipt": replay,
                "replayed_at": effective_now,
            },
            "replay_root",
        )
    state = PortableStateStore(
        state_root,
        manifest["app"]["id"],
        schema_version=str(manifest.get("state", {}).get("schema_version", "1")),
    )

    def builtin_factory(offer: dict[str, Any]):
        def invoke(handler: str) -> Any:
            return _builtin_handler(
                handler,
                manifest=manifest,
                files=files,
                graph=graph,
                host=host,
                payload=actual_payload,
                state=state,
            )
        return invoke

    def gateway_factory(offer: dict[str, Any]):
        transport = offer.get("transport") or {}
        endpoint = str(transport.get("endpoint") or gateway_url or "")
        if not endpoint:
            return None
        client = GatewayClient(endpoint, timeout_seconds=execution_policy.timeout_ms / 1000)
        def invoke(_: dict[str, Any]) -> Any:
            runtime_id = str(transport.get("runtime_id", ""))
            action = str(transport.get("action", ""))
            if not runtime_id or not action:
                raise HNACError("Reality One provider transport is missing runtime_id/action")
            return client.invoke(runtime_id, action, copy.deepcopy(actual_payload))
        return invoke

    execution = execute_authorized_chain(
        offers=binding.get("candidate_chain", []),
        payload=actual_payload,
        policy=execution_policy,
        state_root=state_root,
        idempotency_key=effective_key,
        now=effective_now,
        builtin_factory=builtin_factory,
        gateway_factory=gateway_factory,
        cancel_path=cancel_path,
    )
    selected = execution.get("selected")
    result = execution.get("result")
    status = execution["status"]
    intent = graph["intents"][intent_id]
    result_binding = (intent.get("execution") or {}).get("result_binding")
    if status == "executed" and isinstance(result_binding, str) and "." in result_binding:
        partition, key = result_binding.split(".", 1)
        if partition in {"portable", "device_private", "secret", "cache", "ephemeral"}:
            state.set(key, result, partition=partition)
    evidence = {
        "binding_root": binding["binding_root"],
        "capability_snapshot": binding["capability_snapshot"],
        "authority_decision_root": binding["authority"].get("decision_root"),
        "provider_descriptor_root": selected.get("descriptor_root") if selected else None,
        "supply_chain_verification_root": binding["supply_chain"]["verification_root"],
        "execution_policy_root": binding["execution_policy_root"],
        "state_root": state.status()["state_root"],
    }
    execution_record = {
        "format": "hnaf.execution-record.v0.8",
        "app_id": manifest["app"]["id"],
        "intent_id": intent_id,
        "subject_id": actor["subject_id"],
        "status": status,
        "idempotency_key": effective_key,
        "selected": (
            {
                "capability_id": selected["capability_id"],
                "capability_version": selected["capability_version"],
                "provider_id": selected["provider_id"],
                "descriptor_root": selected["descriptor_root"],
            }
            if selected else None
        ),
        "attempts": execution["attempts"],
        "result_root": cnp.sha256_root(result) if selected else None,
        "evidence_root": cnp.sha256_root(evidence),
        "executed_at": effective_now,
    }
    rfe_commit = None
    if rfe_store is not None and status == "executed":
        rfe_commit = _commit_execution_record(
            store=rfe_store,
            manifest=manifest,
            actor=actor,
            intent_id=intent_id,
            execution_record=execution_record,
            policy_raw=assets["policy"],
            now=effective_now,
        )
    receipt = {
        "format": _receipt_format(manifest),
        "version": "0.8",
        "status": status,
        "app_id": manifest["app"]["id"],
        "intent_id": intent_id,
        "binding_root": binding["binding_root"],
        "authority_status": binding["authority"].get("status"),
        "idempotency_key": effective_key,
        "idempotency_source": key_source,
        "idempotent_replay": False,
        "selected": execution_record["selected"],
        "attempts": execution["attempts"],
        "result": result,
        "result_root": execution_record["result_root"],
        "evidence": evidence,
        "evidence_root": execution_record["evidence_root"],
        "execution_record_root": cnp.sha256_root(execution_record),
        "rfe_commit": rfe_commit,
    }
    receipt = _seal(receipt, "receipt_root")
    ledger.put(
        effective_key,
        receipt,
        now_epoch=parse_time(effective_now),
        ttl_seconds=execution_policy.idempotency_ttl_seconds,
    )
    return receipt

