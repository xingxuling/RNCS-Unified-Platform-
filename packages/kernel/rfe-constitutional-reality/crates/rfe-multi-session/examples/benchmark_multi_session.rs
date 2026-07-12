use rfe_canonical::{parse_json, JsonValue};
use rfe_multi_session::{PersistentMultiSession, SessionCrashPoint};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value
        .get(key)
        .unwrap_or_else(|| panic!("missing key: {key}"))
}

fn main() {
    let iterations = std::env::args()
        .nth(1)
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(50);
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c6-multi-subject-session.json"
    ))
    .expect("C6 vector");
    let started = Instant::now();
    for index in 0..iterations {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time after epoch")
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "rfe-v040-bench-{}-{nonce}-{index}",
            std::process::id()
        ));
        let mut runtime = PersistentMultiSession::bootstrap(
            &root,
            required(&vector, "bootstrap"),
            required(&vector, "session"),
        )
        .expect("bootstrap");
        runtime
            .run_session(required(&vector, "session"), SessionCrashPoint::None)
            .expect("session");
        std::fs::remove_dir_all(root).expect("cleanup");
    }
    let elapsed = started.elapsed().as_nanos();
    println!(
        "{{\"format\":\"rfe.benchmark.multi-session.v0.4\",\"iterations\":{iterations},\"elapsedNs\":{elapsed},\"averageNs\":{}}}",
        elapsed / u128::from(iterations)
    );
}
