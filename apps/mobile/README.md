# Zamindar Plus — Mobile

React Native app (CLI, **RN 0.86**, New Architecture + Hermes) for the Zamindar
Plus farm ledger.

## What it connects to

The app is wired to the **production** backend by default — the API base URL is
hard-coded in `src/config.ts`. So you do **not** need the backend, frontend, or a
database running locally to develop or test the app; it talks to the live server.

## Prerequisites

- **Node.js 24** (minimum 22.11)
- **JDK 17**
- **Android Studio** + SDK: Platform-Tools (`adb`), an SDK Platform, NDK, CMake
- `ANDROID_HOME` set (or `android/local.properties` with `sdk.dir=...`)
- A physical device (USB debugging enabled) or an emulator

## Run (debug)

From the repository root:

```bash
npm install
npm run android:mobile        # builds + installs the debug app on your device
npm run dev:mobile            # start the Metro bundler (if not already running)
```

The first Android build downloads Gradle and compiles native code (~10-15 min).

## Quality

```bash
npm run typecheck:mobile
npm run lint:mobile
npm run test:mobile
```

## Release APK (standalone)

A signed release APK bundles the JS as Hermes bytecode and runs on any device
with no laptop and no Metro server. See **`DEPLOYMENT.md`** for the full recipe.

On Windows the release build must run from a **short folder path** (the New
Architecture codegen overflows the 260-char path limit). Short version:

```bash
# from a short path such as C:\z (clone there, or rename the project folder short)
cd apps/mobile/android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a -Pkotlin.incremental=false
# -> app/build/outputs/apk/release/app-release.apk
```

## Main areas

- Sign in / sign up / email verification / password reset (+ Google sign-in)
- Dashboard: net profit, profit ring, metric cards, monthly movement, quick actions
- Records: profiles -> zameen -> crops -> expense / income ledgers
- Add: profiles, zameen, crops, expenses, income
- Reports, Settings, Help, and the session-only Zamindar AI chat
