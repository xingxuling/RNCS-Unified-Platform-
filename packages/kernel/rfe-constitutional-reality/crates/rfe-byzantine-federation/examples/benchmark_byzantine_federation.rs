use rfe_byzantine_federation::ByzantineRealityCoordinator;
use rfe_canonical::{parse_json, JsonValue};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let iterations: u64 = std::env::args()
        .nth(1)
        .and_then(|value| value.parse().ok())
        .unwrap_or(100);
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c10-byzantine-federated-reality.json"
    ))
    .expect("C10 vector");
    let started = Instant::now();
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let mut last_hash = String::new();
    for index in 0..iterations {
        let root = std::env::temp_dir().join(format!("rfe-v080-bench-{nonce}-{index}"));
        let mut coordinator = ByzantineRealityCoordinator::bootstrap(
            &root,
            required(&vector, "clusters"),
            required(&vector, "quorumWeight").as_u64().expect("quorum"),
            required(&vector, "byzantineBudgetWeight")
                .as_u64()
                .expect("budget"),
            required(&vector, "parentCertificateHash")
                .as_str()
                .expect("parent"),
        )
        .expect("bootstrap");
        let result = coordinator
            .run_acceptance_scenario(
                required(&vector, "mainProposal"),
                required(&vector, "forkProposal"),
            )
            .expect("scenario");
        required(&result, "byzantineFederatedRealityResultHash")
            .as_str()
            .expect("hash")
            .clone_into(&mut last_hash);
        std::fs::remove_dir_all(root).ok();
    }
    let elapsed = started.elapsed().as_secs_f64() * 1000.0;
    println!("{{\"runtime\":\"rust-native-persistent\",\"version\":\"0.8.0\",\"iterations\":{iterations},\"totalMs\":{elapsed:.6},\"averageMs\":{:.6},\"resultHash\":\"{}\"}}", elapsed / iterations as f64, last_hash);
}
