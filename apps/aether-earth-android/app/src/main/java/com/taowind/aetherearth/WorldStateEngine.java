package com.taowind.aetherearth;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public final class WorldStateEngine {
    private static final String PREFS = "aether_earth_state";
    private static final String KEY_CAPSULE = "capsule";
    private static final String KEY_LAST_WALL = "last_wall";
    private static final String[] CLIMATES = {"oceanic", "temperate", "arid", "tundra"};
    private static final String[] ARCHETYPES = {"Forager", "Scholar", "Cooperator", "Explorer"};
    private final SharedPreferences preferences;

    public WorldStateEngine(Context context) {
        preferences = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!preferences.contains(KEY_CAPSULE)) save(createInitialState());
    }

    public synchronized String getStateJson() {
        return load().toString();
    }

    public synchronized JSONObject getState() {
        return load();
    }

    public synchronized int getTimeScale() {
        return load().optInt("timeScale", 1);
    }

    public synchronized void setTimeScale(int scale) {
        if (scale != 1 && scale != 10 && scale != 100) return;
        JSONObject state = load();
        try { state.put("timeScale", scale); } catch (Exception ignored) { }
        save(state);
    }

    public synchronized void setBackground(boolean enabled) {
        JSONObject state = load();
        try { state.put("background", enabled); } catch (Exception ignored) { }
        save(state);
    }

    public synchronized String advance(int days) {
        int safeDays = Math.max(0, Math.min(days, 10000));
        JSONObject state = load();
        try {
            long randomState = Integer.toUnsignedLong(state.optInt("randomState", 20260704));
            JSONArray tiles = state.getJSONArray("tiles");
            JSONArray agents = state.getJSONArray("agents");
            JSONArray crystals = state.getJSONArray("crystals");
            int day = state.optInt("day", 0);
            int knowledge = state.optInt("knowledge", 512);
            for (int step = 0; step < safeDays; step++) {
                day += 1;
                for (int t = 0; t < tiles.length(); t++) {
                    JSONObject tile = tiles.getJSONObject(t);
                    tile.put("b", Math.min(1.0, tile.optDouble("b", 0.5) + 0.004));
                }
                for (int i = 0; i < agents.length(); i++) {
                    JSONObject agent = agents.getJSONObject(i);
                    int x = agent.optInt("x");
                    int y = agent.optInt("y");
                    JSONObject tile = tiles.getJSONObject(y * 16 + x);
                    double energy = agent.optDouble("e", 60) - 0.7;
                    randomState = nextRandom(randomState);
                    double random = toUnit(randomState);
                    String action;
                    if (energy < 48 && tile.optDouble("b", 0.2) > 0.04) {
                        action = "forage";
                        double gain = Math.min(7, tile.optDouble("b") * 10);
                        energy = Math.min(100, energy + gain);
                        tile.put("b", Math.max(0, tile.optDouble("b") - gain / 45.0));
                        randomState = nextRandom(randomState);
                        if (toUnit(randomState) < 0.07) {
                            agent.put("k", agent.optInt("k", 0) + 1);
                            knowledge += 1;
                        }
                    } else if (random < 0.18) {
                        action = "move";
                        randomState = nextRandom(randomState);
                        int dx = (int) (toUnit(randomState) * 3) - 1;
                        randomState = nextRandom(randomState);
                        int dy = (int) (toUnit(randomState) * 3) - 1;
                        agent.put("x", mod(x + dx, 16));
                        agent.put("y", mod(y + dy, 16));
                    } else if (random < 0.25) {
                        action = "experiment";
                        agent.put("k", agent.optInt("k", 0) + 1);
                        knowledge += 1;
                    } else {
                        action = "rest";
                        energy = Math.min(100, energy + 0.35);
                    }
                    if (energy <= 0) {
                        agent.put("g", agent.optInt("g", 1) + 1);
                        randomState = nextRandom(randomState);
                        energy = 70 + toUnit(randomState) * 20;
                        agent.put("k", Math.max(0, agent.optInt("k", 0) - 2));
                    }
                    agent.put("e", round(energy));
                    agent.put("action", action);
                }
                if (day % 60 == 0) {
                    JSONObject crystal = new JSONObject();
                    crystal.put("id", "crystal-" + (crystals.length() + 1));
                    crystal.put("strategy", "prefer_temperate_biomass");
                    crystal.put("confidence", Math.min(0.99, 0.68 + day / 10000.0));
                    crystal.put("support", 24 + (int) (toUnit(randomState) * 60));
                    crystal.put("promoted", true);
                    crystal.put("source", crystalSource(crystals.length() + 1, day));
                    crystals.put(crystal);
                }
            }
            state.put("day", day);
            state.put("knowledge", knowledge);
            state.put("randomState", (int) randomState);
            state.put("realityRoot", sha256(state.toString()));
            save(state);
        } catch (Exception error) {
            throw new IllegalStateException("Unable to advance Aether Earth", error);
        }
        return state.toString();
    }

    public synchronized int catchUpFromWallClock() {
        long now = System.currentTimeMillis();
        long previous = preferences.getLong(KEY_LAST_WALL, now);
        preferences.edit().putLong(KEY_LAST_WALL, now).apply();
        long minutes = Math.max(0, (now - previous) / 60000L);
        int days = (int) Math.min(720, minutes * Math.max(1, getTimeScale()) / 15L);
        if (days > 0) advance(days);
        return days;
    }

    public synchronized byte[] compressedSnapshot() {
        return gzip(load().toString());
    }

    private JSONObject createInitialState() {
        try {
            JSONObject state = new JSONObject();
            state.put("format", "aether-earth.mobile-state.v0.1");
            state.put("day", 0);
            state.put("timeScale", 1);
            state.put("knowledge", 512);
            state.put("background", false);
            state.put("randomState", 20260704);
            JSONArray tiles = new JSONArray();
            long randomState = 20260704;
            for (int y = 0; y < 16; y++) {
                double latitude = Math.abs(y / 15.0 * 2 - 1);
                for (int x = 0; x < 16; x++) {
                    randomState = nextRandom(randomState);
                    double r = toUnit(randomState);
                    String climate = latitude > 0.78 ? "tundra" : r < 0.24 ? "arid" : r > 0.75 ? "oceanic" : "temperate";
                    JSONObject tile = new JSONObject();
                    tile.put("x", x); tile.put("y", y); tile.put("c", climate);
                    randomState = nextRandom(randomState);
                    tile.put("b", round(0.2 + toUnit(randomState) * 0.7));
                    tiles.put(tile);
                }
            }
            JSONArray agents = new JSONArray();
            for (int i = 0; i < 100; i++) {
                JSONObject agent = new JSONObject();
                agent.put("id", String.format(Locale.US, "life:%03d", i + 1));
                randomState = nextRandom(randomState); agent.put("x", (int) (toUnit(randomState) * 16));
                randomState = nextRandom(randomState); agent.put("y", (int) (toUnit(randomState) * 16));
                randomState = nextRandom(randomState); agent.put("e", round(55 + toUnit(randomState) * 40));
                agent.put("k", 0); agent.put("g", 1); agent.put("a", ARCHETYPES[i % 4]); agent.put("action", "rest");
                agents.put(agent);
            }
            state.put("tiles", tiles);
            state.put("agents", agents);
            state.put("crystals", new JSONArray());
            state.put("randomState", (int) randomState);
            state.put("realityRoot", sha256(state.toString()));
            return state;
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private JSONObject load() {
        String capsule = preferences.getString(KEY_CAPSULE, null);
        if (capsule == null) return createInitialState();
        try {
            byte[] compressed = Base64.decode(capsule, Base64.NO_WRAP);
            return new JSONObject(ungzip(compressed));
        } catch (Exception error) {
            JSONObject reset = createInitialState();
            save(reset);
            return reset;
        }
    }

    private void save(JSONObject state) {
        String capsule = Base64.encodeToString(gzip(state.toString()), Base64.NO_WRAP);
        preferences.edit().putString(KEY_CAPSULE, capsule).putLong(KEY_LAST_WALL, System.currentTimeMillis()).apply();
    }

    private static byte[] gzip(String text) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (GZIPOutputStream gzip = new GZIPOutputStream(output)) {
                gzip.write(text.getBytes(StandardCharsets.UTF_8));
            }
            return output.toByteArray();
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private static String ungzip(byte[] bytes) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (GZIPInputStream input = new GZIPInputStream(new ByteArrayInputStream(bytes))) {
                byte[] buffer = new byte[4096];
                int read;
                while ((read = input.read(buffer)) >= 0) output.write(buffer, 0, read);
            }
            return output.toString(StandardCharsets.UTF_8.name());
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private static long nextRandom(long value) {
        int x = (int) value;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        return Integer.toUnsignedLong(x);
    }

    private static double toUnit(long value) { return value / 4294967296.0; }
    private static int mod(int value, int base) { int result = value % base; return result < 0 ? result + base : result; }
    private static double round(double value) { return Math.round(value * 1000.0) / 1000.0; }

    private static String crystalSource(int epoch, int day) {
        return "reality MobileCollectiveCrystal_" + epoch + " {\n" +
            "  facet crystal.id : Text = \"mobile-crystal-" + epoch + "\"\n" +
            "  facet crystal.strategy : Text = \"prefer_temperate_biomass\"\n" +
            "  facet crystal.support : Number = " + (24 + epoch) + "\n" +
            "  facet crystal.day : Number = " + day + "\n" +
            "  facet crystal.candidate : Truth = true\n" +
            "}\n";
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : digest) builder.append(String.format(Locale.US, "%02x", b));
            return builder.toString();
        } catch (Exception error) { return "unavailable"; }
    }
}
