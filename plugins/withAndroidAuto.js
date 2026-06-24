/**
 * Expo config plugin: adds a real, dependency-free Android Auto media
 * integration (custom MediaBrowserServiceCompat) to the generated
 * Android project.
 *
 * What it does on every `expo prebuild`:
 *  1. Copies the native Kotlin sources from
 *     plugins/android-auto/native/*.kt into
 *     android/app/src/main/java/<package>/androidauto/
 *  2. Copies plugins/android-auto/automotive_app_desc.xml into
 *     android/app/src/main/res/xml/automotive_app_desc.xml
 *  3. Edits AndroidManifest.xml to declare the service, the media
 *     button receiver, the automotive app metadata, and the required
 *     permissions.
 *  4. Adds the `androidx.media:media` dependency to app/build.gradle
 *     (the only library this feature depends on).
 *  5. Registers AndroidAutoCatalogPackage in MainApplication so the
 *     `AndroidAutoCatalog` native module is available from JS.
 *
 * No third-party audio/track-player library is used anywhere here.
 */
const { withAndroidManifest, withDangerousMod, withAppBuildGradle, withMainApplication, createRunOncePlugin } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SERVICE_RELATIVE_NAME = ".androidauto.MediaPlaybackService";
const MEDIA_BUTTON_RECEIVER = "androidx.media.session.MediaButtonReceiver";
const AUTOMOTIVE_META_DATA_NAME = "com.google.android.gms.car.application";
const REQUIRED_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.WAKE_LOCK"
];

function ensurePermission(androidManifest, permissionName) {
  const manifest = androidManifest.manifest;
  if (!manifest["uses-permission"]) {
    manifest["uses-permission"] = [];
  }

  const exists = manifest["uses-permission"].some(
    (entry) => entry.$ && entry.$["android:name"] === permissionName
  );

  if (!exists) {
    manifest["uses-permission"].push({ $: { "android:name": permissionName } });
  }
}

function withAndroidAutoManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    REQUIRED_PERMISSIONS.forEach((permission) => ensurePermission(androidManifest, permission));

    if (!application.service) application.service = [];
    if (!application.receiver) application.receiver = [];
    if (!application["meta-data"]) application["meta-data"] = [];

    const hasService = application.service.some(
      (entry) => entry.$ && entry.$["android:name"] === SERVICE_RELATIVE_NAME
    );
    if (!hasService) {
      application.service.push({
        $: {
          "android:name": SERVICE_RELATIVE_NAME,
          "android:exported": "true",
          "android:foregroundServiceType": "mediaPlayback"
        },
        "intent-filter": [
          { action: [{ $: { "android:name": "android.media.browse.MediaBrowserService" } }] },
          { action: [{ $: { "android:name": "android.intent.action.MEDIA_BUTTON" } }] }
        ]
      });
    }

    const hasReceiver = application.receiver.some(
      (entry) => entry.$ && entry.$["android:name"] === MEDIA_BUTTON_RECEIVER
    );
    if (!hasReceiver) {
      application.receiver.push({
        $: {
          "android:name": MEDIA_BUTTON_RECEIVER,
          "android:exported": "true"
        },
        "intent-filter": [
          { action: [{ $: { "android:name": "android.intent.action.MEDIA_BUTTON" } }] }
        ]
      });
    }

    const hasAutomotiveMeta = application["meta-data"].some(
      (entry) => entry.$ && entry.$["android:name"] === AUTOMOTIVE_META_DATA_NAME
    );
    if (!hasAutomotiveMeta) {
      application["meta-data"].push({
        $: {
          "android:name": AUTOMOTIVE_META_DATA_NAME,
          "android:resource": "@xml/automotive_app_desc"
        }
      });
    }

    return config;
  });
}

function withAndroidAutoNativeFiles(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const androidPackage = config.android && config.android.package;

      if (!androidPackage) {
        throw new Error(
          "withAndroidAuto: `expo.android.package` must be set in app.json before this plugin can run."
        );
      }

      const packagePath = androidPackage.split(".").join(path.sep);
      const javaTargetDir = path.join(platformRoot, "app/src/main/java", packagePath, "androidauto");
      const resXmlDir = path.join(platformRoot, "app/src/main/res/xml");

      fs.mkdirSync(javaTargetDir, { recursive: true });
      fs.mkdirSync(resXmlDir, { recursive: true });

      const nativeSourceDir = path.join(projectRoot, "plugins/android-auto/native");
      for (const fileName of fs.readdirSync(nativeSourceDir)) {
        if (!fileName.endsWith(".kt")) continue;
        fs.copyFileSync(path.join(nativeSourceDir, fileName), path.join(javaTargetDir, fileName));
      }

      fs.copyFileSync(
        path.join(projectRoot, "plugins/android-auto/automotive_app_desc.xml"),
        path.join(resXmlDir, "automotive_app_desc.xml")
      );

      return config;
    }
  ]);
}

function withAndroidAutoBuildGradle(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const dependency = 'implementation("androidx.media:media:1.7.0")';

    if (contents.includes("androidx.media:media")) {
      return config;
    }

    config.modResults.contents = contents.replace(
      /dependencies\s*\{/,
      `dependencies {\n    ${dependency}`
    );

    return config;
  });
}

function withAndroidAutoMainApplication(config) {
  return withMainApplication(config, (config) => {
    const contents = config.modResults.contents;
    const packageClass = "com.formationvideos.app.androidauto.AndroidAutoCatalogPackage";

    if (contents.includes("AndroidAutoCatalogPackage")) {
      return config;
    }

    const isKotlin = config.modResults.language === "kt";

    if (isKotlin) {
      const kotlinPattern = /(val packages\s*=\s*PackageList\(this\)\.packages)/;
      if (kotlinPattern.test(contents)) {
        config.modResults.contents = contents.replace(
          kotlinPattern,
          `$1\n          packages.add(${packageClass}())`
        );
      }
    } else {
      const javaPattern = /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);)/;
      if (javaPattern.test(contents)) {
        config.modResults.contents = contents.replace(
          javaPattern,
          `$1\n      packages.add(new ${packageClass}());`
        );
      }
    }

    return config;
  });
}

function withAndroidAuto(config) {
  config = withAndroidAutoManifest(config);
  config = withAndroidAutoNativeFiles(config);
  config = withAndroidAutoBuildGradle(config);
  config = withAndroidAutoMainApplication(config);
  return config;
}

module.exports = createRunOncePlugin(withAndroidAuto, "with-android-auto", "1.0.0");
