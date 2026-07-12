package com.taowind.aetherearth;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;

public final class WorldBridge {
    private final Activity activity;
    private final WorldStateEngine engine;

    public WorldBridge(Activity activity) {
        this.activity = activity;
        this.engine = new WorldStateEngine(activity);
    }

    @JavascriptInterface public String getState() { return engine.getStateJson(); }
    @JavascriptInterface public String advance(int days) { return engine.advance(days); }
    @JavascriptInterface public void setTimeScale(int scale) { engine.setTimeScale(scale); }

    @JavascriptInterface public void startBackground() {
        Intent intent = new Intent(activity, WorldSimulationService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) activity.startForegroundService(intent); else activity.startService(intent);
    }

    @JavascriptInterface public void stopBackground() {
        activity.stopService(new Intent(activity, WorldSimulationService.class));
        engine.setBackground(false);
    }

    @JavascriptInterface public void exportSnapshot() {
        activity.runOnUiThread(() -> {
            try {
                File directory = activity.getExternalFilesDir("exports");
                if (directory == null) directory = activity.getFilesDir();
                if (!directory.exists()) directory.mkdirs();
                JSONObjectDay day = JSONObjectDay.from(engine.getState());
                File target = new File(directory, "aether-earth-day-" + day.day + ".json.gz");
                try (FileOutputStream output = new FileOutputStream(target)) { output.write(engine.compressedSnapshot()); }
                Toast.makeText(activity, "压缩现实已导出：" + target.getAbsolutePath(), Toast.LENGTH_LONG).show();
            } catch (Exception error) {
                Toast.makeText(activity, "导出失败：" + error.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private static final class JSONObjectDay {
        final int day;
        private JSONObjectDay(int day) { this.day = day; }
        static JSONObjectDay from(org.json.JSONObject object) { return new JSONObjectDay(object.optInt("day", 0)); }
    }
}
