# Mobile Builds (iOS and Android)

This project uses Expo. The recommended way to produce release builds is EAS Build.

## Prerequisites

- Node.js + npm
- Expo account
- EAS CLI: `npm install -g eas-cli`
- For iOS: Apple Developer account
- For Android: Google Play Console account (optional for internal testing)

## One-time setup

```bash
cd frontend
npm install
npx expo login
npx eas build:configure
```

This creates `eas.json` and registers the project.

## Set API URL

Ensure `EXPO_PUBLIC_API_URL` is set in `frontend/.env` before building.

Example:

```bash
EXPO_PUBLIC_API_URL=http://localhost:5000
```

For device or cloud builds, use your server's reachable URL.

## Android build

```bash
cd frontend
npx eas build --platform android
```

Output: `.apk` or `.aab` (depends on selected profile).

## iOS build

```bash
cd frontend
npx eas build --platform ios
```

Output: `.ipa` (requires Apple Developer account for signing).

## Local builds (optional)

If you prefer local builds:

```bash
cd frontend
npx eas build --platform android --local
npx eas build --platform ios --local
```

## Test builds on device

- Android: install the `.apk` directly on device.
- iOS: use TestFlight or `eas submit` to upload to App Store Connect.

## Submit to stores (optional)

```bash
cd frontend
npx eas submit --platform android
npx eas submit --platform ios
```
