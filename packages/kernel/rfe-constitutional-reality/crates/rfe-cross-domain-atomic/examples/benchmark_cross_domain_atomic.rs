use rfe_canonical::{parse_json, JsonValue};
use rfe_cross_domain_atomic::AtomicRealityCoordinator;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let iterations = std::env::args()
        .nth(1)
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(100);
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c8-cross-domain-atomic.json"
    ))
    .expect("C8 vector");
    let started = Instant::now();
    for iteration in 0..iterations {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let root = std::env::temp_dir().join(format!("rfe-v060-bench-{iteration}-{nonce}"));
        let coordinator =
            AtomicRealityCoordinator::bootstrap(&root, required(&vector, "participants"))
                .expect("bootstrap");
        coordinator
            .run_acceptance_scenario(
                required(&vector, "abortTransaction"),
                required(&vector, "commitTransaction"),
            )
            .expect("scenario");
        std::fs::remove_dir_all(root).expect("cleanup");
    }
    let elapsed = started.elapsed();
    println!(
        "{{\"iterations\":{iterations},\"totalMilliseconds\":{},\"averageMilliseconds\":{}}}",
        elapsed.as_secs_f64() * 1000.0,
        elapsed.as_secs_f64() * 1000.0 / iterations as f64
    );
}
