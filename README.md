# Safe Insight Laser Target Trainer

Safe Insight Laser Target Trainer records camera video, detects laser shots on calibrated targets, supports drills and playback, and produces training summaries.

This branch converts the application into a Progressive Web App (PWA) while keeping the existing laser-target application logic intact.

## PWA structure

```text
index.html          Application markup and PWA entry point
styles.css          Extracted application stylesheet
app.js              PWA lifecycle plus existing application JavaScript
manifest.json       Installable web-app manifest
service-worker.js   App-shell/offline service worker
icons/
  icon-192.png      192x192 PWA icon
  icon-512.png      512x512 PWA icon
```

## Install the app

On a supported browser, open the deployed HTTPS application and use the browser's install control or the application's **Install App** prompt when it appears.

The install prompt is implemented through `beforeinstallprompt` and is only shown when the browser determines that the application is installable.

## Offline / online behavior

The service worker caches the application shell, including the HTML entry point, CSS, JavaScript, manifest, Safe Insight logos, and existing local sound assets.

After the first successful load, the application shell can be opened while offline. Connectivity status is exposed in the UI as **Online** or **Offline**.

Offline operation does not imply that every browser capability works without the device hardware. Camera access still depends on the browser and operating system permitting camera use.

## Camera permissions

Camera access uses the browser Media Capture API (`navigator.mediaDevices.getUserMedia`). The PWA includes a permission boundary at `window.SafeInsightCamera.requestCamera()` that provides clearer errors for denied, missing, or unavailable cameras.

The existing application's camera/detection code remains separate from this boundary.

## Authentication integration boundary

Authentication is intentionally not tied to the detector, camera, MediaRecorder, target calibration, or shot analysis.

A provider can be integrated through:

```js
window.SafeInsightAuth
```

The current boundary exposes `getCurrentUser()`, `signIn()`, and `signOut()` placeholders. Connect the production authentication provider there rather than embedding authentication logic throughout the application.

## HTTPS requirement

Production camera access and service workers require a secure context. Deploy the application over **HTTPS**.

`http://localhost` is treated as a secure development context by modern browsers for local development, but a deployed application should use HTTPS.

## GitHub Pages / static deployment

This application is compatible with static hosting. When deploying under a repository subpath, keep the manifest `start_url` and service-worker scope relative (`./`) as configured here.

The service worker must be served from the same origin and within the scope it controls.

After changing cached application files, increment `CACHE_NAME` in `service-worker.js` so existing clients receive the new app shell.

## Testing checklist

Before merging this PWA conversion into production, test:

- First visit while online
- Browser refresh
- Reload while offline
- Install prompt
- Launching the installed app
- Camera permission granted
- Camera permission denied and retried
- Camera unavailable / already in use
- Portrait camera layout
- Landscape camera layout
- Target calibration
- Laser-shot detection
- Target-selection modes
- Drill selection and callouts
- Recording and playback
- Video export
- PDF summary export
- Existing Safe Insight logos and sounds
- Returning online after an offline period

## Important architecture note

The original application contains a substantial amount of working camera, detection, recording, playback, target, drill, and PDF code. The PWA conversion extracts the existing inline CSS and JavaScript rather than rewriting those systems. This minimizes behavioral changes during the PWA migration.

## Security

Do not put authentication secrets, private API keys, service credentials, or other secrets in `index.html`, `styles.css`, `app.js`, `manifest.json`, or the service worker. Browser-delivered JavaScript is public by design.
