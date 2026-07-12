use rfe_canonical::{parse_json, JsonValue};
use rfe_partition_healing::PartitionHealingCoordinator;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c11-partition-healing-reality.json"
    ))
    .expect("C11 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-dump-c11-{nonce}"));
    let mut coordinator = PartitionHealingCoordinator::bootstrap(
        &root,
        required(&vector, "clusters"),
        required(&vector, "quorumWeight").as_u64().expect("quorum"),
        required(&vector, "byzantineBudgetWeight").as_u64().expect("budget"),
        required(&vector, "parentCertificateHash").as_str().expect("parent"),
    )
    .expect("bootstrap");
    let result = coordinator.run_acceptance_scenario(&vector).expect("run C11");
    println!("{}", result.canonical_string());
    std::fs::remove_dir_all(root).expect("cleanup");
}
