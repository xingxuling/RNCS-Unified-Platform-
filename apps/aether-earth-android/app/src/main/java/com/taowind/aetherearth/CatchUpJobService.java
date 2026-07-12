package com.taowind.aetherearth;

import android.app.job.JobParameters;
import android.app.job.JobService;

public final class CatchUpJobService extends JobService {
    @Override public boolean onStartJob(JobParameters params) {
        Thread worker = new Thread(() -> {
            try { new WorldStateEngine(this).catchUpFromWallClock(); }
            finally { jobFinished(params, false); }
        }, "aether-earth-catch-up");
        worker.start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters params) { return true; }
}
