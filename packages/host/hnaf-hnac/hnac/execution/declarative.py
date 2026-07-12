from __future__ import annotations

import json
from typing import Any

from ..capabilities import CapabilityBroker
from ..errors import HNACError


def resolve_template(value: Any, variables: dict[str, Any]) -> Any:
    if isinstance(value, str):
        result = value
        for key, val in variables.items():
            token = "{{" + key + "}}"
            if token in result:
                rendered = json.dumps(val, ensure_ascii=False) if isinstance(val, (dict, list)) else str(val)
                result = result.replace(token, rendered)
        return result
    if isinstance(value, list):
        return [resolve_template(item, variables) for item in value]
    if isinstance(value, dict):
        return {key: resolve_template(item, variables) for key, item in value.items()}
    return value


class DeclarativeExecutor:
    profile = "declarative-v0"

    def execute(self, payload: bytes, broker: CapabilityBroker, manifest: dict[str, Any], limits: dict[str, Any]) -> dict[str, Any]:
        try:
            component = json.loads(payload.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HNACError("Invalid declarative component") from exc
        if component.get("profile") != self.profile or not isinstance(component.get("operations"), list):
            raise HNACError("Invalid declarative component profile")
        variables: dict[str, Any] = {"app.name": manifest["app"]["name"], "app.version": manifest["app"]["version"]}
        max_ops = int(limits.get("operations", 10_000))
        if len(component["operations"]) > max_ops:
            raise HNACError("Declarative operation limit exceeded")
        for index, operation in enumerate(component["operations"]):
            kind = operation.get("op")
            if kind == "set":
                variables[str(operation["name"])] = resolve_template(operation.get("value"), variables)
            elif kind == "capability_call":
                args = resolve_template(operation.get("args", {}), variables)
                value = broker.call(str(operation["capability"]), str(operation["method"]), args)
                if "save_as" in operation:
                    variables[str(operation["save_as"])] = value
            elif kind == "print":
                print(resolve_template(operation.get("text", ""), variables))
            elif kind == "assert":
                left = resolve_template(operation.get("left"), variables)
                right = resolve_template(operation.get("right"), variables)
                if left != right:
                    raise HNACError(f"Assertion failed at operation {index}: {left!r} != {right!r}")
            else:
                raise HNACError(f"Unknown operation at index {index}: {kind}")
        return {"profile": self.profile, "operations": len(component["operations"]), "variables": variables}
