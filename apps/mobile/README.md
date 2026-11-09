# LabOdc Flutter client

The mobile client currently implements the Talent login/session, profile and public project discovery slices. It uses the same REST endpoints and response contracts as the web client.

## Requirements

- Flutter SDK with Dart 3.3 or later.
- Android emulator/device for Android runs. The repository checkout does not include generated Android runner files yet.
- API reachable over HTTPS, or a development API URL reachable from the emulator/device.

## Bootstrap and run

From `apps/mobile`:

```powershell
flutter create --platforms=android --no-pub .
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=API_BASE_URL=https://your-api-host/api/v1
```

For Android Emulator with the API on the host machine, use
`--dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1`. Do not enable general
cleartext traffic in a release build; configure any local-development exception
only in the Android debug manifest/network security configuration. In the
generated Android manifest, set `android:allowBackup="false"` so encrypted
secure-storage values are not restored without their device-bound key.

## Session handling

Access token, refresh token and the minimal account display record are stored
with `flutter_secure_storage`; the app never stores the password. On startup it
validates the access token with `GET /auth/me` before restoring the session.
The API currently has no refresh-token endpoint, so an expired access token
clears the local session and requires the user to sign in again. Production
logout/session revocation behavior must be verified with the API owner.

## Implemented API contract

- `POST /auth/login`
- `GET /auth/me`, `POST /auth/logout`
- `GET /talent/me/profile`, `PUT /talent/me/profile`
- `GET /talent/discovery/projects` and `GET /talent/discovery/projects/:projectId`

Project discovery accepts `keyword`, `skill`, `page`, and `pageSize`; the API
returns only published projects whose recruitment window is open. The API
limits `pageSize` to 50.
