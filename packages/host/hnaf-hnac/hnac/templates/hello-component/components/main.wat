(module
  (import "hnaf" "log_write" (func $log_write (param i32 i32) (result i32)))
  (import "hnaf" "clock_now" (func $clock_now (param i32 i32) (result i32)))
  (import "hnaf" "environment_summary" (func $environment_summary (param i32 i32) (result i32)))
  (import "hnaf" "kv_get" (func $kv_get (param i32 i32 i32 i32) (result i32)))
  (import "hnaf" "kv_set" (func $kv_set (param i32 i32 i32 i32) (result i32)))

  (memory (export "memory") 1 4)
  (data (i32.const 0) "HNAC v0.2 real Wasm execution through capability leases.")
  (data (i32.const 128) "launch_state")
  (data (i32.const 256) "capsule executed through Wasmtime and state persisted")

  (func (export "run") (result i32)
    (local $length i32)

    i32.const 0
    i32.const 56
    call $log_write
    drop

    i32.const 1024
    i32.const 256
    call $clock_now
    local.set $length
    i32.const 1024
    local.get $length
    call $log_write
    drop

    i32.const 2048
    i32.const 2048
    call $environment_summary
    local.set $length
    i32.const 2048
    local.get $length
    call $log_write
    drop

    i32.const 128
    i32.const 12
    i32.const 4096
    i32.const 1024
    call $kv_get
    local.set $length
    i32.const 4096
    local.get $length
    call $log_write
    drop

    i32.const 128
    i32.const 12
    i32.const 256
    i32.const 53
    call $kv_set
    drop

    i32.const 0
  )
)
