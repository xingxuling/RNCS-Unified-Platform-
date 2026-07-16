package com.taowind.aetherearth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class FoundationProviderBridgeTest {
    @Test
    public void rclPhysicalRuleChangesWorldBiomass() {
        FoundationProviderBridge.Policy baseline = FoundationProviderBridge.parseWorldPolicy(source("0.004"));
        FoundationProviderBridge.Policy changed = FoundationProviderBridge.parseWorldPolicy(source("0.2"));

        assertEquals(0.504, baseline.regrowBiomass(0.5), 0.000001);
        assertEquals(0.7, changed.regrowBiomass(0.5), 0.000001);
        assertNotEquals(baseline.sourceRoot, changed.sourceRoot);
    }

    @Test
    public void authorityBoundaryRejectsUnboundedAdvanceDeterministically() {
        FoundationProviderBridge bridge = new FoundationProviderBridge(path -> source("0.004"));
        FoundationProviderBridge.AdvanceDecision first = bridge.evaluateAdvance(10001);
        FoundationProviderBridge.AdvanceDecision second = bridge.evaluateAdvance(10001);

        assertFalse(first.accepted);
        assertEquals(0, first.effectiveDays);
        assertEquals(first.replayRoot, second.replayRoot);
        assertTrue(first.toStandardRuntimeResultJson().contains("world.advance.unbounded"));
        assertTrue(first.toStandardRuntimeResultJson().contains("rcl-source:"));
    }

    @Test
    public void incompatibleFoundationManifestIsRejected() {
        assertThrows(
            IllegalArgumentException.class,
            () -> FoundationProviderBridge.parseWorldPolicy(source("0.004").replace(FoundationProviderBridge.CONTRACT_ROOT, "wrong-root"))
        );
    }

    private static String source(String regrowth) {
        return "reality AetherEarthWorldFoundation {\n" +
            "  facet foundation.contract_root : Text = \"" + FoundationProviderBridge.CONTRACT_ROOT + "\"\n" +
            "  facet world.grid_width : Number = 16\n" +
            "  facet world.grid_height : Number = 16\n" +
            "  facet world.scientific_evidence_required : Truth = true\n" +
            "  facet physical.biomass_regrowth_per_day : Number = " + regrowth + "\n" +
            "  facet energy.agent_daily_cost : Number = 0.7\n" +
            "  facet energy.forage_gain_multiplier : Number = 10\n" +
            "  facet authority.max_advance_days : Number = 10000\n" +
            "  facet aif.biomass_min : Number = 0\n" +
            "  facet aif.biomass_max : Number = 1\n" +
            "}\n";
    }
}
