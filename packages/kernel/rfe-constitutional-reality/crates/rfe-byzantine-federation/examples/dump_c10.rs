use rfe_byzantine_federation::ByzantineRealityCoordinator;
use rfe_canonical::{parse_json, JsonValue};
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c10-byzantine-federated-reality.json"
    ))
    .expect("C10 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-v080-dump-{nonce}"));
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
        .expect("C10 scenario");
    println!("{}", result.canonical_string());
    std::fs::remove_dir_all(root).ok();
}
