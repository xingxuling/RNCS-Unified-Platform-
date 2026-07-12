use rfe_canonical::{parse_json, JsonValue};
use rfe_replicated_authority::ReplicatedAuthorityCluster;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let iterations = std::env::args()
        .nth(1)
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(20);
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c7-replicated-authority.json"
    ))
    .expect("C7 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-v050-bench-{nonce}"));
    let started = Instant::now();
    for iteration in 0..iterations {
        let run_root = root.join(iteration.to_string());
        let cluster = ReplicatedAuthorityCluster::bootstrap(
            &run_root,
            required(&vector, "bootstrap"),
            required(&vector, "session"),
            required(&vector, "cluster"),
        )
        .expect("bootstrap");
        cluster.run_acceptance_scenario().expect("C7 scenario");
    }
    let elapsed = started.elapsed();
    let total_nanos = u64::try_from(elapsed.as_nanos()).unwrap_or(u64::MAX);
    let average = total_nanos / iterations.max(1);
    println!(
        "{{\"format\":\"rfe.benchmark.replicated-authority.v0.5\",\"iterations\":{iterations},\"totalNanos\":{total_nanos},\"averageNanosPerScenario\":{average}}}"
    );
    std::fs::remove_dir_all(root).ok();
}
