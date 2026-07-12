(component
  (import "hnaf:capabilities/log@0.3.0" (instance $log
    (export "write" (func (param "message" string)))
  ))
  (import "hnaf:capabilities/clock@0.3.0" (instance $clock
    (export "now-unix-ms" (func (result u64)))
  ))

  (core module $libc
    (memory (export "memory") 1)
    (data (i32.const 0) "HNAC v0.3 Component Model host online")
  )
  (core instance $libc-i (instantiate $libc))

  (core func $log-write
    (canon lower (func $log "write") (memory $libc-i "memory"))
  )
  (core func $clock-now
    (canon lower (func $clock "now-unix-ms"))
  )

  (core module $main
    (import "libc" "memory" (memory 1))
    (import "hnaf-log" "write" (func $write (param i32 i32)))
    (import "hnaf-clock" "now-unix-ms" (func $now (result i64)))
    (func (export "run") (result i64)
      i32.const 0
      i32.const 37
      call $write
      call $now
    )
  )

  (core instance $main-i
    (instantiate $main
      (with "libc" (instance $libc-i))
      (with "hnaf-log" (instance (export "write" (func $log-write))))
      (with "hnaf-clock" (instance (export "now-unix-ms" (func $clock-now))))
    )
  )

  (func (export "run") (result u64)
    (canon lift (core func $main-i "run"))
  )
)
