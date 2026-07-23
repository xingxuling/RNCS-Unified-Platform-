plugins {
    id("com.android.application")
}

android {
    namespace = "com.taowind.aetherearth"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.taowind.aetherearth"
        minSdk = 26
        targetSdk = 35
        versionCode = 100
        versionName = "0.1.0-alpha.1"
    }

    buildTypes {
        debug { isMinifyEnabled = false }
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
