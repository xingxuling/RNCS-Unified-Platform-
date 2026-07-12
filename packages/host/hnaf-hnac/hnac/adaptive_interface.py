from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator

from .errors import HNACError
from .host import HostProfile
from .util import canonical_json, sha256_bytes

AIP_VERSIONS = {"0.6", "0.7"}
LATEST_AIP_VERSION = "0.7"
NODE_KINDS = {"action", "information", "navigation", "document", "media", "spatial", "group"}
PROJECTION_PROFILES = {"desktop", "tablet", "phone", "accessibility", "spatial"}
PRIORITY_ORDER = {"critical": 0, "primary": 1, "secondary": 2, "supporting": 3, "low": 4}


@dataclass(frozen=True)
class InterfaceEvent:
    mode: str
    signal: str
    value: str | None = None
    target: str | None = None

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "InterfaceEvent":
        mode = str(value.get("mode", "")).strip().lower()
        signal = str(value.get("signal", "")).strip()
        if not mode or not signal:
            raise HNACError("Interface event requires non-empty mode and signal")
        raw_value = value.get("value")
        raw_target = value.get("target")
        return cls(
            mode=mode,
            signal=signal,
            value=None if raw_value is None else str(raw_value),
            target=None if raw_target is None else str(raw_target),
        )


def _schema_path(version: str) -> Path:
    return Path(__file__).resolve().parent / "schemas" / f"aip-graph-{version}.schema.json"


def validate_graph(graph: dict[str, Any]) -> None:
    try:
        version = str(graph.get("version", ""))
        if version not in AIP_VERSIONS:
            raise HNACError(f"Unsupported adaptive interface version: {version}")
        schema = json.loads(_schema_path(version).read_text("utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HNACError("Installed package is missing a valid AIP schema") from exc
    errors = sorted(Draft202012Validator(schema).iter_errors(graph), key=lambda e: list(e.path))
    if errors:
        details = "; ".join(f"{'.'.join(map(str, error.path)) or '<root>'}: {error.message}" for error in errors[:10])
        raise HNACError(f"Adaptive interface graph validation failed: {details}")
    nodes = graph["nodes"]
    if graph["root"] not in nodes:
        raise HNACError(f"Adaptive interface root does not exist: {graph['root']}")
    for node_id, node in nodes.items():
        if node.get("kind") not in NODE_KINDS:
            raise HNACError(f"Unsupported adaptive interface node kind at {node_id}: {node.get('kind')}")
        for child in node.get("children", []):
            if child not in nodes:
                raise HNACError(f"Adaptive interface child does not exist: {node_id} -> {child}")
        intent = node.get("intent")
        if intent is not None and intent not in graph.get("intents", {}):
            raise HNACError(f"Adaptive interface node references unknown intent: {node_id} -> {intent}")
    _assert_acyclic(graph)


def _assert_acyclic(graph: dict[str, Any]) -> None:
    nodes = graph["nodes"]
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in visited:
            return
        if node_id in visiting:
            raise HNACError(f"Adaptive interface graph contains a cycle at {node_id}")
        visiting.add(node_id)
        for child in nodes[node_id].get("children", []):
            visit(child)
        visiting.remove(node_id)
        visited.add(node_id)

    visit(graph["root"])
    for node_id in sorted(nodes):
        visit(node_id)


def load_graph_bytes(data: bytes) -> dict[str, Any]:
    try:
        graph = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError("Adaptive interface graph must be valid UTF-8 JSON") from exc
    if not isinstance(graph, dict):
        raise HNACError("Adaptive interface graph must be a JSON object")
    validate_graph(graph)
    return graph


def load_graph(path: Path) -> dict[str, Any]:
    try:
        return load_graph_bytes(path.read_bytes())
    except OSError as exc:
        raise HNACError(f"Unable to read adaptive interface graph: {path}") from exc


def projection_profile(host: HostProfile) -> str:
    resources = host.resources
    policies = host.policies
    modes = {mode.lower() for mode in host.interaction_modes}
    if bool(resources.get("spatial")) or host.family.lower() in {"xr", "spatial"}:
        return "spatial"
    if bool(policies.get("accessibility_mode")) or bool(resources.get("screen_reader")) or "screen-reader" in modes:
        return "accessibility"
    width_value = resources.get("viewport_width", resources.get("width", 0))
    try:
        width = int(width_value or 0)
    except (TypeError, ValueError):
        width = 0
    family = host.family.lower()
    if family in {"mobile", "phone", "android", "ios"}:
        return "tablet" if width >= 700 else "phone"
    if family in {"tablet", "ipad"}:
        return "tablet"
    if family == "web" and width and width < 700:
        return "phone"
    if family == "web" and width and width < 1100:
        return "tablet"
    return "desktop"


def _visible(node: dict[str, Any], profile: str, host: HostProfile) -> bool:
    rule = node.get("visibility") or {}
    profiles = rule.get("profiles")
    if profiles and profile not in profiles:
        return False
    excluded = rule.get("exclude_profiles")
    if excluded and profile in excluded:
        return False
    required_modes = set(rule.get("interaction_modes", []))
    if required_modes and not required_modes.intersection(host.interaction_modes):
        return False
    width_value = host.resources.get("viewport_width", host.resources.get("width", 0))
    try:
        width = int(width_value or 0)
    except (TypeError, ValueError):
        width = 0
    if rule.get("min_width") is not None and width and width < int(rule["min_width"]):
        return False
    if rule.get("max_width") is not None and width and width > int(rule["max_width"]):
        return False
    return True


def _walk_order(graph: dict[str, Any], visible_ids: set[str]) -> list[str]:
    nodes = graph["nodes"]
    ordered: list[str] = []
    seen: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in seen or node_id not in visible_ids:
            return
        seen.add(node_id)
        ordered.append(node_id)
        children = [child for child in nodes[node_id].get("children", []) if child in visible_ids]
        children.sort(key=lambda child: (PRIORITY_ORDER.get(nodes[child].get("priority", "secondary"), 9), child))
        for child in children:
            visit(child)

    visit(graph["root"])
    for node_id in sorted(visible_ids, key=lambda item: (PRIORITY_ORDER.get(nodes[item].get("priority", "secondary"), 9), item)):
        visit(node_id)
    return ordered


def _affordance(kind: str, profile: str) -> str:
    table = {
        "action": {"phone": "full-width-action", "tablet": "touch-action", "desktop": "button", "accessibility": "command", "spatial": "spatial-control"},
        "information": {"phone": "stacked-card", "tablet": "card", "desktop": "panel", "accessibility": "reading-block", "spatial": "world-label"},
        "navigation": {"phone": "bottom-navigation", "tablet": "rail-navigation", "desktop": "sidebar-navigation", "accessibility": "landmark", "spatial": "portal"},
        "document": {"phone": "single-column-document", "tablet": "document", "desktop": "document-pane", "accessibility": "linear-document", "spatial": "document-surface"},
        "media": {"phone": "responsive-media", "tablet": "media-card", "desktop": "media-panel", "accessibility": "described-media", "spatial": "immersive-media"},
        "spatial": {"phone": "spatial-fallback-card", "tablet": "spatial-preview", "desktop": "spatial-preview", "accessibility": "spatial-description", "spatial": "spatial-anchor"},
        "group": {"phone": "stack", "tablet": "grid", "desktop": "region", "accessibility": "group", "spatial": "cluster"},
    }
    return table[kind][profile]


def _layout(profile: str, graph: dict[str, Any]) -> dict[str, Any]:
    defaults = {
        "phone": {"mode": "single-column", "columns": 1, "navigation": "bottom", "density": "comfortable"},
        "tablet": {"mode": "adaptive-grid", "columns": 2, "navigation": "rail", "density": "comfortable"},
        "desktop": {"mode": "multi-pane", "columns": 3, "navigation": "sidebar", "density": "compact"},
        "accessibility": {"mode": "linear", "columns": 1, "navigation": "landmarks", "density": "spacious"},
        "spatial": {"mode": "spatial-field", "columns": 0, "navigation": "portals", "density": "world-scale"},
    }
    override = (graph.get("projections") or {}).get(profile, {})
    return {**defaults[profile], **override}


def _binding(node: dict[str, Any]) -> dict[str, Any] | None:
    value = node.get("binding")
    if value is None:
        return None
    if isinstance(value, str):
        return {"path": value}
    return dict(value)


def compile_projection(graph: dict[str, Any], host: HostProfile) -> dict[str, Any]:
    validate_graph(graph)
    profile = projection_profile(host)
    visible_ids = {node_id for node_id, node in graph["nodes"].items() if _visible(node, profile, host)}
    if graph["root"] not in visible_ids:
        raise HNACError(f"Adaptive interface root is hidden for projection profile {profile}")
    order = _walk_order(graph, visible_ids)
    nodes: list[dict[str, Any]] = []
    for index, node_id in enumerate(order):
        source = graph["nodes"][node_id]
        node = {
            "id": node_id,
            "kind": source["kind"],
            "label": source.get("label", node_id),
            "description": source.get("description"),
            "priority": source.get("priority", "secondary"),
            "order": index,
            "affordance": _affordance(source["kind"], profile),
            "children": [child for child in source.get("children", []) if child in visible_ids],
        }
        for key in ("intent", "media", "spatial", "document", "navigation", "style", "fallback"):
            if key in source:
                node[key] = source[key]
        binding = _binding(source)
        if binding is not None:
            node["binding"] = binding
        nodes.append({key: value for key, value in node.items() if value is not None})
    intents = []
    for intent_id, intent in sorted(graph.get("intents", {}).items()):
        triggers = {
            mode: list(values)
            for mode, values in sorted((intent.get("triggers") or {}).items())
            if mode in host.interaction_modes
        }
        intents.append({
            "id": intent_id,
            "label": intent.get("label", intent_id),
            "risk": intent.get("risk", "low"),
            "confirmation": bool(intent.get("confirmation", False)),
            "triggers": triggers,
            "input_schema": intent.get("input_schema"),
            "goal": intent.get("goal"),
            "execution": intent.get("execution"),
            "authority": intent.get("authority"),
        })
    plan_version = f"hnaf.adaptive-interface-plan.v{graph['version']}"
    plan = {
        "version": plan_version,
        "graph_id": graph.get("id", "main"),
        "graph_version": graph["version"],
        "profile": profile,
        "host": {"id": host.id, "family": host.family},
        "root": graph["root"],
        "layout": _layout(profile, graph),
        "interaction_modes": sorted(host.interaction_modes),
        "nodes": nodes,
        "intents": [{key: value for key, value in intent.items() if value is not None} for intent in intents],
    }
    plan["semantic_snapshot"] = sha256_bytes(canonical_json(plan))
    return plan


def route_event(graph: dict[str, Any], host: HostProfile, event_value: dict[str, Any]) -> dict[str, Any]:
    validate_graph(graph)
    event = InterfaceEvent.from_dict(event_value)
    if event.mode not in host.interaction_modes:
        return {
            "status": "unsupported-mode",
            "mode": event.mode,
            "supported_modes": sorted(host.interaction_modes),
        }
    candidates: list[dict[str, Any]] = []
    if event.target:
        node = graph["nodes"].get(event.target)
        if node and node.get("intent"):
            candidates.append({"intent": node["intent"], "source": "target", "target": event.target})
    probe_values = {event.signal.casefold()}
    if event.value is not None:
        probe_values.add(event.value.strip().casefold())
    for intent_id, intent in sorted(graph.get("intents", {}).items()):
        triggers = (intent.get("triggers") or {}).get(event.mode, [])
        for trigger in triggers:
            if str(trigger).strip().casefold() in probe_values:
                candidates.append({"intent": intent_id, "source": "trigger", "trigger": trigger})
                break
    unique: dict[str, dict[str, Any]] = {candidate["intent"]: candidate for candidate in candidates}
    if not unique:
        return {
            "status": "unresolved",
            "mode": event.mode,
            "signal": event.signal,
            "value": event.value,
            "target": event.target,
        }
    if len(unique) > 1:
        return {
            "status": "ambiguous",
            "mode": event.mode,
            "candidates": sorted(unique),
        }
    intent_id, match = next(iter(unique.items()))
    intent = graph["intents"][intent_id]
    return {
        "status": "resolved",
        "intent": intent_id,
        "label": intent.get("label", intent_id),
        "risk": intent.get("risk", "low"),
        "confirmation_required": bool(intent.get("confirmation", False)),
        "mode": event.mode,
        "match": match,
        "payload": event.value,
    }


def interface_from_capsule_files(manifest: dict[str, Any], files: dict[str, bytes]) -> dict[str, Any] | None:
    interface = manifest.get("interface") or {}
    graph_path = interface.get("graph")
    interface_version = str(interface.get("version", ""))
    if not graph_path or interface_version not in AIP_VERSIONS:
        return None
    if graph_path not in files:
        raise HNACError(f"Adaptive interface graph not found in capsule: {graph_path}")
    graph = load_graph_bytes(files[graph_path])
    required = interface.get("version")
    if required and required != graph["version"]:
        raise HNACError(f"Adaptive interface version mismatch: manifest={required}, graph={graph['version']}")
    return graph
