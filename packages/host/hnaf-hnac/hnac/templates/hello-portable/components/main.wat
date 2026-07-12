(module
  (import "hnaf" "log_write" (func $log_write (param i32 i32) (result i32)))
  (import "hnaf" "clock_now" (func $clock_now (param i32 i32) (result i32)))
  (memory (export "memory") 1 2)
  (data (i32.const 0) "HNAC v0.4 portable host execution")
  (func (export "run") (result i32)
    (local $length i32)
    i32.const 0
    i32.const 33
    call $log_write
    drop
    i32.const 512
    i32.const 128
    call $clock_now
    local.set $length
    i32.const 512
    local.get $length
    call $log_write
    drop
    i32.const 0
  )
)
