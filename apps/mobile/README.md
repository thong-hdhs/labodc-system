# LabOdc Flutter client

The mobile client implements Talent login/session, profile, public project
discovery, applications, and assigned team work/report flows. It uses the
existing REST endpoints and response contracts shared with the web client.

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
- `GET /talent/me/files`
- `GET /talent/discovery/projects` and `GET /talent/discovery/projects/:projectId`
- `POST /projects/:projectId/applications`
- `GET /talent/me/applications`, `POST /applications/:applicationId/withdraw`
- `GET /talent/me/team`, `GET /talent/me/tasks`
- `POST /talent/tasks/:taskId/start`
- `POST /talent/tasks/:taskId/submissions`
- `GET /talent/me/reports`, `POST /talent/me/reports`
- `POST /reports/:reportId/submit`
- `GET /talent/me/evaluations`
- `POST /talent/evaluations/:evaluationId/acknowledge`
- `POST /talent/evaluations/:evaluationId/feedback`
- `POST /files/upload-intents`, `POST /files/:fileId/complete`
- `GET /tasks/:taskId/files`, `GET /reports/:reportId/files`
- `GET /files/:fileId/download`

Project discovery accepts `keyword`, `skill`, `page`, and `pageSize`; the API
returns only published projects whose recruitment window is open. The API
limits `pageSize` to 50.

Application submission is protected against repeated taps in the UI and uses
the server's active-application conflict response as the source of truth. If a
network timeout leaves the outcome uncertain, the app asks the Talent to check
the application list before trying again; it does not silently repeat a
potentially completed write.

The work screen shows the Talent's team/project, tasks, and team reports.
Task start/submission follows the API state machine, and report creation and
submission controls are shown only to the current team leader. Server-side
authorization and validation remain authoritative.

Task/report attachments use the existing private Cloudinary flow: the app
requests a signed upload intent from the API, uploads the selected PDF/DOCX/
XLSX/CSV directly to the HTTPS Cloudinary endpoint, then asks the API to verify
and complete the upload. Download URLs are issued by the API for the
authenticated user and opened externally; the client does not persist or
publish Cloudinary URLs. The API's 20 MiB limit is also enforced before upload.

Profile documents use the same signed, private upload flow. Avatar files accept
PNG/JPEG up to 5 MiB, and portfolio files accept PDF/PNG/JPEG up to 10 MiB.
The profile must be saved before uploading; completed files are listed from
`GET /talent/me/files`, and downloads use short-lived URLs issued by the API.

The evaluation screen displays only finalized Mentor evaluations belonging to
the signed-in Talent. Talent may acknowledge receipt once (retries are
idempotent) and submit one optional 3–2000 character response; only the
evaluated Talent and assigned Mentor can see that response.
