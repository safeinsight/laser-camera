# Safe Insight Laser Target Trainer

Safe Insight Laser Target Trainer records camera video, detects laser shots on calibrated targets, supports drills and playback, and produces training summaries.

This branch converts the application into a Progressive Web App (PWA) and adds a Wix membership authorization gate while keeping the existing laser-target application logic intact.

## PWA structure

```text
index.html          Application markup and PWA entry point
styles.css          Application stylesheet
app.js              Existing application logic and PWA lifecycle code
manifest.json       Installable web-app manifest
service-worker.js   App-shell/offline service worker
wix-auth.js         Wix Headless membership authorization gate
icons/
  icon-192.png      192x192 PWA icon
  icon-512.png      512x512 PWA icon
```

## Wix membership authorization

The deployed test application uses Wix Headless authentication to authorize access to the Laser Target application.

Access is granted only to a logged-in Wix member with an **ACTIVE** Pricing Plan order named:

- `Laser App Annual`
- `Laser App Monthly`

Members without either qualifying active plan, including cancelled plans, are denied access.

The Wix Client ID and public redirect URI are used by the browser-side authentication flow. **No client secret or other private credential belongs in this repository.**

Configured authorization redirect URI:

```text
https://safeinsight.github.io/laser-camera/
```

## Offline membership behavior

After a qualifying Annual or Monthly membership has been successfully verified online, the browser stores a timestamped local authorization record for a **24-hour offline grace period**.

- Online: Wix membership is verified against the current Pricing Plan order.
- Offline with a recent successful verification: the application may open using the cached authorization.
- Offline after the 24-hour grace period: online verification is required.
- A successful online verification that finds no qualifying active plan removes the cached authorization.

The offline record is a convenience mechanism for PWA use, not a tamper-proof security boundary. Online Wix verification remains authoritative.

## Install the app

On a supported browser, open the deployed HTTPS application and use the browser's install control or the application's **Install App** prompt when it appears.

The install prompt is implemented through `beforeinstallprompt` and is only shown when the browser determines that the application is installable.

## Offline / online behavior

The service worker caches the application shell, including the HTML entry point, CSS, JavaScript, manifest, Safe Insight logos, and local sound assets.

After the first successful load, the application shell can be opened while offline. Connectivity status is exposed in the UI as **Online** or **Offline**.

Offline operation does not imply that every browser capability works without device hardware. Camera access still depends on the browser and operating system permitting camera use.

## Camera permissions

Camera access uses the browser Media Capture API (`navigator.mediaDevices.getUserMedia`). The application includes a permission boundary at `window.SafeInsightCamera.requestCamera()` that provides clearer errors for denied, missing, or unavailable cameras.

The existing application's camera/detection code remains separate from this boundary.

## Authentication integration boundary

Authentication is isolated in `wix-auth.js` rather than being embedded throughout the camera, detector, MediaRecorder, target calibration, shot analysis, drill, export, or PDF code.

The Wix authentication layer handles:

- Wix login and OAuth callback processing
- Wix member token persistence in browser storage
- Current-member Pricing Plan verification
- Annual/Monthly authorization decisions
- Offline authorization grace handling

Do not put a Wix client secret, private API key, or service credential in browser-delivered files.

## HTTPS requirement

Production camera access and service workers require a secure context. Deploy the application over **HTTPS**.

`http://localhost` is treated as a secure development context by modern browsers for local development, but a deployed application should use HTTPS.

## GitHub Pages / static deployment

This application is compatible with static hosting. When deploying under a repository subpath, keep the manifest `start_url` and service-worker scope relative (`./`) as configured here.

The service worker must be served from the same origin and within the scope it controls.

After changing cached application files, increment `CACHE_NAME` in `service-worker.js` so existing clients receive the new app shell.

## Production testing checklist

Before moving the membership-protected PWA into the production branch, verify:

### Existing application

- First visit while online
- Browser refresh
- Camera permission granted
- Camera permission denied and retried
- Camera unavailable / already in use
- Portrait camera layout
- Landscape camera layout
- Target calibration
- Laser-shot detection in all target-selection modes
- Drill selection and callouts
- Recording and playback
- Video export
- PDF summary export
- Existing Safe Insight logos and sounds

### PWA

- Manifest loads correctly
- Service worker registers
- App shell loads offline
- Offline/online indicator changes correctly
- Install prompt appears
- Installed app launches correctly
- Online recovery works

### Wix authorization

- Logged-out visitor is denied until login
- Active `Laser App Annual` member is allowed
- Active `Laser App Monthly` member is allowed
- Member without either qualifying plan is denied
- Cancelled/inactive qualifying plan is denied
- Authorized member can refresh while online
- Authorized member can close/reopen the app
- Authorized member can refresh while offline within the 24-hour grace period
- Online recovery after offline use works

## Security

Browser-delivered JavaScript is public by design. Do not put authentication secrets, private API keys, service credentials, or other secrets in `index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`, or `wix-auth.js`.

The Wix Client ID is an identifier, not a secret. The authoritative subscription check is performed against Wix while online.

## Architecture note

The original application contains substantial working camera, detection, recording, playback, target, drill, and PDF code. The PWA conversion keeps those systems separate from the Wix membership gate to minimize behavioral changes during the migration.
