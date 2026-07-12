# Aether Earth Android v0.1

A dependency-light Android host for the Aether Earth sandbox.

## Features

- offline WebView cockpit bundled as app assets;
- 16×16 world and 100 persistent organisms in a native Java state engine;
- gzip-compressed SharedPreferences world capsule;
- foreground service for user-visible continuous simulation;
- JobScheduler catch-up for periodic background evolution;
- 1× / 10× / 100× time scale;
- compressed snapshot export;
- bundled RCL source and precompiled RBC foundation assets.

## Build requirement

Android Studio or an Android SDK with platform 35, build-tools 35 and Gradle/AGP 8.7.3. The ChatGPT execution container used for this release did not contain an Android SDK or Gradle distribution, so the source was statically validated but an APK was not fabricated.
