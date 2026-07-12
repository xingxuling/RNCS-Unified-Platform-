package com.taowind.aetherearth;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

public final class WorldSimulationService extends Service {
    private static final String CHANNEL_ID = "aether-earth-world";
    private static final int NOTIFICATION_ID = 1602;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WorldStateEngine engine;
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (engine != null) {
                engine.advance(engine.getTimeScale());
                updateNotification();
                handler.postDelayed(this, 15000L);
            }
        }
    };

    @Override public void onCreate() {
        super.onCreate();
        engine = new WorldStateEngine(this);
        engine.setBackground(true);
        createChannel();
        startForeground(NOTIFICATION_ID, notification());
        handler.post(tick);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) { return START_STICKY; }
    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onDestroy() {
        handler.removeCallbacks(tick);
        if (engine != null) engine.setBackground(false);
        super.onDestroy();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Aether Earth 持续世界", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("让模拟地球和 100 个 AI 生物在后台低频演化");
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private Notification notification() {
        int day = engine.getState().optInt("day", 0);
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        return builder.setSmallIcon(com.taowind.aetherearth.R.drawable.ic_launcher)
            .setContentTitle("Aether Earth 正在演化")
            .setContentText("Day " + day + " · 100 个 RCL 生物 · " + engine.getTimeScale() + "×")
            .setContentIntent(pending)
            .setOngoing(true)
            .build();
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, notification());
    }
}
