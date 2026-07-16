package com.taowind.aetherearth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Android provider boundary for the canonical RCL Foundation Contract.
 *
 * This is intentionally a bridge, not a claim that the Android host embeds the
 * native RCL VM. It evaluates the small, typed facet subset used by the mobile
 * world policy and rejects assets bound to another Foundation manifest root.
 */
public final class FoundationProviderBridge {
    public static final String MODE = "bridge";
    public static final String CONTRACT_VERSION = "0.1.0";
    public static final String CONTRACT_ROOT = "34e508fe3b6587e630cc32a075edbad87323c7359434b2a2aaf01cf7e250f7e1";
    public static final String WORLD_POLICY_ASSET = "rcl/world-foundation.rcl";

    private static final Pattern FACET = Pattern.compile(
        "^\\s*facet\\s+([A-Za-z0-9_.-]+)\\s*:\\s*(Text|Number|Truth)\\s*=\\s*(.*?)\\s*$"
    );

    public interface SourceLoader {
        String read(String assetPath) throws IOException;
    }

    private final Policy policy;

    public FoundationProviderBridge(SourceLoader sourceLoader) {
        try {
            this.policy = parseWorldPolicy(sourceLoader.read(WORLD_POLICY_ASSET));
        } catch (IOException error) {
            throw new IllegalStateException("RCL_FOUNDATION_POLICY_UNAVAILABLE", error);
        }
    }

    public Policy policy() {
        return policy;
    }

    public AdvanceDecision evaluateAdvance(int requestedDays) {
        boolean accepted = requestedDays >= 0 && requestedDays <= policy.maxAdvanceDays;
        int effectiveDays = accepted ? requestedDays : 0;
        String authorityDecision = accepted ? "local-world-simulation-capability" : "world.advance.unbounded-required";
        String replayRoot = sha256(policy.sourceRoot + ":" + requestedDays + ":" + effectiveDays + ":" + accepted);
        return new AdvanceDecision(policy, requestedDays, effectiveDays, accepted, authorityDecision, replayRoot);
    }

    public static Policy parseWorldPolicy(String source) {
        if (source == null || source.trim().isEmpty()) {
            throw new IllegalArgumentException("RCL_FOUNDATION_POLICY_EMPTY");
        }
        Map<String, String> values = new LinkedHashMap<>();
        String[] lines = source.replace("\r\n", "\n").split("\n");
        for (String line : lines) {
            Matcher matcher = FACET.matcher(line);
            if (!matcher.matches()) continue;
            String type = matcher.group(2);
            String rawValue = matcher.group(3).trim();
            values.put(matcher.group(1), decode(type, rawValue));
        }

        String contractRoot = required(values, "foundation.contract_root");
        if (!CONTRACT_ROOT.equals(contractRoot)) {
            throw new IllegalArgumentException("RCL_FOUNDATION_CONTRACT_ROOT_MISMATCH");
        }
        int width = positiveInt(values, "world.grid_width");
        int height = positiveInt(values, "world.grid_height");
        int maxAdvanceDays = positiveInt(values, "authority.max_advance_days");
        double biomassRegrowth = nonNegative(values, "physical.biomass_regrowth_per_day");
        double dailyEnergyCost = nonNegative(values, "energy.agent_daily_cost");
        double forageGainMultiplier = nonNegative(values, "energy.forage_gain_multiplier");
        double minBiomass = number(values, "aif.biomass_min");
        double maxBiomass = number(values, "aif.biomass_max");
        if (maxBiomass < minBiomass) throw new IllegalArgumentException("RCL_FOUNDATION_AIF_RANGE_INVALID");

        return new Policy(
            contractRoot,
            sha256(source.replace("\r\n", "\n")),
            width,
            height,
            maxAdvanceDays,
            biomassRegrowth,
            dailyEnergyCost,
            forageGainMultiplier,
            minBiomass,
            maxBiomass,
            truth(values, "world.scientific_evidence_required")
        );
    }

    private static String decode(String type, String rawValue) {
        if ("Text".equals(type)) {
            if (rawValue.length() < 2 || rawValue.charAt(0) != '"' || rawValue.charAt(rawValue.length() - 1) != '"') {
                throw new IllegalArgumentException("RCL_FOUNDATION_TEXT_LITERAL_INVALID");
            }
            return rawValue.substring(1, rawValue.length() - 1)
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
        }
        return rawValue;
    }

    private static String required(Map<String, String> values, String key) {
        String value = values.get(key);
        if (value == null || value.isEmpty()) throw new IllegalArgumentException("RCL_FOUNDATION_FACET_REQUIRED:" + key);
        return value;
    }

    private static double number(Map<String, String> values, String key) {
        try {
            double value = Double.parseDouble(required(values, key));
            if (!Double.isFinite(value)) throw new NumberFormatException();
            return value;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("RCL_FOUNDATION_NUMBER_INVALID:" + key, error);
        }
    }

    private static double nonNegative(Map<String, String> values, String key) {
        double value = number(values, key);
        if (value < 0) throw new IllegalArgumentException("RCL_FOUNDATION_NUMBER_NEGATIVE:" + key);
        return value;
    }

    private static int positiveInt(Map<String, String> values, String key) {
        double value = number(values, key);
        if (value <= 0 || value != Math.rint(value) || value > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("RCL_FOUNDATION_INTEGER_INVALID:" + key);
        }
        return (int) value;
    }

    private static boolean truth(Map<String, String> values, String key) {
        String value = required(values, key);
        if ("true".equals(value)) return true;
        if ("false".equals(value)) return false;
        throw new IllegalArgumentException("RCL_FOUNDATION_TRUTH_INVALID:" + key);
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : digest) builder.append(String.format(Locale.US, "%02x", item));
            return builder.toString();
        } catch (Exception error) {
            throw new IllegalStateException("RCL_FOUNDATION_HASH_UNAVAILABLE", error);
        }
    }

    private static String json(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    public static final class Policy {
        public final String contractRoot;
        public final String sourceRoot;
        public final int gridWidth;
        public final int gridHeight;
        public final int maxAdvanceDays;
        public final double biomassRegrowthPerDay;
        public final double dailyEnergyCost;
        public final double forageGainMultiplier;
        public final double minBiomass;
        public final double maxBiomass;
        public final boolean scientificEvidenceRequired;

        private Policy(
            String contractRoot,
            String sourceRoot,
            int gridWidth,
            int gridHeight,
            int maxAdvanceDays,
            double biomassRegrowthPerDay,
            double dailyEnergyCost,
            double forageGainMultiplier,
            double minBiomass,
            double maxBiomass,
            boolean scientificEvidenceRequired
        ) {
            this.contractRoot = contractRoot;
            this.sourceRoot = sourceRoot;
            this.gridWidth = gridWidth;
            this.gridHeight = gridHeight;
            this.maxAdvanceDays = maxAdvanceDays;
            this.biomassRegrowthPerDay = biomassRegrowthPerDay;
            this.dailyEnergyCost = dailyEnergyCost;
            this.forageGainMultiplier = forageGainMultiplier;
            this.minBiomass = minBiomass;
            this.maxBiomass = maxBiomass;
            this.scientificEvidenceRequired = scientificEvidenceRequired;
        }

        public double regrowBiomass(double current) {
            return clamp(current + biomassRegrowthPerDay, minBiomass, maxBiomass);
        }

        public double consumeBiomass(double current, double amount) {
            return clamp(current - amount, minBiomass, maxBiomass);
        }

        private static double clamp(double value, double minimum, double maximum) {
            return Math.max(minimum, Math.min(maximum, value));
        }
    }

    public static final class AdvanceDecision {
        public final Policy policy;
        public final int requestedDays;
        public final int effectiveDays;
        public final boolean accepted;
        public final String authorityDecision;
        public final String replayRoot;

        private AdvanceDecision(
            Policy policy,
            int requestedDays,
            int effectiveDays,
            boolean accepted,
            String authorityDecision,
            String replayRoot
        ) {
            this.policy = policy;
            this.requestedDays = requestedDays;
            this.effectiveDays = effectiveDays;
            this.accepted = accepted;
            this.authorityDecision = authorityDecision;
            this.replayRoot = replayRoot;
        }

        public String toStandardRuntimeResultJson() {
            String authority = accepted ? "[]" : "[\"world.advance.unbounded\"]";
            return "{" +
                "\"format\":\"taowind.rcl-foundation-runtime-result.v0.1\"," +
                "\"domain\":\"physical\"," +
                "\"proposal\":{\"operation\":\"advance-world\",\"requestedDays\":" + requestedDays + ",\"effectiveDays\":" + effectiveDays + "}," +
                "\"constraints\":[\"authority.max_advance_days\",\"aif.biomass_range\"]," +
                "\"stateDelta\":{\"accepted\":" + accepted + "}," +
                "\"evidence\":[" + json("rcl-source:" + policy.sourceRoot) + "," + json("foundation-contract:" + policy.contractRoot) + "]," +
                "\"confidence\":1.0," +
                "\"authorityRequired\":" + authority + "," +
                "\"replayMetadata\":{\"mode\":\"bridge\",\"root\":" + json(replayRoot) + "}," +
                "\"fourR\":{\"explicitVariables\":[\"requestedDays\"],\"providerCapabilities\":[\"android.world.advance\"],\"irreversibility\":\"append-only-world-time\",\"authorizationRecord\":" + json(authorityDecision) + ",\"activeInvariants\":[\"biomass-range\"],\"aifStable\":" + accepted + "}" +
                "}";
        }
    }
}
