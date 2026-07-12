from __future__ import annotations

from typing import Any

import wasmtime
from wasmtime.component import (
    Bool,
    BorrowType,
    Component,
    ComponentInstanceType,
    ComponentType,
    EnumType,
    F32,
    F64,
    FlagsType,
    FuncType,
    ListType,
    OptionType,
    OwnType,
    RecordType,
    ResultType,
    S8,
    S16,
    S32,
    S64,
    String,
    TupleType,
    U8,
    U16,
    U32,
    U64,
    VariantType,
)

from .errors import HNACError

WIT_IMPORT_TO_CAPABILITY: dict[str, str] = {
    "hnaf:capabilities/log@0.3.0": "host.log",
    "hnaf:capabilities/clock@0.3.0": "host.clock",
    "hnaf:capabilities/environment@0.3.0": "environment.summary",
    "hnaf:capabilities/kv@0.3.0": "storage.kv",
}


WIT_INTERFACE_CONTRACTS: dict[str, dict[str, Any]] = {
    "hnaf:capabilities/log@0.3.0": {
        "write": {"kind": "func", "params": [{"name": "message", "type": "string"}], "result": None},
    },
    "hnaf:capabilities/clock@0.3.0": {
        "now-unix-ms": {"kind": "func", "params": [], "result": "u64"},
    },
    "hnaf:capabilities/environment@0.3.0": {
        "get-summary": {
            "kind": "func",
            "params": [],
            "result": {
                "record": {
                    "system": "string",
                    "release": "string",
                    "machine": "string",
                    "runtime": "string",
                }
            },
        },
    },
    "hnaf:capabilities/kv@0.3.0": {
        "get": {
            "kind": "func",
            "params": [{"name": "key", "type": "string"}],
            "result": {"option": "string"},
        },
        "set": {
            "kind": "func",
            "params": [
                {"name": "key", "type": "string"},
                {"name": "value", "type": "string"},
            ],
            "result": None,
        },
    },
}

_PRIMITIVES: tuple[tuple[type[Any], str], ...] = (
    (Bool, "bool"),
    (U8, "u8"),
    (U16, "u16"),
    (U32, "u32"),
    (U64, "u64"),
    (S8, "s8"),
    (S16, "s16"),
    (S32, "s32"),
    (S64, "s64"),
    (F32, "f32"),
    (F64, "f64"),
    (String, "string"),
)


def describe_valtype(value: Any) -> Any:
    for cls, name in _PRIMITIVES:
        if isinstance(value, cls):
            return name
    if isinstance(value, ListType):
        return {"list": describe_valtype(value.element)}
    if isinstance(value, RecordType):
        return {"record": {name: describe_valtype(ty) for name, ty in value.fields}}
    if isinstance(value, TupleType):
        return {"tuple": [describe_valtype(item) for item in value.elements]}
    if isinstance(value, VariantType):
        return {"variant": {name: None if ty is None else describe_valtype(ty) for name, ty in value.cases}}
    if isinstance(value, EnumType):
        return {"enum": value.names}
    if isinstance(value, OptionType):
        return {"option": describe_valtype(value.payload)}
    if isinstance(value, ResultType):
        return {
            "result": {
                "ok": None if value.ok is None else describe_valtype(value.ok),
                "err": None if value.err is None else describe_valtype(value.err),
            }
        }
    if isinstance(value, FlagsType):
        return {"flags": value.names}
    if isinstance(value, OwnType):
        return "own<resource>"
    if isinstance(value, BorrowType):
        return "borrow<resource>"
    return value.__class__.__name__


def describe_item(item: Any, engine: wasmtime.Engine) -> dict[str, Any]:
    if isinstance(item, FuncType):
        return {
            "kind": "func",
            "params": [{"name": name, "type": describe_valtype(ty)} for name, ty in item.params],
            "result": None if item.result is None else describe_valtype(item.result),
        }
    if isinstance(item, ComponentInstanceType):
        return {
            "kind": "instance",
            "exports": {name: describe_item(value, engine) for name, value in item.exports(engine).items()},
        }
    if isinstance(item, ComponentType):
        return {
            "kind": "component",
            "imports": {name: describe_item(value, engine) for name, value in item.imports(engine).items()},
            "exports": {name: describe_item(value, engine) for name, value in item.exports(engine).items()},
        }
    return {"kind": item.__class__.__name__}


def inspect_component(component: Component, engine: wasmtime.Engine) -> dict[str, Any]:
    component_type = component.type
    return {
        "imports": {name: describe_item(item, engine) for name, item in component_type.imports(engine).items()},
        "exports": {name: describe_item(item, engine) for name, item in component_type.exports(engine).items()},
    }


def validate_component_contract(
    component: Component,
    engine: wasmtime.Engine,
    manifest: dict[str, Any],
    granted_capabilities: set[str],
    export_name: str = "run",
) -> dict[str, Any]:
    report = inspect_component(component, engine)
    manifest_caps = {item["id"] for item in manifest["capabilities"]}
    mapped_imports: list[dict[str, str]] = []
    unknown_imports: list[str] = []
    undeclared_imports: list[str] = []
    ungranted_imports: list[str] = []
    interface_mismatches: list[str] = []

    for import_name, item in report["imports"].items():
        capability = WIT_IMPORT_TO_CAPABILITY.get(import_name)
        if capability is None:
            unknown_imports.append(import_name)
            continue
        mapped_imports.append({"import": import_name, "capability": capability})
        if capability not in manifest_caps:
            undeclared_imports.append(capability)
        if capability not in granted_capabilities:
            ungranted_imports.append(capability)
        if item.get("kind") != "instance":
            raise HNACError(f"Component capability import must be an interface instance: {import_name}")
        expected = WIT_INTERFACE_CONTRACTS[import_name]
        if item.get("exports") != expected:
            interface_mismatches.append(import_name)

    if unknown_imports:
        raise HNACError(f"Unknown Component Model imports: {', '.join(sorted(unknown_imports))}")
    if undeclared_imports:
        raise HNACError(f"Component imports undeclared capabilities: {', '.join(sorted(set(undeclared_imports)))}")
    if ungranted_imports:
        raise HNACError(f"Component imports capabilities without leases: {', '.join(sorted(set(ungranted_imports)))}")
    if interface_mismatches:
        raise HNACError(f"Component WIT interface mismatch: {', '.join(sorted(interface_mismatches))}")

    export = report["exports"].get(export_name)
    if export is None:
        raise HNACError(f"Component must export {export_name}")
    if export.get("kind") != "func":
        raise HNACError(f"Component export {export_name} must be a function")
    if export.get("params"):
        raise HNACError(f"Component export {export_name} must not require parameters")

    graph_nodes = [{"id": "component", "kind": "component"}, {"id": f"export:{export_name}", "kind": "export"}]
    graph_edges = [{"from": "component", "to": f"export:{export_name}", "relation": "provides"}]
    for mapped in mapped_imports:
        import_id = f"import:{mapped['import']}"
        capability_id = f"capability:{mapped['capability']}"
        adapter_id = f"adapter:{mapped['import']}"
        graph_nodes.extend([
            {"id": import_id, "kind": "wit-interface"},
            {"id": capability_id, "kind": "semantic-capability"},
            {"id": adapter_id, "kind": "host-adapter"},
        ])
        graph_edges.extend([
            {"from": "component", "to": import_id, "relation": "imports"},
            {"from": import_id, "to": capability_id, "relation": "maps-to"},
            {"from": capability_id, "to": adapter_id, "relation": "materialized-by"},
        ])

    return {
        **report,
        "export": export_name,
        "mapped_imports": mapped_imports,
        "manifest_capabilities": sorted(manifest_caps),
        "contract_status": "valid",
        "composition_graph": {"nodes": graph_nodes, "edges": graph_edges},
    }
