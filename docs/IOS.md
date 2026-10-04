# Building for iPhone

The web app is the primary build; the same code also builds as a native iOS app with Expo's cloud builder (EAS).
These parts differ by platform (files with a `.web` suffix are the web versions):

| Feature | Web | iOS / Android |
|---|---|---|
| Map | MapLibre GL JS (`MapPicker.web.tsx`) | MapLibre Native (`MapPicker.tsx`), same OpenFreeMap style |
| Date picker | `<input type="date">` (`DateField.web.tsx`) | `@react-native-community/datetimepicker` (`DateField.tsx`) |
| Photo shrinking | canvas re-encode (`lib/photoPrep.web.ts`) | `expo-image-manipulator`, uploaded as an ArrayBuffer (`lib/photoPrep.ts`) |
| "Use my location" | browser geolocation (`lib/location.web.ts`) | `expo-location` (`lib/location.ts`) |

All photos end up as JPEGs with the longest side at most 1280 px, and the storage bucket refuses anything over 2 MB.

## Build and install (needs an Apple Developer account, $99/year)

```sh
npm i -g eas-cli
eas login
eas device:create                       # once per iPhone: open the link on the phone to register it
eas build -p ios --profile preview      # internal build; the result is an install link / QR code
# or, for TestFlight:
eas build -p ios --profile production
eas submit -p ios
```

The first install asks you to enable Developer Mode (Settings -> Privacy & Security).

Map, date picker, location and photo shrinking use native modules, so they cannot run in Expo Go; use a build from
the commands above (or a development build). The native paths were bundled and prebuilt in CI-less checks only
(`expo export -p ios`, `expo prebuild`); they still need a first run on a real device.
