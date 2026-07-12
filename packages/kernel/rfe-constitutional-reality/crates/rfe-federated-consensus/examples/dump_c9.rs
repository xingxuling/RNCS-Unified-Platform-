use rfe_canonical::{parse_json, JsonValue};
use rfe_federated_consensus::FederatedRealityCoordinator;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c9-federated-reality-consensus.json"
    ))
    .expect("C9 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-v070-dump-{nonce}"));
    let mut coordinator = FederatedRealityCoordinator::bootstrap(
        &root,
        required(&vector, "clusters"),
        required(&vector, "quorumWeight")
            .as_u64()
            .expect("quorum weight"),
    )
    .expect("bootstrap");
    let result = coordinator
        .run_acceptance_scenario(
            required(&vector, "noQuorumProposal"),
            required(&vector, "commitProposal"),
        )
        .expect("C9 scenario");
    println!("{}", result.canonical_string());
    std::fs::remove_dir_all(root).ok();
}
