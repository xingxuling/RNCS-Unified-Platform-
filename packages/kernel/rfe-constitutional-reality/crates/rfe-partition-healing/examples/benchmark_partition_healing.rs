use rfe_canonical::{parse_json, JsonValue};
use rfe_partition_healing::PartitionHealingCoordinator;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn percentile(sorted: &[f64], fraction: f64) -> f64 {
    let index = ((sorted.len() - 1) as f64 * fraction).round() as usize;
    sorted[index]
}

fn main() {
    const ITERATIONS: usize = 200;
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c11-partition-healing-reality.json"
    ))
    .expect("C11 vector");
    let base = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let mut samples = Vec::with_capacity(ITERATIONS);

    for iteration in 0..ITERATIONS {
        let root = std::env::temp_dir().join(format!("rfe-bench-c11-{base}-{iteration}"));
        let start = Instant::now();
        let mut coordinator = PartitionHealingCoordinator::bootstrap(
            &root,
            required(&vector, "clusters"),
            required(&vector, "quorumWeight").as_u64().expect("quorum"),
            required(&vector, "byzantineBudgetWeight").as_u64().expect("budget"),
            required(&vector, "parentCertificateHash").as_str().expect("parent"),
        )
        .expect("bootstrap");
        coordinator.run_acceptance_scenario(&vector).expect("run C11");
        samples.push(start.elapsed().as_secs_f64() * 1_000.0);
        std::fs::remove_dir_all(root).expect("cleanup");
    }

    samples.sort_by(f64::total_cmp);
    let mean = samples.iter().sum::<f64>() / samples.len() as f64;
    println!(
        "{{\"format\":\"rfe.benchmark.partition-healing-reality.native.v0.9\",\"iterations\":{ITERATIONS},\"meanMilliseconds\":{mean},\"p50Milliseconds\":{},\"p95Milliseconds\":{},\"p99Milliseconds\":{}}}",
        percentile(&samples, 0.50),
        percentile(&samples, 0.95),
        percentile(&samples, 0.99),
    );
}
