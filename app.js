/*
 * Safe Insight Laser Target Trainer
 * PWA integration boundary.
 *
 * The existing laser-target application logic remains intentionally separate
 * from the PWA lifecycle code below. This prevents authentication, install,
 * connectivity, and permission concerns from becoming coupled to detection.
 */

(function () {
  "use strict";

  // ========================================
  // PWA SERVICE WORKER
  // ========================================

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
        .then(registration => {
          console.log("PWA service worker registered:", registration.scope);
        })
        .catch(error => {
          console.error("PWA service worker registration failed:", error);
        });
    });
  }

  // ========================================
  // INSTALL-APP PROMPT
  // ========================================

  let deferredInstallPrompt = null;

  function createInstallButton() {
    if (document.getElementById("installAppBtn")) return;

    const button = document.createElement("button");
    button.id = "installAppBtn";
    button.type = "button";
    button.textContent = "Install App";
    button.hidden = true;
    button.setAttribute("aria-label", "Install Safe Insight Laser Target Trainer");

    button.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;

      console.log("PWA install choice:", result.outcome);
      deferredInstallPrompt = null;
      button.hidden = true;
    });

    document.body.appendChild(button);
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    createInstallButton();
    document.getElementById("installAppBtn").hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const button = document.getElementById("installAppBtn");
    if (button) button.hidden = true;
    console.log("Safe Insight Laser Target Trainer installed.");
  });

  // ========================================
  // ONLINE / OFFLINE HANDLING
  // ========================================

  function updateConnectionStatus() {
    let status = document.getElementById("connectionStatus");

    if (!status) {
      status = document.createElement("div");
      status.id = "connectionStatus";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }

    status.textContent = navigator.onLine ? "Online" : "Offline";
    status.dataset.online = navigator.onLine ? "true" : "false";
  }

  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateConnectionStatus, { once: true });
  } else {
    updateConnectionStatus();
  }

  // ========================================
  // CAMERA PERMISSION BOUNDARY
  // ========================================

  window.SafeInsightCamera = {
    async requestCamera(constraints = { video: true, audio: false }) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        if (error.name === "NotAllowedError") {
          throw new Error("Camera permission was denied. Allow camera access and try again.");
        }

        if (error.name === "NotFoundError") {
          throw new Error("No compatible camera was found on this device.");
        }

        if (error.name === "NotReadableError") {
          throw new Error("The camera is already in use or could not be opened.");
        }

        throw error;
      }
    }
  };

  // ========================================
  // AUTHENTICATION INTEGRATION BOUNDARY
  // ========================================
  // Keep authentication provider-specific code here. Do not couple it to
  // camera detection, MediaRecorder, target calibration, or shot analysis.

  window.SafeInsightAuth = {
    isConfigured: false,

    async getCurrentUser() {
      // TODO: Connect your chosen authentication provider here.
      // Return null until an authentication provider is configured.
      return null;
    },

    async signIn() {
      // TODO: Provider-specific sign-in implementation.
      throw new Error("Authentication provider is not configured.");
    },

    async signOut() {
      // TODO: Provider-specific sign-out implementation.
      throw new Error("Authentication provider is not configured.");
    }
  };

})();
