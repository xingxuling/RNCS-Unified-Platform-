from __future__ import annotations

import dataclasses
import time
from typing import Any

import wasmtime
from wasmtime.component import Component, Linker, Record

from ..capabilities import CapabilityBroker
from ..component_contract import WIT_IMPORT_TO_CAPABILITY, validate_component_contract
from ..errors import HNACError
from ..manifest import execution_candidates


class WasmComponentExecutor:
    """WebAssembly Component Model executor using Wasmtime's typed component API."""

    profile = "wasm-component@1"

    def __init__(self) -> None:
        config = wasmtime.Config()
        config.consume_fuel = True
        self.engine = wasmtime.Engine(config)

    @staticmethod
    def _selected_candidate(manifest: dict[str, Any]) -> dict[str, Any]:
        for candidate in execution_candidates(manifest):
            if candidate["profile"] == WasmComponentExecutor.profile:
                return candidate
        raise HNACError("Manifest has no wasm-component@1 execution candidate")

    @staticmethod
    def _normalize(value: Any) -> Any:
        if value is None or isinstance(value, (bool, int, float, str)):
            return value
        if dataclasses.is_dataclass(value):
            return {key: WasmComponentExecutor._normalize(item) for key, item in dataclasses.asdict(value).items()}
        if hasattr(value, "__dict__"):
            return {key: WasmComponentExecutor._normalize(item) for key, item in value.__dict__.items()}
        if isinstance(value, (list, tuple)):
            return [WasmComponentExecutor._normalize(item) for item in value]
        return repr(value)

    @staticmethod
    def _define_log(root: Any, broker: CapabilityBroker) -> None:
        with root.add_instance("hnaf:capabilities/log@0.3.0") as interface:
            def write(_store: Any, message: str) -> None:
                broker.call("host.log", "write", {"message": message})
            interface.add_func("write", write)

    @staticmethod
    def _define_clock(root: Any, broker: CapabilityBroker) -> None:
        with root.add_instance("hnaf:capabilities/clock@0.3.0") as interface:
            def now_unix_ms(_store: Any) -> int:
                return int(broker.call("host.clock", "now-unix-ms", {}))
            interface.add_func("now-unix-ms", now_unix_ms)

    @staticmethod
    def _define_environment(root: Any, broker: CapabilityBroker) -> None:
        with root.add_instance("hnaf:capabilities/environment@0.3.0") as interface:
            def get_summary(_store: Any) -> Record:
                raw = broker.call("environment.summary", "get", {})
                value = Record()
                value.system = str(raw["system"])
                value.release = str(raw["release"])
                value.machine = str(raw["machine"])
                value.runtime = str(raw["runtime"])
                return value
            interface.add_func("get-summary", get_summary)

    @staticmethod
    def _define_kv(root: Any, broker: CapabilityBroker) -> None:
        with root.add_instance("hnaf:capabilities/kv@0.3.0") as interface:
            def get(_store: Any, key: str) -> str | None:
                value = broker.call("storage.kv", "get", {"key": key, "default": None})
                return None if value is None else str(value)

            def set_value(_store: Any, key: str, value: str) -> None:
                broker.call("storage.kv", "set", {"key": key, "value": value})

            interface.add_func("get", get)
            interface.add_func("set", set_value)

    def _define_imports(self, linker: Linker, import_names: set[str], broker: CapabilityBroker) -> None:
        definers = {
            "hnaf:capabilities/log@0.3.0": self._define_log,
            "hnaf:capabilities/clock@0.3.0": self._define_clock,
            "hnaf:capabilities/environment@0.3.0": self._define_environment,
            "hnaf:capabilities/kv@0.3.0": self._define_kv,
        }
        with linker.root() as root:
            for import_name in sorted(import_names):
                capability = WIT_IMPORT_TO_CAPABILITY.get(import_name)
                if capability is None:
                    raise HNACError(f"No host adapter for component import: {import_name}")
                if capability not in broker.grants:
                    raise HNACError(f"No capability lease for component import: {capability}")
                definers[import_name](root, broker)

    def inspect_contract(self, payload: bytes, manifest: dict[str, Any], granted_capabilities: set[str]) -> dict[str, Any]:
        try:
            component = Component(self.engine, payload)
        except wasmtime.WasmtimeError as exc:
            raise HNACError(f"Invalid WebAssembly component: {exc}") from exc
        candidate = self._selected_candidate(manifest)
        export_name = str(candidate.get("export", "run"))
        return validate_component_contract(component, self.engine, manifest, granted_capabilities, export_name)

    def execute(self, payload: bytes, broker: CapabilityBroker, manifest: dict[str, Any], limits: dict[str, Any]) -> dict[str, Any]:
        try:
            component = Component(self.engine, payload)
        except wasmtime.WasmtimeError as exc:
            raise HNACError(f"Invalid WebAssembly component: {exc}") from exc

        candidate = self._selected_candidate(manifest)
        export_name = str(candidate.get("export", "run"))
        contract = validate_component_contract(component, self.engine, manifest, set(broker.grants), export_name)

        fuel = int(limits.get("fuel", 2_000_000))
        memory_bytes = int(limits.get("memory_bytes", 16 * 1024 * 1024))
        store = wasmtime.Store(self.engine)
        store.set_fuel(fuel)
        store.set_limits(memory_size=memory_bytes, instances=32, memories=16, tables=16)
        linker = Linker(self.engine)
        self._define_imports(linker, set(contract["imports"]), broker)

        started = time.perf_counter_ns()
        try:
            instance = linker.instantiate(store, component)
            entry = instance.get_func(store, export_name)
            if entry is None:
                raise HNACError(f"Component export is not callable: {export_name}")
            result = entry(store)
            entry.post_return(store)
        except (wasmtime.WasmtimeError, wasmtime.Trap) as exc:
            raise HNACError(f"Component execution failed: {exc}") from exc
        elapsed = time.perf_counter_ns() - started

        return {
            "profile": self.profile,
            "export": export_name,
            "result": self._normalize(result),
            "fuel_initial": fuel,
            "fuel_remaining": store.get_fuel(),
            "elapsed_ns": elapsed,
            "contract": contract,
        }
