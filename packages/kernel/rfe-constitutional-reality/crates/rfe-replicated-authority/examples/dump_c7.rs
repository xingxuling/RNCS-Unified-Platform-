use rfe_canonical::{parse_json, JsonValue};
use rfe_replicated_authority::ReplicatedAuthorityCluster;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c7-replicated-authority.json"
    ))
    .expect("C7 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-v050-dump-{nonce}"));
    let cluster = ReplicatedAuthorityCluster::bootstrap(
        &root,
        required(&vector, "bootstrap"),
        required(&vector, "session"),
        required(&vector, "cluster"),
    )
    .expect("bootstrap");
    let result = cluster.run_acceptance_scenario().expect("C7 scenario");
    println!("{}", result.canonical_string());
    std::fs::remove_dir_all(root).ok();
}
