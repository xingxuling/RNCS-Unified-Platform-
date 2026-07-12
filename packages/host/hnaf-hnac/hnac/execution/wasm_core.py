from __future__ import annotations

import json
from typing import Any, Callable

import wasmtime

from ..capabilities import CapabilityBroker, IMPORT_TO_CAPABILITY
from ..errors import HNACError


class WasmCoreExecutor:
    """Real Core Wasm executor using Wasmtime and the HNAF Core ABI v0.2.

    This is intentionally named wasm-core, not wasm-component. The component-model
    host remains a replaceable next executor and will consume the WIT contracts.
    """

    profile = "wasm-core@1"
    module_name = "hnaf"

    def __init__(self) -> None:
        config = wasmtime.Config()
        config.consume_fuel = True
        self.engine = wasmtime.Engine(config)

    @staticmethod
    def _memory(caller: wasmtime.Caller) -> wasmtime.Memory:
        memory = caller.get("memory")
        if not isinstance(memory, wasmtime.Memory):
            raise HNACError("Wasm guest must export memory")
        return memory

    @classmethod
    def _read_utf8(cls, caller: wasmtime.Caller, ptr: int, length: int) -> str:
        memory = cls._memory(caller)
        if ptr < 0 or length < 0 or ptr + length > memory.data_len(caller):
            raise HNACError("Wasm guest supplied an invalid memory range")
        try:
            return bytes(memory.read(caller, ptr, ptr + length)).decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HNACError("Wasm guest supplied invalid UTF-8") from exc

    @classmethod
    def _write_utf8(cls, caller: wasmtime.Caller, ptr: int, capacity: int, value: str) -> int:
        data = value.encode("utf-8")
        memory = cls._memory(caller)
        if ptr < 0 or capacity < 0 or ptr + capacity > memory.data_len(caller):
            raise HNACError("Wasm guest supplied an invalid output memory range")
        if len(data) > capacity:
            return len(data)
        memory.write(caller, data, ptr)
        return len(data)

    def _define_imports(self, linker: wasmtime.Linker, broker: CapabilityBroker) -> None:
        i32 = wasmtime.ValType.i32()

        def log_write(caller: wasmtime.Caller, ptr: int, length: int) -> int:
            message = self._read_utf8(caller, ptr, length)
            broker.call("host.log", "write", {"message": message})
            return 0

        def clock_now(caller: wasmtime.Caller, out_ptr: int, out_capacity: int) -> int:
            value = str(broker.call("host.clock", "now", {}))
            return self._write_utf8(caller, out_ptr, out_capacity, value)

        def environment_summary(caller: wasmtime.Caller, out_ptr: int, out_capacity: int) -> int:
            value = json.dumps(broker.call("environment.summary", "get", {}), ensure_ascii=False, sort_keys=True)
            return self._write_utf8(caller, out_ptr, out_capacity, value)

        def kv_get(caller: wasmtime.Caller, key_ptr: int, key_len: int, out_ptr: int, out_capacity: int) -> int:
            key = self._read_utf8(caller, key_ptr, key_len)
            value = broker.call("storage.kv", "get", {"key": key, "default": "first portable launch"})
            return self._write_utf8(caller, out_ptr, out_capacity, str(value))

        def kv_set(caller: wasmtime.Caller, key_ptr: int, key_len: int, value_ptr: int, value_len: int) -> int:
            key = self._read_utf8(caller, key_ptr, key_len)
            value = self._read_utf8(caller, value_ptr, value_len)
            broker.call("storage.kv", "set", {"key": key, "value": value})
            return 0

        definitions: list[tuple[str, list[wasmtime.ValType], list[wasmtime.ValType], Callable[..., Any]]] = [
            ("log_write", [i32, i32], [i32], log_write),
            ("clock_now", [i32, i32], [i32], clock_now),
            ("environment_summary", [i32, i32], [i32], environment_summary),
            ("kv_get", [i32, i32, i32, i32], [i32], kv_get),
            ("kv_set", [i32, i32, i32, i32], [i32], kv_set),
        ]
        for name, params, results, function in definitions:
            linker.define_func(self.module_name, name, wasmtime.FuncType(params, results), function, access_caller=True)

    @staticmethod
    def _validate_imports(module: wasmtime.Module, broker: CapabilityBroker) -> None:
        for imported in module.imports:
            if imported.module != "hnaf" or imported.name not in IMPORT_TO_CAPABILITY:
                raise HNACError(f"Forbidden Wasm import: {imported.module}/{imported.name}")
            capability = IMPORT_TO_CAPABILITY[imported.name]
            if capability not in broker.grants:
                raise HNACError(f"Wasm imports capability without a granted lease: {capability}")

    def execute(self, payload: bytes, broker: CapabilityBroker, manifest: dict[str, Any], limits: dict[str, Any]) -> dict[str, Any]:
        try:
            module = wasmtime.Module(self.engine, payload)
        except wasmtime.WasmtimeError as exc:
            raise HNACError(f"Invalid Wasm module: {exc}") from exc
        self._validate_imports(module, broker)

        store = wasmtime.Store(self.engine)
        fuel = int(limits.get("fuel", 2_000_000))
        memory_bytes = int(limits.get("memory_bytes", 16 * 1024 * 1024))
        store.set_fuel(fuel)
        store.set_limits(memory_size=memory_bytes, instances=4, memories=2, tables=4)
        linker = wasmtime.Linker(self.engine)
        self._define_imports(linker, broker)
        try:
            instance = linker.instantiate(store, module)
            exports = instance.exports(store)
            run = exports.get("run")
            if not isinstance(run, wasmtime.Func):
                raise HNACError("Wasm guest must export run() -> i32")
            code = run(store)
        except (wasmtime.WasmtimeError, wasmtime.Trap) as exc:
            raise HNACError(f"Wasm execution failed: {exc}") from exc
        if code != 0:
            raise HNACError(f"Wasm guest returned non-zero status: {code}")
        return {
            "profile": self.profile,
            "status_code": code,
            "fuel_initial": fuel,
            "fuel_remaining": store.get_fuel(),
            "imports": [f"{item.module}/{item.name}" for item in module.imports],
        }
