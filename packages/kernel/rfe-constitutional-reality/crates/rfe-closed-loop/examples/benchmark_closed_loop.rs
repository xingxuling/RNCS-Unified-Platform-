use rfe_canonical::{parse_json, JsonValue};
use rfe_closed_loop::ClosedLoopStore;
use std::path::PathBuf;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value
        .get(key)
        .unwrap_or_else(|| panic!("missing key: {key}"))
}

fn temporary_root(iteration: usize) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time after epoch")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "rfe-v030-bench-{}-{iteration}-{nanos}",
        std::process::id()
    ))
}

fn main() {
    let iterations = std::env::args()
        .nth(1)
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(50);
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c5-closed-reality-loop.json"
    ))
    .expect("C5 vector");
    let started = Instant::now();
    let mut total_reads = 0_u64;
    let mut total_read_bytes = 0_u64;
    let mut total_writes = 0_u64;
    let mut total_write_bytes = 0_u64;
    for iteration in 0..iterations {
        let root = temporary_root(iteration);
        let mut store =
            ClosedLoopStore::bootstrap(&root, required(&vector, "bootstrap")).expect("bootstrap");
        store.reset_metrics();
        let result = store
            .run_intent("branch:main", required(&vector, "intent"))
            .expect("closed loop");
        assert_eq!(
            required(required(&result, "finalView"), "location").as_str(),
            Some("place:room-b")
        );
        total_reads += store.metrics().object_reads;
        total_read_bytes += store.metrics().object_read_bytes;
        total_writes += store.metrics().object_writes;
        total_write_bytes += store.metrics().object_write_bytes;
        std::fs::remove_dir_all(root).expect("remove benchmark store");
    }
    let elapsed = started.elapsed();
    let elapsed_ns = elapsed.as_nanos();
    let average_ns = elapsed_ns / iterations.max(1) as u128;
    println!(
        "{{\"format\":\"rfe.closed-loop-benchmark.v0.3\",\"iterations\":{iterations},\"elapsedNanoseconds\":{elapsed_ns},\"averageNanosecondsPerLoop\":{average_ns},\"objectReads\":{total_reads},\"objectReadBytes\":{total_read_bytes},\"objectWrites\":{total_writes},\"objectWriteBytes\":{total_write_bytes},\"fullWorldMaterializations\":0}}"
    );
}
