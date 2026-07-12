use rfe_canonical::{parse_json, JsonValue};
use rfe_federated_consensus::FederatedRealityCoordinator;
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
        "../../../conformance/vectors/c9-federated-reality-consensus.json"
    ))
    .expect("C9 vector");
    let started = Instant::now();
    for iteration in 0..iterations {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let root = std::env::temp_dir().join(format!("rfe-v070-bench-{iteration}-{nonce}"));
        let mut coordinator = FederatedRealityCoordinator::bootstrap(
            &root,
            required(&vector, "clusters"),
            required(&vector, "quorumWeight")
                .as_u64()
                .expect("quorum weight"),
        )
        .expect("bootstrap");
        coordinator
            .run_acceptance_scenario(
                required(&vector, "noQuorumProposal"),
                required(&vector, "commitProposal"),
            )
            .expect("C9 scenario");
        std::fs::remove_dir_all(root).expect("cleanup");
    }
    let elapsed = started.elapsed();
    let average_ms = elapsed.as_secs_f64() * 1000.0 / iterations as f64;
    println!(
        "{{\"implementation\":\"rust-native-persistent\",\"iterations\":{iterations},\"averageMilliseconds\":{average_ms:.6}}}"
    );
}
