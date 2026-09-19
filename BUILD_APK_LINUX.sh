#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm install
npm run build
if [ ! -d android ]; then
  npx cap add android
fi
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug
cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk Janen_Car.apk
echo "APK cree: $(pwd)/Janen_Car.apk"
