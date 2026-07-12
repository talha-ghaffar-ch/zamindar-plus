# Zamindar Plus — Mobile Deployment & Connectivity Guide

The Android app is a **React Native 0.86 (CLI, New Architecture + Hermes)** client that
talks **only to the live production backend** (EC2 + RDS) — the same API the website
uses. There is no local/dev backend and no mock data.

---

## 1. Production API configuration

All production config lives in one file: [`src/config.ts`](src/config.ts).

```ts
export const API_BASE_URL = 'https://13.203.249.97.sslip.io/api';
export const GOOGLE_WEB_CLIENT_ID =
  '610341952875-kjn2ja26mnbt1f8o6kes7ke48p3dmo9u.apps.googleusercontent.com';
```

- **`API_BASE_URL`** — the live backend, fronted by Caddy on the EC2 host
  (`zamindar-plus-web-1` container, ports 80/443), which strips `/api` and proxies to
  the NestJS API container (`zamindar-plus-api-1`, internal `:3000`). Health check:
  `GET https://13.203.249.97.sslip.io/api/` → `{"status":"ok"}`.
- Both debug and release builds use this same production URL. The API client
  ([`src/api.ts`](src/api.ts)) sends the JWT as `Authorization: Bearer <token>`.
- **`GOOGLE_WEB_CLIENT_ID`** — the OAuth **Web** client ID the backend verifies Google
  ID tokens against (`GOOGLE_CLIENT_ID` in the backend env). Client IDs are not secrets,
  so this is safe in source. The app uses it as `webClientId` to request an ID token,
  which it posts to `POST /api/auth/google` as `{ credential }`.

Because the app is a **native** client, `fetch` sends no `Origin` header and is **not**
subject to browser CORS, and the backend already serves 443 publicly. Therefore **no
EC2 security-group change and no CORS entry are required** for the app to work.

---

## 2. Google OAuth setup (one-time, in Google Cloud Console)

Native Android Google Sign-In needs an **Android OAuth client** in the *same* Google
Cloud project as the existing web client (`610341952875…`). In
[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

**Create Credentials → OAuth client ID → Android**, then set:

| Field | Value |
|-------|-------|
| Package name | `com.mobile` |
| SHA-1 (debug — on-device dev) | `0E:4A:38:4F:6B:C7:F3:E2:9E:DC:5B:D7:EF:9E:20:57:54:7F:F0:24` |
| SHA-1 (release — signed APK) | `33:10:05:B3:AA:45:CE:ED:66:BE:84:1C:92:97:17:27:70:96:65:2F` |

No backend change is needed — the backend keeps verifying ID tokens against the **web**
client ID. Google redirect URIs are a web concept and are **not** used by the native
Android flow (Google Play Services authorizes the app by package name + SHA-1).

To regenerate the SHA-1s:

```bash
# debug
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android | grep SHA1
# release
keytool -list -v -keystore android/app/zamindar-release.keystore -alias zamindar | grep SHA1
```

---

## 3. Running the app in development (on a USB-connected phone)

Prereqs: Node ≥ 22, JDK 17, Android SDK, a device with USB debugging on
(`adb devices` shows it).

```bash
# from apps/mobile
npm start                 # start Metro (port 8081)
npm run android           # build + install the debug app and launch it
```

If Metro was already running from an older session, restart it with a clean cache after
installing new native libraries: `npm start -- --reset-cache`.

---

## 4. Building the signed release APK

### Signing material (kept OUT of the public repo)

- Keystore: `android/app/zamindar-release.keystore` (git-ignored via `*.keystore`).
- Credentials live in **`~/.gradle/gradle.properties`** (global, never committed):

  ```properties
  ZAMINDAR_UPLOAD_STORE_FILE=zamindar-release.keystore
  ZAMINDAR_UPLOAD_KEY_ALIAS=zamindar
  ZAMINDAR_UPLOAD_STORE_PASSWORD=********   # store this in your password manager
  ZAMINDAR_UPLOAD_KEY_PASSWORD=********
  ```

  `android/app/build.gradle` uses the release keystore when these properties are present,
  and falls back to debug signing otherwise (so the public repo still builds cleanly).

> **Back up the keystore and its password.** If lost, you can never ship an update to the
> same app listing.

### Windows only: build from a short folder path

The New Architecture generates C++ codegen object paths longer than Windows'
260-char `MAX_PATH` (e.g. `react-native-gesture-handler`'s shadow-node codegen),
which breaks the **release** CMake build (`ninja: Filename longer than 260
characters`). The debug build stays just under the limit, so on-device
development needs no workaround — this only affects the release APK.

`LongPathsEnabled=1` in the registry is **not** enough on its own: the NDK's
`ninja` has its own hard 260-char check on the *relative* codegen path, and
junctions / `subst` don't help because CMake resolves them back to the real
(long) path. The reliable fix is to build from a **short repo folder** so the
worst-case codegen path (~265 chars from `E:\zamindar-plus\...`) drops under
260. A folder name of ≤ 7 characters is enough.

Easiest: build from a clone at a short path (leaves your working copy untouched):

```bash
git clone <this-repo> C:/z
cd C:/z && npm ci
cp <your-repo>/apps/mobile/android/app/zamindar-release.keystore C:/z/apps/mobile/android/app/
# ~/.gradle/gradle.properties (ZAMINDAR_UPLOAD_* signing props) is read globally
```

(Alternatively, rename the repo folder itself to something short like `C:\z`.)

### Build

```bash
# from <short-path>/apps/mobile/android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a -Pkotlin.incremental=false
# add ,armeabi-v7a only for very old 32-bit phones — arm64-v8a covers ~all modern devices
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (copy it back to
your working copy if you built from a clone).

The release APK bundles the JS as **Hermes bytecode** and points at production —
it runs standalone on any device with **no Metro server and no laptop**.

> RN 0.86 ships the host `hermesc` in the separate `hermes-compiler` npm package
> (hoisted to the monorepo root `node_modules`). `app/build.gradle` sets
> `react.hermesCommand` explicitly to point at it — without that, `assembleRelease`
> fails with "Couldn't determine Hermesc location".

---

## 5. Installing on a physical phone & confirming it's live

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
# or copy app-release.apk to the phone and open it (allow "install unknown apps")
```

Confirm it's talking to the live backend and RDS:

1. Launch the app → the Login screen loads.
2. Sign in with a real account (email/password), or Google once the Android OAuth client
   above exists. A wrong password returns the backend's own message
   ("Invalid email or password.").
3. The Dashboard, Records, Reports and Assistant then render data pulled live from RDS
   through the backend API. Creating a record from the **Add** tab writes to RDS and
   appears in the website too (shared database).

Quick backend reachability check from any machine:

```bash
curl https://13.203.249.97.sslip.io/api/            # {"status":"ok"}
```

---

## 6. EC2 / infrastructure changes

**None required.** The mobile app reaches the same public HTTPS endpoint as the website:

- **Security group** — unchanged. The backend already serves 443 publicly; the app
  connects from any network as-is. (Do **not** widen the SG for the app — it would be a
  needless exposure.)
- **CORS** — unchanged. `CORS_ORIGIN` gates *browsers*; the native app is not subject to
  it.
- **Google OAuth** — the only external setup is the Android OAuth client in §2, done in
  Google Cloud Console (not on EC2).

---

## 7. Notes

- Architecture unchanged: React Native **CLI** (not Expo), New Architecture + Hermes,
  Node/JDK toolchain as before, monorepo layout intact. UI layer was rebuilt; the CI/CD
  pipeline is untouched.
- Added native libraries: `react-native-reanimated` (+ `react-native-worklets`),
  `react-native-gesture-handler`, `react-native-screens`, `react-native-svg`,
  `@react-navigation/*`, `@gorhom/bottom-sheet`, `react-native-haptic-feedback`,
  `lucide-react-native`, `@react-native-google-signin/google-signin`.
