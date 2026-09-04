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

/* =========================================================
   CUSTOM ALERT / CONFIRM REFERENCES
========================================================= */

const customAlertOverlay =
    document.getElementById("customAlertOverlay");

const customAlertMessage =
    document.getElementById("customAlertMessage");

const customAlertOk =
    document.getElementById("customAlertOk");

const customAlertCancel =
    document.getElementById("customAlertCancel");


/* =========================================================
   CUSTOM ALERT / CONFIRM FUNCTIONS
========================================================= */

function showCustomAlert(message){

    return new Promise(function(resolve){

        customAlertMessage.textContent =
            message;

        customAlertCancel.style.display =
            "none";

        customAlertOk.textContent =
            "OK";

        customAlertOverlay.classList.add(
            "show"
        );

        customAlertOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        function onOk(){

            customAlertOk.removeEventListener(
                "click",
                onOk
            );

            resolve();

        }

        customAlertOk.addEventListener(
            "click",
            onOk
        );

        customAlertOk.focus();

    });
}


function showCustomConfirm(message){

    return new Promise(
        function(resolve){

            customAlertMessage.textContent =
                message;

            customAlertCancel.style.display =
                "inline-block";

            customAlertOk.textContent =
                "Continue";

            customAlertOverlay.classList.add(
                "show"
            );

            customAlertOverlay.setAttribute(
                "aria-hidden",
                "false"
            );


            function finish(result){

                customAlertOverlay.classList.remove(
                    "show"
                );

                customAlertOverlay.setAttribute(
                    "aria-hidden",
                    "true"
                );

                customAlertCancel.style.display =
                    "none";

                customAlertOk.textContent =
                    "OK";


                customAlertOk.removeEventListener(
                    "click",
                    onConfirm
                );

                customAlertCancel.removeEventListener(
                    "click",
                    onCancel
                );

                resolve(result);
            }


            function onConfirm(){
                finish(true);
            }


            function onCancel(){
                finish(false);
            }


            customAlertOk.addEventListener(
                "click",
                onConfirm
            );

            customAlertCancel.addEventListener(
                "click",
                onCancel
            );

            customAlertOk.focus();
        }
    );
}

/*
 * Normal alerts close with OK.
 * Confirmations are handled by their own listeners above.
 */
customAlertOk.addEventListener(
    "click",
    function(){

        if(
            customAlertCancel.style.display ===
            "none"
        ){

            customAlertOverlay.classList.remove(
                "show"
            );

            customAlertOverlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }
);

/* ========================================
   EXISTING LASER TARGET APPLICATION
   Extracted from index.html without functional changes.
   ======================================== */

// Handles clicking open and closing custom menu wrappers
  document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
    const trigger = wrapper.querySelector('.select-trigger');
    const nativeSelect = wrapper.querySelector('select');
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other dropdowns if open
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if(w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    // Handle user selecting an explicit menu value choice option
    wrapper.querySelectorAll('.custom-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        const text = item.textContent;
        
        // Sync custom UI text values
        trigger.textContent = text;
        
        // Update hidden native menu selector form values 
        nativeSelect.value = val;
        
        // Fire original .onchange event engine systems natively
        nativeSelect.dispatchEvent(new Event('change'));
        
        wrapper.classList.remove('open');
      });
    });
  });

  // Global click checker helper layer to close menus if user clicks elsewhere on page background canvas
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
  });

/* ======================================== */

//------------------------------------
// CONSTANTS -->
//------------------------------------
const preview=
document.getElementById(
"preview"
);

const playback=
document.getElementById(
"playback"
);

const overlay=
document.getElementById(
"overlay"
);

const ctx=
overlay.getContext(
"2d"
);

const detectCanvas=
document.getElementById(
"detectCanvas"
);

const detectCtx=
detectCanvas.getContext(
"2d",
{
willReadFrequently:true
}
);

const timerOverlay=
document.getElementById(
"timerOverlay"
);

const drawTargetBtn =
document.getElementById(
"drawTargetBtn"
);

const startBtn =
document.getElementById("startBtn");

const stopBtn =
document.getElementById("stopBtn");

const drillsBtn =
document.getElementById("drillsBtn");

const summaryBtn =
document.getElementById("summaryBtn");

const analysisBtn =
document.getElementById(
"analysisBtn"
);

const clearTargetBtn =
document.getElementById(
"clearTargetBtn"
);

const deleteTargetsBtn =
document.getElementById(
"deleteTargetsBtn"
);    

const analysisLabel =
document.getElementById(
"analysisLabel"
);

const settingsBtn =
document.getElementById(
"settingsBtn"
);

const setupControls =
document.getElementById(
"setupControls"
);

const settingsPanel =
document.getElementById(
"settingsPanel"
);

//------------------------------------------------
// Target Selection Settings
//------------------------------------------------

const targetSelectionSelect =
    document.getElementById(
        "targetSelectionSelect"
    );

const consecutiveShotsSelect =
    document.getElementById(
        "consecutiveShotsSelect"
    );

const consecutiveShotsCard =
    document.getElementById(
        "consecutiveShotsCard"
    );


//------------------------------------------------
// Target Selection Change
//------------------------------------------------

targetSelectionSelect.addEventListener(
    "change",
    function(){

        //----------------------------------------
        // Save selected mode
        //----------------------------------------

        targetSelectionMode =
            this.value;


    //----------------------------------------
    // Show/hide shots-per-target
    //----------------------------------------

    if(
        this.value === "CONSECUTIVE" ||
        this.value === "RANDOM"
    ){

    consecutiveShotsCard.style.display =
        "block";

    consecutiveShotCount = 0;

}else{

    consecutiveShotsCard.style.display =
        "none";
}

//----------------------------------------
// ALL
//
// Keep the current target so the existing
// highlighting system continues to work.
//----------------------------------------

if(
    this.value === "ALL"
){

    if(!activeTarget){
        const availableTargets =
            targets.filter(
                target => target.calibrated
            );

        if(availableTargets.length > 0){
            activeTarget =
                availableTargets[0];
        }
    }
}

//----------------------------------------
// RANDOM / CONSECUTIVE
// Make sure a target is selected.
//----------------------------------------

else if(
    (
        this.value === "RANDOM" ||
        this.value === "CONSECUTIVE"
    ) &&
    !activeTarget
){

    nextTarget();
}

        redrawOverlay();
    }
);

//------------------------------------------------
// CONSECUTIVE SHOTS CHANGE
//------------------------------------------------

consecutiveShotsSelect.addEventListener(
    "change",
    function(){

        consecutiveShotsPerTarget =
            Number(this.value);
        consecutiveShotCount = 0;
    }
);

const distanceSelect =
document.getElementById(
"distanceSelect"
);

const countdownSelect =
document.getElementById(
"countdownSelect"
);

const countdownSound = new Audio("shot-beep.mp3");
countdownSound.preload = "auto";

const hitSoundTemplate = new Audio("pistol-shot.mp3");
hitSoundTemplate.preload = "auto";

function playHitSound() {
    const sound = hitSoundTemplate.cloneNode();
    sound.volume = 1.0;
    sound.play().catch(err => {
        console.log("Hit sound failed:", err);
    });
}
    
const sensitivitySelect =
document.getElementById(
"sensitivitySelect"
);

const targetShapeSelect =
document.getElementById(
"targetShapeSelect"
);

//--------------------------
// APP MODES
//--------------------------

const APP_SETUP = "setup";
const APP_COUNTDOWN = "countdown";
const APP_RECORDING = "recording";
const APP_PLAYBACK = "playback";

let appMode = APP_SETUP;

//--------------------------
// VARIABLES
//--------------------------

let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingSeconds = 0;
let timerInterval = null;
let countdownRunning = false;
let countdownInterval = null;  
let laserSensitivity = "normal";
let recordingStartTime = 0;

let playbackSyncActive = false;
let showRecordedHits = true;

let selectedDrill = null;

let videoOffsetX = 0;
let videoOffsetY = 0;
let videoScaleX = 1;
let videoScaleY = 1;
    
let targetDistance = 7;

if(distanceSelect){
    distanceSelect.value =
        targetDistance;
}   

let shots = 0;
let hits = [];

    //------------------------------------------------
    // Target History
    //------------------------------------------------

let targetHistory = [];
let countdownValue = null;

    //------------------------------------------------
    // Current laser state
    //------------------------------------------------

let currentLaserVisible = false;
let currentLaserX = 0;
let currentLaserY = 0;

    //------------------------------------------------
    // Group center
    //------------------------------------------------

let groupCenter = null;

    //------------------------------------------------
    // Analysis overlay
    //------------------------------------------------

let analysisEnabled = false;
analysisBtn.checked = analysisEnabled;

let countdownSeconds = 3;
if(countdownSelect){
    countdownSelect.value =
        countdownSeconds;
}

    //------------------------------------------------
    // Target Shape
    //------------------------------------------------

let targetShape = "rectangle";

if(targetShapeSelect){
    targetShapeSelect.value =
        targetShape;
}

//-------------------------------------
// LASER STATE MACHINE 
//-------------------------------------

const LASER_WAITING = 0;
const LASER_TRACKING = 1;

// Current detector state
let laserState = LASER_WAITING;

// Number of consecutive frames with
// no laser detected.
let laserMissingFrames = 0;
let freezeBackground = false;

// Laser must disappear this many
// frames before another shot is allowed.
const LASER_RELEASE_FRAMES = 2;

// Prevent double-shots from timer
// glitches.
let lastShotTime = 0;
let targets = [];

//------------------------------------------------
// TARGET SELECTION SETTINGS
//------------------------------------------------

let targetSelectionMode = "ALL";

// Number of shots required on each target
// when using CONSECUTIVE mode.
let consecutiveShotsPerTarget = 1;

// Number of shots already made on the
// current target.
let consecutiveShotCount = 0;

    //------------------------------------------------
    // Active Target
    //------------------------------------------------
let activeTarget = null;

    //------------------------------------------------
    // Target Change Locked
    //------------------------------------------------
let waitingForNextTarget = false;

    //------------------------------------------------
    // Current Target
    //------------------------------------------------
let target = targets[0];
let currentTarget = null;
    
// Used only during calibration
let calibrationStep = 0;
let continuousTargetDrawing = false;
// Drag calibration
let calibrationDragging = false;
let calibrationStartX = 0;
let calibrationStartY = 0;
let calibrationCurrentX = 0;
let calibrationCurrentY = 0;
    
    //-------------------------------------
    // Current Camera Size
    //-------------------------------------

// Updated every resize()
let cameraWidth = 0;
let cameraHeight = 0;

    //-------------------------------------
    // Display Size
    //-------------------------------------

// Size of displayed video element
let displayWidth = 0;
let displayHeight = 0;

    //-------------------------------------
    // Overlay Scale
    //-------------------------------------

// Converts camera coordinates to overlay coordinates
let scaleX = 1;
let scaleY = 1;

//-------------------------------------
// DETECTOR SETTINGS -->
//-------------------------------------

const DETECTOR = {
    pixelStep:1,
   baseThreshold:28,
colorDifference:20,
    minBlobPixels:1,
    maxBlobPixels:80,
    shotDelay:250
};

    //------------------------------------------------
    // Local Color Detector
    //------------------------------------------------

// Size of neighborhood around each pixel
const LOCAL_RADIUS = 1;

    //------------------------------------------------
    // Adaptive Target Grid
    //------------------------------------------------

// Divide the calibrated target into smaller regions

// Each region will maintain its own average background brightness
const GRID_COLS = 4;
const GRID_ROWS = 4;

// One brightness value per region.
let gridBrightness = [];

function resetGrid(){
    gridBrightness = [];
    for(let y=0; y<GRID_ROWS; y++){
        gridBrightness[y] = [];
        for(let x=0; x<GRID_COLS; x++){
            gridBrightness[y][x] = 0;
        }
    }
}
resetGrid();

    //-------------------------------------
    // Background Frame
    //-------------------------------------

let backgroundFrame = null;

// Wait one frame before learning
// the background after recording starts.
let learnBackground = true;

//------------------------------------------------
// RENDERING HELPER FUNCTIONS
//------------------------------------------------

function normToOverlayX(nx){
    return nx * overlay.width;
}

function normToOverlayY(ny){
    return ny * overlay.height;
}

function detectorToNormX(px){
    return px / detectCanvas.width;
}

function detectorToNormY(py){
    return py / detectCanvas.height;
}

//------------------------------------------------
// CALL OUT ACTIVE TARGET FUNCTION
//------------------------------------------------

function callOutTargetNumber(target){
    const targetToCall = target;
   
    setTimeout(() => {
        const words = [
            "zero",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten"
        ];

        const targetNumber =
            Number(targetToCall.id);

        if(
            !Number.isInteger(targetNumber) ||
            targetNumber < 1 ||
            targetNumber >= words.length
        ){
            return;
        }

        speechSynthesis.cancel();
        const utterance =
            new SpeechSynthesisUtterance(
                words[targetNumber]
            );

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
    }, 350);
}
    
//--------------------------
// START CAMERA FUNCTION
//--------------------------
async function startCamera(){
try{
stream=
await navigator.mediaDevices
.getUserMedia({
video:{
facingMode:{
ideal:"environment"
},
width:{
ideal:1280
},
height:{
ideal:720
}
},
audio:true
});

preview.srcObject=
stream;
preview.style.display = "block";
playback.style.display = "none";
preview.onloadedmetadata=()=>{
    preview.play();
    requestAnimationFrame(()=>{
        resizeEverything();
    });
};

}catch(err){
showCustomAlert(
"Unable to access camera"
);

console.log(err);
}
}

startCamera();
liveOverlayLoop();

overlay.addEventListener(
    "pointerdown",
    beginCalibrationDrag
);

overlay.addEventListener(
    "pointermove",
    updateCalibrationDrag
);

overlay.addEventListener(
    "pointerup",
    finishCalibrationDrag
);

//--------------------------
// RETURN TO LIVE FUNCTION
//--------------------------
function returnToLive(){
playbackSyncActive = false;
showRecordedHits = false;
playback.pause();
playback.currentTime = 0;

    //----------------------------------------
    // Return to live camera
    //----------------------------------------
preview.style.display = "block";
playback.style.display = "none";

    if(stream){
        preview.srcObject = stream;
    }

    clearOverlay();
    preview.play().catch(()=>{});
}

//------------------------------------------------
// RESIZE EVERYTHING FUNCTION
//------------------------------------------------
function resizeEverything(){
    const video =
        preview.style.display != "none"
            ? preview
            : playback;

    if(
        !video.videoWidth ||
        !video.videoHeight
    ){
        return;
    }

    //----------------------------------------
    // Actual camera dimensions
    //----------------------------------------
    cameraWidth =
        video.videoWidth;
    cameraHeight =
        video.videoHeight;

    //----------------------------------------
    // Video element rectangle
    //----------------------------------------
    const rect =
        video.getBoundingClientRect();
    const containerRect =
        video.parentElement.getBoundingClientRect();

    //----------------------------------------
    // calculate the ACTUAL visible camera
    // image inside the video element.
    //----------------------------------------
    const videoRatio =
        cameraWidth / cameraHeight;
    const elementRatio =
        rect.width / rect.height;

    let displayedWidth;
    let displayedHeight;

    if(elementRatio > videoRatio){
        displayedWidth =
            rect.width;
        displayedHeight =
            rect.width / videoRatio;

    }else{
        displayedHeight =
            rect.height;
        displayedWidth =
            rect.height * videoRatio;
    }

    //----------------------------------------
    // Position of actual camera image relative video element
    //----------------------------------------
    videoOffsetX =
        (rect.width - displayedWidth) / 2;
    videoOffsetY =
        (rect.height - displayedHeight) / 2;

    //----------------------------------------
    // Scale from camera pixels to displayed camera image
    //----------------------------------------
    videoScaleX =
        displayedWidth / cameraWidth;
    videoScaleY =
        displayedHeight / cameraHeight;

    //----------------------------------------
    // Overlay represents CAMERA coordinates
    //----------------------------------------
    overlay.width =
        cameraWidth;
    overlay.height =
        cameraHeight;

    //----------------------------------------
    // Position overlay over the actual visible camera image, NOT video element
    //----------------------------------------
    overlay.style.left =
        (
            rect.left -
            containerRect.left +
            videoOffsetX
        ) + "px";

    overlay.style.top =
        (
            rect.top -
            containerRect.top +
            videoOffsetY
        ) + "px";

    overlay.style.width =
        displayedWidth + "px";
    overlay.style.height =
        displayedHeight + "px";

    //----------------------------------------
    // Detection canvas
    //----------------------------------------
    const shortSide =
        Math.min(
            window.innerWidth,
            window.innerHeight
        );

    if(shortSide < 700){
        detectCanvas.width =
            480;
        detectCanvas.height =
            270;

    }else{
        detectCanvas.width =
            640;
        detectCanvas.height =
            360;
    }

    redrawOverlay();
}

//------------------------------------
// CLEAR OLD OVERLAY INFORMATION FUNCTION
//------------------------------------
function clearSessionData(){

    //------------------------------------
    // Clear recorded shots
    //------------------------------------
    hits = [];
    shots = 0;

    //------------------------------------
    // Reset laser detector
    //------------------------------------
    laserState = LASER_WAITING;
    laserMissingFrames = 0;
    freezeBackground = false;

    //------------------------------------
    // Reset live laser
    //------------------------------------
    currentLaserVisible = false;
    laserX = 0;
    laserY = 0;

    //--------------------------------
    // Clear overlay
    //--------------------------------
    ctx.clearRect(
        0,
        0,
        overlay.width,
        overlay.height
    );
}

//--------------------------------
// CLEAR TARGET INFORMATION FUNCTION
//--------------------------------
   function clearTargetData(){
    hits = [];
    shots = 0;
    groupCenter = null;
    currentLaserVisible = false;
    updateDisplays();
    redrawOverlay();
}

//--------------------------------
// DELETE ALL TARGETS FUNCTION
//--------------------------------
    function deleteAllTargets(){
    hits = [];
    shots = 0;
    groupCenter = null;
    targets = [];
    activeTarget = null;
    currentTarget = null;
    calibrationStep = 0;
    calibrationDragging = false;
    currentLaserVisible = false;
    resetGrid();
    updateDisplays();
    redrawOverlay();
}
    
//--------------------------
// COUNTDOWN FUNCTION
//--------------------------
function beginCountdown(){
    console.log("COUNTDOWN STARTED");
    setupControls.hidden = true;
    countdownRunning = true;
    let count;
    
    if(countdownSeconds === "random"){
        // Random whole number from 3 to 7 seconds
        count = Math.floor(Math.random() * 5) + 3;
    }else{
        count = countdownSeconds;
    }
    
    countdownValue = count;
    drawCountdown();
    
    countdownInterval = setInterval(()=>{
        count--;
        if(count > 0){
            countdownValue = count;
            drawCountdown();
        }else{
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownRunning = false;
            countdownValue = null;
            clearOverlay();
            drawHits();
            
            countdownSound.currentTime = 0;
            countdownSound.play().then(()=>{
                // The audio plays here, completely unaffected
            }).catch(err=>{
                console.log("Countdown sound failed:", err);
            });
            
            setTimeout(()=>{
                startRecording();
            },100);
        }
    },1000);
}


//--------------------------
// START RECORDING FUNCTION
//--------------------------
function startRecording(){
showRecordedHits = true;
countdownRunning = false;
recordedChunks=[];
hits=[];
shots=0;
recordingSeconds=0;

    //-------------------------------------
    // Reset Detector State
    //-------------------------------------
laserState = LASER_WAITING;
laserMissingFrames = 0;
freezeBackground = false;
backgroundFrame = null;
learnBackground = true;
lastShotTime = 0;
updateDisplays();

mediaRecorder=
new MediaRecorder(
stream
);

mediaRecorder
.ondataavailable=(e)=>{
if(
e.data.size>0
){

recordedChunks.push(
e.data
);
}
};

mediaRecorder
.onstop=
showPlayback;
mediaRecorder.start();

recordingStartTime = performance.now();
targetHistory = [];

if(activeTarget){
    targetHistory.push({
        id: activeTarget.id,
        time: 0
    });
}
    
    //-------------------------------------
    // Give camera one frame to stabilize
    //-------------------------------------
setTimeout(()=>{
    requestAnimationFrame(
        detectLaser
    );
},100);
timerInterval=
setInterval(()=>{
recordingSeconds++;
updateDisplays();
},1000);
}

//--------------------------
// STOP RECORDING FUNCTION
//--------------------------
function stopRecording(){
    if(
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ){

        mediaRecorder.stop();
    }

    clearInterval(timerInterval);

    // Return toolbar to Start state
    exitRecordingMode();
}

//--------------------------
// CLOSE SETTINGS FUNCTION
//--------------------------
function closeSettingsPanel(){
    settingsPanel.style.display = "none";
}
    
//--------------------------
// PLAYBACK FUNCTION
//--------------------------
function showPlayback(){
const blob=
new Blob(
recordedChunks,
{
type:"video/webm"
}
);

const url=
URL.createObjectURL(
blob
);

preview.style.display=
"none";
playback.style.display=
"block";
playback.src=url;

groupCenter = calculateGroupCenter();
playback.onloadedmetadata=()=>{
    resizeEverything();
    playback.play();
    requestAnimationFrame(
        syncPlayback
    );
};
}

//----------------------------------------
// DOWNLOAD VIDEO ONCLICK FUNCTION 
//----------------------------------------
downloadVideoBtn.onclick = async function(){
    if(
        !recordedChunks ||
        recordedChunks.length === 0
    ){
        showCustomAlert(
        "No recorded video is available."
    );
        return;
    }

        const blob =
        new Blob(
            recordedChunks,
            {
                type:"video/webm"
            }
        );

    const videoURL =
        URL.createObjectURL(blob);
    const exportVideo =
        document.createElement("video");
    exportVideo.src = videoURL;
    exportVideo.muted = true;
    exportVideo.playsInline = true;

    await new Promise((resolve, reject)=>{
        exportVideo.onloadedmetadata =
            resolve;
        exportVideo.onerror =
            reject;
    });

    const exportCanvas =
        document.createElement("canvas");
    exportCanvas.width =
        exportVideo.videoWidth;
    exportCanvas.height =
        exportVideo.videoHeight;

    const exportCtx =
        exportCanvas.getContext("2d");
    const exportStream =
        exportCanvas.captureStream(30);
    const exportRecorder =
        new MediaRecorder(
            exportStream,
            {
                mimeType:"video/webm"
            }
        );
    const exportChunks = [];
    exportRecorder.ondataavailable =
        event => {
            if(event.data.size > 0){
                exportChunks.push(
                    event.data
                );
            }
        };

    const recordingFinished =
        new Promise(resolve => {
            exportRecorder.onstop =
                resolve;
        });

    exportRecorder.start();
    exportVideo.currentTime = 0;
    await exportVideo.play();

//----------------------------------------
// RENDER EXPORT FRAME FUNCTION
//----------------------------------------
    function renderExportFrame(){
        if(
            exportVideo.paused ||
            exportVideo.ended
        ){

            exportRecorder.stop();
            return;
        }

        //------------------------------------
        // Draw video frame
        //------------------------------------
        exportCtx.drawImage(
            exportVideo,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height
        );

        //------------------------------------
        // Update existing overlay
        //------------------------------------
        redrawOverlay({
            maxTime:
                exportVideo.currentTime
        });

        //------------------------------------
        // Draw existing overlay onto export
        //------------------------------------
        exportCtx.drawImage(
            overlay,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height
        );

    //----------------------------------------
    // Draw shot markers onto export
    //----------------------------------------
for(const hit of hits){
    if(hit.time > exportVideo.currentTime){
        continue;
    }
    const drawX =
        hit.x * exportCanvas.width;
    const drawY =
        hit.y * exportCanvas.height;
    exportCtx.beginPath();
    exportCtx.arc(
        drawX,
        drawY,
        5,
        0,
        Math.PI * 2
    );

    //------------------------------------
    // Shot Marker Yellow center
    //------------------------------------
    exportCtx.fillStyle = "yellow";
    exportCtx.fill();

    //------------------------------------
    // Shot Marker Black outline
    //------------------------------------
    exportCtx.strokeStyle = "black";
    exportCtx.lineWidth = 2;
    exportCtx.stroke();
}

        requestAnimationFrame(
            renderExportFrame
        );
    }
    
    renderExportFrame();
    await recordingFinished;
    const finalBlob =
        new Blob(
            exportChunks,
            {
                type:"video/webm"
            }
        );

    const downloadURL =
        URL.createObjectURL(
            finalBlob
        );

    const link =
        document.createElement("a");
    link.href =
        downloadURL;
    link.download =
        "Laser-Training-Session-With-Shots.webm";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    //----------------------------------------
    // Cleanup
    //----------------------------------------
    setTimeout(()=>{
        URL.revokeObjectURL(
            videoURL
        );
        URL.revokeObjectURL(
            downloadURL
        );
    },1000);
};

//--------------------------
// UPDATE DISPLAYS FUNCTION
//--------------------------
function updateDisplays(){
let mins=
Math.floor(
recordingSeconds/60
)
.toString()
.padStart(2,"0");

let secs=
(recordingSeconds%60)
.toString()
.padStart(2,"0");

let time=
`${mins}:${secs}`;
timerOverlay.innerHTML=
time;
}

//------------------------------------------------
// BEGIN CALIBRATION DRAG FUNCTION
//------------------------------------------------
function beginCalibrationDrag(e){
    if(calibrationStep !== 1){
        return;
    }
const rect = overlay.getBoundingClientRect();
    calibrationDragging = true;
    calibrationStartX =
        (e.clientX - rect.left) / rect.width;
    calibrationStartY =
        (e.clientY - rect.top) / rect.height;
    calibrationCurrentX = calibrationStartX;
    calibrationCurrentY = calibrationStartY;
    currentTarget.calibrated = false;
}

//------------------------------------------------
// UPDATE CALIBRATION DRAG FUNCTION
//------------------------------------------------
function updateCalibrationDrag(e){
    if(!calibrationDragging){
        return;
    }
const rect = overlay.getBoundingClientRect();
    calibrationCurrentX =
        (e.clientX - rect.left) / rect.width;
    calibrationCurrentY =
        (e.clientY - rect.top) / rect.height;
    currentTarget.left =
        Math.min(calibrationStartX, calibrationCurrentX);
    currentTarget.right =
        Math.max(calibrationStartX, calibrationCurrentX);
    currentTarget.top =
        Math.min(calibrationStartY, calibrationCurrentY);
    currentTarget.bottom =
        Math.max(calibrationStartY, calibrationCurrentY);
    redrawOverlay();
}

//------------------------------------------------
// START DRAG CALIBRATION FUNCTION
//------------------------------------------------
async function calibrateTarget(){

    await showCustomAlert(
        "DRAW TARGET\n\n" +
        "Touch and drag to draw a box around your target."
    );

    currentTarget = {
        left:0,
        right:0,
        top:0,
        bottom:0,
        calibrated:false,
        shape:targetShape,
        id:targets.length + 1
    };

    calibrationStep = 1;
}

//------------------------------------------------
// COMPLETE DRAG CALIBRATION FUNCTION
//------------------------------------------------
function finishCalibrationDrag(e){
    if(!calibrationDragging){
        return;
    }

    calibrationDragging = false;
    if(calibrationStep === 0){
        return;
    }

    const rect =
        overlay.getBoundingClientRect();
    calibrationCurrentX =
        (e.clientX - rect.left) / rect.width;
    calibrationCurrentY =
        (e.clientY - rect.top) / rect.height;
    currentTarget.left =
        Math.min(
            calibrationStartX,
            calibrationCurrentX
        );

    currentTarget.right =
        Math.max(
            calibrationStartX,
            calibrationCurrentX
        );

    currentTarget.top =
        Math.min(
            calibrationStartY,
            calibrationCurrentY
        );

    currentTarget.bottom =
        Math.max(
            calibrationStartY,
            calibrationCurrentY
        );

    currentTarget.calibrated = true;
    currentTarget.shape =
        targetShape;
    currentTarget.active = true;
    targets.push(currentTarget);

    //----------------------------------------
    // First target becomes active
    //----------------------------------------
if(activeTarget === null){
    activeTarget =
        currentTarget;
}
    calibrationStep = 0;
    resizeEverything();
    redrawOverlay();
    showCustomAlert(
      "CALIBRATION COMPLETE\n\n" +
      "Your target has been added."
    );

    //----------------------------------------
    // Continuous Drawing
    //----------------------------------------
    if(continuousTargetDrawing){
        calibrateTarget();
    }
}

//------------------------------------------------
// TARGET PIXELS FUNCTION
//------------------------------------------------
function getTargetPixels(target){
    return{
        left:
            target.left *
            detectCanvas.width,
        right:
            target.right *
            detectCanvas.width,
        top:
            target.top *
            detectCanvas.height,
        bottom:
            target.bottom *
            detectCanvas.height
    };
}

//------------------------------------------------
// SET ACTIVE TARGET FUNCTION
//------------------------------------------------
function setActiveTarget(targetId){
    for(const target of targets){
        target.active =
            target.id === targetId;
    }

    redrawOverlay();
}
    
//------------------------------------------------
// DRAW GREEN BOXES FUNCTION
//------------------------------------------------
function drawGreenBoxes(){
    for(const target of targets){
        if(!target.calibrated){
            continue;
        }

        const targetIsActive =
            targetSelectionMode === "ALL"
                ? true
                : target === activeTarget;
        const left =
            normToOverlayX(target.left);
        const top =
            normToOverlayY(target.top);
        const width =
            normToOverlayX(target.right)
            - left;
        const height =
            normToOverlayY(target.bottom)
            - top;
        ctx.save();

        //----------------------------------------
        // Target outline
        //----------------------------------------
        ctx.strokeStyle =
            targetIsActive
                ? "#00FF00"
                : "#808080";
        ctx.lineWidth =
            Math.max(
                2,
                overlay.width * 0.003
            );

        if(target.shape === "rectangle"){
            ctx.strokeRect(
                left,
                top,
                width,
                height
            );

        }else{
            ctx.beginPath();
            ctx.ellipse(
                left + width / 2,
                top + height / 2,
                width / 2,
                height / 2,
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }

        //----------------------------------------
        // Draw target number
        //----------------------------------------
        ctx.fillStyle =
            targetIsActive
                ? "#00FF00"
                : "#666666";
        ctx.font =
            `bold ${overlay.width * .025}px Arial`;

        let label = target.id;

        ctx.fillText(
            label,
            left + 8,
            top + 28
        );

        ctx.restore();
    }

    //----------------------------------------
    // Draw target currently being dragged
    //----------------------------------------
    if(calibrationDragging){
        const left =
            normToOverlayX(
                currentTarget.left
            );
        const top =
            normToOverlayY(
                currentTarget.top
            );
        const width =
            normToOverlayX(
                currentTarget.right
            ) - left;
        const height =
            normToOverlayY(
                currentTarget.bottom
            ) - top;
        ctx.save();
        ctx.strokeStyle =
            "#00FF00";
        ctx.lineWidth =
            Math.max(
                2,
                overlay.width * 0.003
            );

        if(
            currentTarget.shape ===
            "rectangle"
        ){

            ctx.strokeRect(
                left,
                top,
                width,
                height
            );

        }else{
            ctx.beginPath();
            ctx.ellipse(
                left + width / 2,
                top + height / 2,
                width / 2,
                height / 2,
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
        ctx.restore();
    }
}

//------------------------------------------------
// NEXT TARGET FUNCTION
//------------------------------------------------
function nextTarget(){
    const availableTargets =
        targets.filter(
            target => target.calibrated
        );

    if(availableTargets.length === 0){
        return;
    }

    //----------------------------------------
    // Only one target
    //----------------------------------------
if(availableTargets.length === 1){
    if(activeTarget !== availableTargets[0]){
        activeTarget =
            availableTargets[0];
        callOutTargetNumber(activeTarget);
    }

    consecutiveShotCount = 0;
    redrawOverlay();
    return;
}

    //----------------------------------------
    // If Target RANDOM
    //----------------------------------------
    if(targetSelectionMode === "RANDOM"){
        let newTarget;
        do{
            const randomIndex =
                Math.floor(
                    Math.random() *
                    availableTargets.length
                );
            newTarget =
                availableTargets[randomIndex];
        }

        while(
            newTarget === activeTarget
        );

        if(activeTarget !== newTarget){
    activeTarget = newTarget;
    callOutTargetNumber(activeTarget);
}
    }


    //----------------------------------------
    // If Target CONSECUTIVE
    //----------------------------------------
    else if(
        targetSelectionMode === "CONSECUTIVE"
    ){
        const currentIndex =
            availableTargets.indexOf(
                activeTarget
            );
        let nextIndex;
        if(currentIndex === -1){
            nextIndex = 0;

        }else{
            nextIndex =
                currentIndex + 1;

            //--------------------------------
            // Wrap back to first target
            //--------------------------------
            if(
                nextIndex >=
                availableTargets.length
            ){

                nextIndex = 0;
            }
        }

        const newTarget =
        availableTargets[nextIndex];

        if(activeTarget !== newTarget){
        activeTarget =
        newTarget;

    callOutTargetNumber(activeTarget);
}

consecutiveShotCount = 0;
    }


    //----------------------------------------
    // If Target ALL
    //----------------------------------------
    else if(
        targetSelectionMode === "ALL"
    ){

        if(!activeTarget){
    activeTarget =
        availableTargets[0];

    callOutTargetNumber(activeTarget);
}
    }

    //----------------------------------------
    // Save target change for playback
    //----------------------------------------
    if(
    activeTarget &&
    targetSelectionMode !== "ALL"
    ){

    targetHistory.push({
        id: activeTarget.id,
        time:
            (
                performance.now() -
                recordingStartTime
            ) / 1000
    });
}

    redrawOverlay();
}

//------------------------------------------------
// GET ACTIVE TARGET FOR PLAYBACK FUNCTION
//------------------------------------------------
function getPlaybackActiveTarget(playbackTime){
    let targetId = null;

    for(const event of targetHistory){
        if(event.time <= playbackTime){
            targetId = event.id;
        }else{
            break;
        }
    }

    //----------------------------------------
    // Find matching target object
    //----------------------------------------
    if(targetId === null){
        return null;
    }

    return targets.find(
        target => target.id === targetId
    );
}
    
//------------------------------------------------
// CLEAR OVERLAY FUNCTION
//------------------------------------------------
function clearOverlay(){
    ctx.clearRect(
        0,
        0,
        overlay.width,
        overlay.height
    );

    if(!calibrationDragging){
        drawGreenBoxes();
    }
}

//------------------------------------------------
// DRAW COUNTDOWN FUNCTION 
//------------------------------------------------
function drawCountdown(){
    clearOverlay();
    drawHits();
    if(countdownValue === null){
        return;
    }
    ctx.save();
   ctx.font =
`bold ${overlay.width * .18}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "black";
    ctx.strokeText(
        countdownValue,
        overlay.width / 2,
        overlay.height / 2
    );
    
    ctx.fillStyle = "#FFD400";
    ctx.fillText(
        countdownValue,
        overlay.width / 2,
        overlay.height / 2
    );
    
    ctx.restore();
}

//------------------------------------------------
// SCAN ONE TARGET FUNCTION
//------------------------------------------------
function scanTarget(target, pixels){
    const box = getTargetPixels(target);
    let totalWeight = 0;
    let totalX = 0;
    let totalY = 0;
    let brightPixels = 0;
const laserMask = new Uint8Array(
    detectCanvas.width *
    detectCanvas.height
);

    //------------------------------------------------
    // Brightest laser pixel
    //------------------------------------------------
let brightestValue = -1;
let brightestX = 0;
let brightestY = 0;

    //------------------------------------------------
    // Reset grid brightness sums
    //------------------------------------------------
let gridTotal = [];
let gridCount = [];
    for(let gy=0; gy<GRID_ROWS; gy++){
        gridTotal[gy] = [];
        gridCount[gy] = [];
        for(let gx=0; gx<GRID_COLS; gx++){
            gridTotal[gy][gx] = 0;
            gridCount[gy][gx] = 0;
        }
    }

    //------------------------------------------------
    // Scan target
    //------------------------------------------------

    for(

        let y = Math.floor(box.top);

        y < Math.floor(box.bottom);

        y += DETECTOR.pixelStep

    ){

        const gridY = Math.max(

            0,

            Math.min(

                GRID_ROWS - 1,

                Math.floor(

                    ((y - box.top) * GRID_ROWS) /

                    (box.bottom - box.top)

                )

            )

        );

        for(

            let x = Math.floor(box.left);

            x < Math.floor(box.right);

            x += DETECTOR.pixelStep

        ){

            //----------------------------------------
            // Ignore pixels outside an oval target
            //----------------------------------------

            if(target.shape === "oval"){

                const centerX =
                    (box.left + box.right) / 2;

                const centerY =
                    (box.top + box.bottom) / 2;

                const radiusX =
                    (box.right - box.left) / 2;

                const radiusY =
                    (box.bottom - box.top) / 2;

                const dx =
                    (x - centerX) / radiusX;

                const dy =
                    (y - centerY) / radiusY;

                if((dx * dx + dy * dy) > 1){

                    continue;

                }

            }

            const i =

                (y * detectCanvas.width + x) * 4;

            const r = pixels[i];
            const g = pixels[i+1];
            const b = pixels[i+2];

            const brightness =

                (r + g + b) / 3;

            const gridX = Math.max(

                0,

                Math.min(

                    GRID_COLS - 1,

                    Math.floor(

                        ((x - box.left) * GRID_COLS) /

                        (box.right - box.left)

                    )

                )

            );

            gridTotal[gridY][gridX] += brightness;
            gridCount[gridY][gridX]++;

            const bgR = backgroundFrame[i];
            const bgG = backgroundFrame[i+1];
            const bgB = backgroundFrame[i+2];

            const redRise   = r - bgR;
            const greenRise = g - bgG;
            const blueRise  = b - bgB;

            const localBrightness =

                gridBrightness[gridY]?.[gridX] ?? 150;

            let localThreshold = DETECTOR.baseThreshold;

            if(localBrightness > 190){

                localThreshold += 6;

            }else if(localBrightness > 170){

                localThreshold += 3;

            }else if(localBrightness < 120){

                localThreshold -= 4;

            }

            const laser =

                redRise > localThreshold &&

                redRise >

                (greenRise + DETECTOR.colorDifference) &&

                redRise >

                (blueRise + DETECTOR.colorDifference);

            if(!laser){
                continue;
            }

    brightPixels++;

    laserMask[
    y * detectCanvas.width + x
    ] = 1;

    if(r > brightestValue){
    brightestValue = r;
    brightestX = x;
    brightestY = y;
}

    const weight =

    Math.max(
        brightness,
        r
    );

totalWeight += weight;

totalX += x * weight;

totalY += y * weight;

        }

    }

    //------------------------------------------------
    // Return scan results
    //------------------------------------------------

return{

    brightPixels,

    totalWeight,

    totalX,

    totalY,

    laserMask,

    brightestX,

    brightestY,

    brightestValue,

    gridTotal,

    gridCount

};
}

//------------------------------------------------
// SCAN ENTIRE FRAME
//------------------------------------------------

function scanEntireFrame(pixels){

    return scanTarget(
        {
            left:0,
            top:0,
            right:1,
            bottom:1,
            shape:"rectangle"
        },
        pixels
    );

}

//------------------------------------------------
// GROW CONNECTED LASER BLOB
//------------------------------------------------

function growLaserBlob(

    laserMask,

    startX,

    startY

){

    const width =
        detectCanvas.width;

    const height =
        detectCanvas.height;

    //----------------------------------------
    // Reject invalid seed
    //----------------------------------------

    if(

        startX < 0 ||

        startY < 0 ||

        startX >= width ||

        startY >= height

    ){

        return [];

    }

    if(

        !laserMask[
            startY * width + startX
        ]

    ){

        return [];

    }

    //----------------------------------------
    // Flood fill
    //----------------------------------------

    const stack = [];

    const blob = [];

    const visited =
        new Uint8Array(

            width * height

        );

    stack.push({

        x:startX,

        y:startY

    });

    while(stack.length){

        const p = stack.pop();

        const index =

            p.y * width + p.x;

        if(visited[index]){

            continue;

        }

        visited[index] = 1;

        if(!laserMask[index]){

            continue;

        }

        blob.push(p);

        //------------------------------------
        // 8-connected neighbours
        //------------------------------------

        for(

            let dy=-1;

            dy<=1;

            dy++

        ){

            for(

                let dx=-1;

                dx<=1;

                dx++

            ){

                if(

                    dx===0 &&

                    dy===0

                ){

                    continue;

                }

                const nx =

                    p.x + dx;

                const ny =

                    p.y + dy;

                if(

                    nx<0 ||

                    ny<0 ||

                    nx>=width ||

                    ny>=height

                ){

                    continue;

                }

                stack.push({

                    x:nx,

                    y:ny

                });

            }

        }

    }

    return blob;

}

//------------------------------------------------
// CALCULATE BLOB CENTER
//------------------------------------------------

function calculateBlobCenter(blob){

    if(blob.length === 0){

        return null;

    }

    let sumX = 0;
    let sumY = 0;

    for(const p of blob){

        sumX += p.x;
        sumY += p.y;

    }

    return{

        x: sumX / blob.length,

        y: sumY / blob.length

    };

}

//------------------------------------------------
// VALIDATE LASER BLOB
//------------------------------------------------

function validateBlob(

    blob,

    brightestValue

){

    //----------------------------------------
    // Reject empty blob
    //----------------------------------------

    if(blob.length === 0){

        return false;

    }

    //----------------------------------------
    // Reject blobs that are too small
    //----------------------------------------

    if(blob.length < 4){

        return false;

    }

    //----------------------------------------
    // Reject blobs that are too large
    //----------------------------------------

    if(blob.length > DETECTOR.maxBlobPixels){

        return false;

    }

    //----------------------------------------
    // Brightest pixel must be reasonably bright
    //----------------------------------------

    if(brightestValue < 150){

        return false;

    }

    return true;

}

//------------------------------------------------
// LASER DETECTION -->
//------------------------------------------------

function detectLaser(){

    if(
        !mediaRecorder ||
        mediaRecorder.state !== "recording"
    ){
        return;
    }


    //---------------------------------------
    // Copy current frame
    //---------------------------------------

    detectCtx.drawImage(
        preview,
        0,
        0,
        detectCanvas.width,
        detectCanvas.height
    );

    const frame = detectCtx.getImageData(
        0,
        0,
        detectCanvas.width,
        detectCanvas.height
    );

    const pixels = frame.data;

    //---------------------------------------
    // Learn background frame
    //---------------------------------------

if(learnBackground){
    backgroundFrame = new Uint8ClampedArray(pixels);
    learnBackground = false;
    requestAnimationFrame(detectLaser);
    return;
}

if(!backgroundFrame){
    requestAnimationFrame(detectLaser);
    return;
}

//------------------------------------------------
// TARGET SELECTION
//------------------------------------------------

let result = null;
let hitTarget = null;

const availableTargets = targets.filter(
    target => target.calibrated
);

const hasTarget = availableTargets.length > 0;


//------------------------------------------------
// NO TARGETS
//------------------------------------------------

if(!hasTarget){

    //----------------------------------------
    // Treat the whole camera image as one target
    //----------------------------------------

    result = scanEntireFrame(pixels);

    if(
        result.brightPixels >= DETECTOR.minBlobPixels &&
        result.brightPixels <= DETECTOR.maxBlobPixels
    ){

        hitTarget = {
            id: "FULL_FRAME"
        };

    }

}


//------------------------------------------------
// TARGETS EXIST
//------------------------------------------------

else{


    //----------------------------------------
    // ALL MODE
    //
    // Every calibrated target is active.
    //----------------------------------------

    if(targetSelectionMode === "ALL"){

        for(const target of availableTargets){

            const scanResult = scanTarget(
                target,
                pixels
            );

            if(
                scanResult.brightPixels >=
                    DETECTOR.minBlobPixels &&
                scanResult.brightPixels <=
                    DETECTOR.maxBlobPixels
            ){

                hitTarget = target;
                result = scanResult;

                break;

            }

        }

    }


    //----------------------------------------
    // CONSECUTIVE or RANDOM
    //
    // Only the current active target is scanned.
    //----------------------------------------

    else{

        if(
            activeTarget &&
            activeTarget.calibrated
        ){

            result = scanTarget(
                activeTarget,
                pixels
            );

            if(
                result.brightPixels >=
                    DETECTOR.minBlobPixels &&
                result.brightPixels <=
                    DETECTOR.maxBlobPixels
            ){

                hitTarget = activeTarget;

            }

        }

    }

}
    
if(hitTarget){
}

//------------------------------------------------
// Copy scan results
//------------------------------------------------

let brightPixels =
    result?.brightPixels ?? 0;
let totalWeight =
    result?.totalWeight ?? 0;
let totalX =
    result?.totalX ?? 0;
let totalY =
    result?.totalY ?? 0;

let laserMask =
    result?.laserMask ?? null;
    
let brightestX =
    result?.brightestX ?? 0;
let brightestY =
    result?.brightestY ?? 0;
let brightestValue =
    result?.brightestValue ?? 0;
    
let gridTotal =
    result?.gridTotal ?? [];
let gridCount =
    result?.gridCount ?? [];

//------------------------------------------------
// Update grid brightness map
//------------------------------------------------

if(result){

    for(let gy=0; gy<GRID_ROWS; gy++){
    for(let gx=0; gx<GRID_COLS; gx++){

if(gridCount[gy][gx] > 0){
    const average =
            gridTotal[gy][gx] /
            gridCount[gy][gx];
            gridBrightness[gy][gx] = average;

            }
        }
    }
}
    
    //---------------------------------------
    // No Laser Detected
    //---------------------------------------

if(
    brightPixels < DETECTOR.minBlobPixels ||
    brightPixels > DETECTOR.maxBlobPixels
){
    laserMissingFrames++;

    //------------------------------------
    // Return to WAITING only after the
    // laser has been gone several frames.
    //------------------------------------

if(
    laserMissingFrames >=
    LASER_RELEASE_FRAMES
){

    laserState = LASER_WAITING;
    freezeBackground = false;
    laserMissingFrames =
        LASER_RELEASE_FRAMES;
}

    //------------------------------------
    // Keep previously recorded hits visible
    //------------------------------------

currentLaserVisible = false;
    redrawOverlay();
    requestAnimationFrame(
        detectLaser
    );
    return;
}
    
    //---------------------------------------
    // Find centre
    //---------------------------------------

//---------------------------------------
// Build connected laser blob
//---------------------------------------
const blob = growLaserBlob(
    laserMask,
    brightestX,
    brightestY
);

const blobCenter =
    calculateBlobCenter(blob);
const blobValid =
    validateBlob(
        blob,
        brightestValue
    );

//---------------------------------------
// Use blob center if valid
//---------------------------------------
const hitX =
    blobValid
        ? blobCenter.x
        : totalX / totalWeight;
const hitY =
    blobValid
        ? blobCenter.y
        : totalY / totalWeight;
    
    //---------------------------------------
    // Laser is currently being tracked
    //---------------------------------------
laserMissingFrames = 0;

// Draw the live laser every frame
drawCurrentLaser(hitX, hitY);

//---------------------------------------
// STATE MACHINE -->
//---------------------------------------

if(laserState === LASER_WAITING){
    laserState = LASER_TRACKING;
    freezeBackground = true;
    laserMissingFrames = 0;

    const now = performance.now();

    if(now - lastShotTime >= DETECTOR.shotDelay){
        lastShotTime = now;
        shots++;
        
    const savedX =
    detectorToNormX(hitX);
    const savedY =
    detectorToNormY(hitY);

hits.push({
    x: savedX,
    y: savedY,
    time:
        (performance.now() - recordingStartTime) / 1000
});

updateDisplays();
playHitSound();

//------------------------------------------------
// TARGET SELECTION ADVANCEMENT
//------------------------------------------------

// ALL
//
// Every target remains active.
// Do not change activeTarget.
//
if(targetSelectionMode === "ALL"){
}


//------------------------------------------------
// RANDOM Pick another target after every shot
//------------------------------------------------
else if(targetSelectionMode === "RANDOM"){



    if(!waitingForNextTarget){
        waitingForNextTarget = true;
        setTimeout(
            ()=>{
                nextTarget();
                waitingForNextTarget = false;
            },
            250
        );
    }
}

//------------------------------------------------
// CONSECUTIVE current target until required number of shots
//------------------------------------------------
else if(targetSelectionMode === "CONSECUTIVE"){

    consecutiveShotCount++;


    if(
        consecutiveShotCount >=
        consecutiveShotsPerTarget
    ){

        consecutiveShotCount = 0;
        if(!waitingForNextTarget){
            waitingForNextTarget = true;
            setTimeout(
                ()=>{
                    nextTarget();
                    waitingForNextTarget = false;
                },
                250
            );
        }
    }
}
    }   

}else{

    // Laser is already being tracked - DO NOT record shot
    laserMissingFrames = 0;
}
    requestAnimationFrame(
        detectLaser
    );
}

//------------------------------------------------
// DRAW HITS FUNCTION
//------------------------------------------------
function drawHits(maxTime = Infinity){
    if(hits.length > 0){
}

    //----------------------------------------
    // Draw every saved hit up to maxTime
    //----------------------------------------
   for(const hit of hits){
        if(hit.time > maxTime){
            continue;
        }
    const drawX =
    normToOverlayX(hit.x);
    const drawY =
    normToOverlayY(hit.y);
        ctx.beginPath();
       if(hit.time === hits[hits.length-1].time){
} 
       
       ctx.arc(
            drawX,
            drawY,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "yellow";
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
}
    
//------------------------------------------------
// CALCULATE GROUP CENTER FUNCTION
//------------------------------------------------
function calculateGroupCenter(){

    //----------------------------------------
    // No shots recorded
    //----------------------------------------
    if(hits.length === 0){
        return null;
    }

    //----------------------------------------
    // Add all shot locations
    //----------------------------------------
    let totalX = 0;
    let totalY = 0;
    for(const hit of hits){
        totalX += hit.x;
        totalY += hit.y;
    }

    //----------------------------------------
    // Return average location
    //----------------------------------------
    return{
        x: totalX / hits.length,
        y: totalY / hits.length
    };
}

//------------------------------------------------
// REDRAW OVERLAY FUNCTION
//------------------------------------------------
function redrawOverlay({
    maxTime = Infinity
} = {}){
    clearOverlay();

//----------------------------------------
// Playback active target
//----------------------------------------
let savedActiveTarget = activeTarget;
if(maxTime !== Infinity){
    const playbackTarget =
        getPlaybackActiveTarget(
            maxTime
        );
    if(playbackTarget){
        activeTarget = playbackTarget;
    }
}
    
    //----------------------------------------
    // Draw all targets
    //----------------------------------------
    drawGreenBoxes();

    //----------------------------------------
    // Draw recorded hits
    //----------------------------------------
    if(showRecordedHits){
        drawHits(maxTime);
}

    //----------------------------------------
    // Restore live active target
    //----------------------------------------
    activeTarget = savedActiveTarget;
    
    //----------------------------------------
    // Draw countdown if active
    //----------------------------------------
    if(countdownValue !== null){
        ctx.save();
       ctx.font =
`bold ${overlay.width * .18}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "black";
        ctx.strokeText(
            countdownValue,
            normToOverlayX(.5),
            normToOverlayY(.5)
        );

        ctx.fillStyle = "#FFD400";
        ctx.fillText(
            countdownValue,
            normToOverlayX(.5),
            normToOverlayY(.5)
        );
        
        ctx.restore();
    }

    //----------------------------------------
    // Draw current laser
    //----------------------------------------

    if(currentLaserVisible){
        ctx.beginPath();
    const laserRadius =
        overlay.width * .006;

ctx.arc(
    normToOverlayX(currentLaserX),
    normToOverlayY(currentLaserY),
    8,
    0,
    Math.PI * 2
);

ctx.strokeStyle = "red";
ctx.lineWidth =
Math.max(
2,
overlay.width * .002
);
    ctx.stroke();
}

    //----------------------------------------
    // Draw group center
    //----------------------------------------
if(
    analysisEnabled &&
    groupCenter &&
    playback.style.display != "none"
){
    const centerX =
    normToOverlayX(groupCenter.x);
    const centerY =
    normToOverlayY(groupCenter.y);
   
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    //----------------------------------------
    // Horizontal line
    //----------------------------------------
ctx.beginPath();
const crossSize =
overlay.width * .025;

ctx.moveTo(
centerX - crossSize,
centerY
);

ctx.lineTo(
centerX + crossSize,
centerY
);
ctx.stroke();

    //----------------------------------------
    // Vertical line
    //----------------------------------------
ctx.beginPath();
ctx.moveTo(
centerX,
centerY - crossSize
);

ctx.lineTo(
centerX,
centerY + crossSize
);
ctx.stroke();
    
    //----------------------------------------
    // White center dot
    //----------------------------------------
    ctx.beginPath();
    ctx.arc(
        centerX,
        centerY,
        crossSize * .25,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.stroke();
}
}

//------------------------------------------------
// UPDATE CURRENT LASER FUNCTION
//------------------------------------------------
function drawCurrentLaser(hitX, hitY){

    //----------------------------------------
    // Store normalized detector coordinates
    //----------------------------------------
    currentLaserX =
        hitX / detectCanvas.width;
    currentLaserY =
        hitY / detectCanvas.height;
    currentLaserVisible = true;
}

drawTargetBtn.onclick = () => {
    continuousTargetDrawing = true;
    settingsPanel.style.display = "none";
    calibrateTarget();
};

drillDrawTargetBtn.onclick = () => {
    continuousTargetDrawing = true;
    drillsPanel.style.display = "none";
    calibrateTarget();
};

//------------------------------------------------
// LIVE OVERLAY LOOP FUNCTION
//------------------------------------------------

function liveOverlayLoop(){

    // Only run while viewing the live camera
    if(preview.style.display != "none"){
        redrawOverlay();
    }
    requestAnimationFrame(liveOverlayLoop);
}


//------------------------------------------------
// SYNC PLAYBACK FUNCTION
//------------------------------------------------
function syncPlayback(){

if(
playback.paused ||
playback.ended
){
return;
}
redrawOverlay({
    maxTime: playback.currentTime
});

let t=
Math.floor(
playback.currentTime
);

let mins=
Math.floor(
t/60
)

.toString()
.padStart(
2,
"0"
);

let secs=
(t%60)
.toString()
.padStart(
2,
"0"
);

timerOverlay.innerHTML=
`${mins}:${secs}`;

requestAnimationFrame(
syncPlayback
);
}


//--------------------------
// ENTER RECORDING MODE FUNCTION
//--------------------------

function enterRecordingMode(){

    closeSettingsPanel();
    
    // Hide Start button
    startBtn.hidden = true;

    // Show Stop button
    stopBtn.hidden = false;

    // Hide setup controls
    setupControls.hidden = true;

    // Hide Drills button
    drillsBtn.hidden = true;

    // Close Settings popup
    settingsPanel.style.display = "none";

}

//--------------------------
// EXIT RECORDING MODE FUNCTION
//--------------------------

function exitRecordingMode(){

    // Show Start button
    startBtn.hidden = false;

    // Hide Stop button
    stopBtn.hidden = true;

    // Restore setup controls
    setupControls.hidden = false;

    // Restore Drills button
    drillsBtn.hidden = false;

    // Always leave Settings popup closed
    settingsPanel.style.display = "none";

}

//--------------------------
// CREATE PDF SUMMARY FUNCTION
//--------------------------

function createPDFSummary(logo){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
});
  
//--------------------------------
// REPORT HEADER
//--------------------------------

// Draw logo
pdf.addImage(
    logo,
    "PNG",
    15,
    10,
    55,
    12
);

// Report title
pdf.setFont(
    "helvetica",
    "bold"
);

pdf.setFontSize(28);
pdf.text(
    "Laser Training Report",
    85,
    18
);

// Divider line
pdf.setLineWidth(0.5);
pdf.line(
    15,
    30,
    195,
    30
);

//--------------------------------
// DRILL STATISTICS
//--------------------------------

if(selectedDrill){
    pdf.setFontSize(24);
    
    pdf.text(
        "Drill: " + selectedDrill.name,
        20,
        43
    );
}

else{
    pdf.setFontSize(24);
    
    pdf.text(
        "Open Shoot - No Drill Selected",
        20,
        43
    );
}
    pdf.setFontSize(16);
    
    pdf.text(
        "Shots Fired: " +
       hits.length,
        20,
        55
    );

//--------------------------------
// SESSION STATISTICS
//--------------------------------

let totalTime = 0;
let averageSplit = 0;
let fastestSplit = 0;
let slowestSplit = 0;

if(hits.length > 0){
    totalTime =
        hits[hits.length - 1].time;

if(hits.length > 1){
        let splits = [];
        for(let i = 1; i < hits.length; i++){

            splits.push(
                hits[i].time -
                hits[i-1].time
            );
        }

        averageSplit =
            splits.reduce(
                (a,b)=>a+b,
                0
            ) / splits.length;

        fastestSplit =
            Math.min(...splits);

        slowestSplit =
            Math.max(...splits);
    }
}

// Add statistics to PDF
pdf.text(
    "Total Time: " +
    totalTime.toFixed(2) +
    " sec",
    20,
    65
);

pdf.text(
    "Average Split: " +
    averageSplit.toFixed(2) +
    " sec",
    20,
    75
);

pdf.text(
    "Fastest Split: " +
    fastestSplit.toFixed(2) +
    " sec",
    20,
    85
);

pdf.text(
    "Slowest Split: " +
    slowestSplit.toFixed(2) +
    " sec",
    20,
    95
);

//----------------------------------------
// REBUILD OVERLAY FOR PDF EXPORT
//----------------------------------------
const savedShowRecordedHits =
    showRecordedHits;
showRecordedHits = true;
redrawOverlay();
showRecordedHits =
    savedShowRecordedHits;
    
//-----------------------------
// ADD COMBINED TARGET PDF IMAGE
//-----------------------------
const exportCanvas =
    document.createElement("canvas");
exportCanvas.width =
    overlay.width;
exportCanvas.height =
    overlay.height;
const exportCtx =
    exportCanvas.getContext("2d");

// Draw the video image first
exportCtx.drawImage(
    playback,
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
);

// Draw the shot overlay on top
exportCtx.drawImage(
    overlay,
    0,
    0
);

const targetImage =
    exportCanvas.toDataURL(
        "image/png"
    );

//--------------------------------
// PDF TARGET IMAGE
//--------------------------------
pdf.setDrawColor(0);
pdf.setLineWidth(0.4);
pdf.roundedRect(
    18,
    113,
    174,
    99,
    2,
    2
);

//--------------------------------
// FIT TARGET PDF IMAGE WITHOUT STRETCHING
//--------------------------------
const boxX = 20;
const boxY = 115;
const boxW = 170;
const boxH = 95;
// Original image dimensions
const imageW =
    exportCanvas.width;
const imageH =
    exportCanvas.height;
const imageAspect =
    imageW / imageH;
const boxAspect =
    boxW / boxH;
let drawW;
let drawH;

//--------------------------------
// PDF LANDSCAPE / WIDE IMAGE
//--------------------------------
if(imageAspect >= boxAspect){
    drawW = boxW;
    drawH =
        boxW / imageAspect;
}

//--------------------------------
// PDF PORTRAIT / TALL IMAGE
//--------------------------------
else{
    drawH = boxH;
    drawW =
        boxH * imageAspect;
}

//--------------------------------
// PDF CENTER IMAGE IN BOX
//--------------------------------
const drawX =
    boxX +
    (boxW - drawW) / 2;

const drawY =
    boxY +
    (boxH - drawH) / 2;

//--------------------------------
// PDF DRAW IMAGE
//--------------------------------
pdf.addImage(
    targetImage,
    "PNG",
    drawX,
    drawY,
    drawW,
    drawH
);

//----------------------------------------
// Average Point of Impact Analysis
//----------------------------------------
if(
    analysisBtn &&
    analysisBtn.checked &&
    hits.length > 0
){

    //------------------------------------
    // Calculate average normalized X/Y
    //------------------------------------
    let averageX = 0;
    let averageY = 0;
    for(const hit of hits){
        averageX += hit.x;
        averageY += hit.y;
    }
    averageX =
        averageX / hits.length;
    averageY =
        averageY / hits.length;

    //------------------------------------
    // Convert normalized coordinates 
    //------------------------------------
const poiX =
    drawX +
    (averageX * drawW);
const poiY =
    drawY +
    (averageY * drawH);

    //------------------------------------
    // Draw PDF Average Point of Impact marker
    //------------------------------------

    pdf.setDrawColor(
        255,
        0,
        0
    );

    pdf.setLineWidth(0.7);

    // Horizontal line
    pdf.line(
        poiX - 5,
        poiY,
        poiX + 5,
        poiY
    );

    // Vertical line
    pdf.line(
        poiX,
        poiY - 5,
        poiX,
        poiY + 5
    );

    // Center circle
    pdf.circle(
        poiX,
        poiY,
        2,
        "S"
    );

    //------------------------------------
    // PDF Label
    //------------------------------------

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(8);
    pdf.text(
        "Average Point of Impact",
        poiX + 6,
        poiY - 4
    );
}

pdf.setFontSize(11);
    
pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Target Image",
    20,
    110
);

//--------------------------------
// Test Vector Drawing
//--------------------------------
pdf.setDrawColor(255,0,0);
pdf.setLineWidth(0.75);
pdf.rect(
    20,
    115,
    170,
    95
);

//--------------------------------
// Shot Details Table
//--------------------------------
let tableY = 220;

//--------------------------------
// DRAW PDF TABLE HEADER FUNCTION
//--------------------------------
function drawShotTableHeader(){

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(11);

    pdf.text(
        "Shot",
        20,
        tableY
    );

    pdf.text(
        "Time",
        45,
        tableY
    );

    pdf.text(
        "Split",
        75,
        tableY
    );

    pdf.text(
        "X",
        110,
        tableY
    );

    pdf.text(
        "Y",
        140,
        tableY
    );

    pdf.setFont(
        "helvetica",
        "normal"
    );
}

//--------------------------------
// Draw First Table Header
//--------------------------------
drawShotTableHeader();

//--------------------------------
// Draw Shot Rows
//--------------------------------
pdf.setFontSize(10);
hits.forEach((hit,index)=>{

    //--------------------------------
    // Check for Page Bottom
    //--------------------------------
    if(
        tableY >=
        pdf.internal.pageSize.getHeight() - 25
    ){

        //--------------------------------
        // Create New Page
        //--------------------------------
        pdf.addPage();

        //--------------------------------
        // Reset Table Position
        //--------------------------------
        tableY = 25;

        //--------------------------------
        // Page 2+ Title
        //--------------------------------
        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(14);
        pdf.text(
            "Shot Details — Continued",
            20,
            tableY
        );
        
        tableY += 12;

    //--------------------------------
    // Draw Column Headers Again
    //--------------------------------
    drawShotTableHeader();
    }


    //--------------------------------
    // Move To Next Row
    //--------------------------------
    tableY += 8;

    //--------------------------------
    // Calculate Split
    //--------------------------------
    let split = 0;
    if(index > 0){
        split =
            hit.time -
            hits[index-1].time;
    }

    //--------------------------------
    // Draw Shot Number
    //--------------------------------
    pdf.text(
        String(index + 1),
        20,
        tableY
    );

    //--------------------------------
    // Draw Time
    //--------------------------------
    pdf.text(
        hit.time.toFixed(2),
        45,
        tableY
    );

    //--------------------------------
    // Draw Split
    //--------------------------------
    pdf.text(
        split.toFixed(2),
        75,
        tableY
    );

    //--------------------------------
    // Draw X
    //--------------------------------
    pdf.text(
        hit.x.toFixed(3),
        110,
        tableY
    );

    //--------------------------------
    // Draw Y
    //--------------------------------
    pdf.text(
        hit.y.toFixed(3),
        140,
        tableY
    );
});

//--------------------------------
// PDF FOOTER
//--------------------------------
const totalPages =
    pdf.internal.getNumberOfPages();
const pageWidth =
    pdf.internal.pageSize.getWidth();
const pageHeight =
    pdf.internal.pageSize.getHeight();
const generatedDate =
    new Date().toLocaleString();

// Add footer to EVERY page
for(
    let page = 1;
    page <= totalPages;
    page++
){

    pdf.setPage(page);

    // Footer divider
    pdf.setLineWidth(0.3);
    pdf.line(
        15,
        pageHeight - 12,
        pageWidth - 15,
        pageHeight - 12
    );

    // Footer text
    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(9);

    // Generated date - left
    pdf.text(
        "Generated: " +
        generatedDate,
        15,
        pageHeight - 6
    );

    // Page number - right
    pdf.text(
        "Page " +
        page +
        " of " +
        totalPages,
        pageWidth - 15,
        pageHeight - 6,
        {
            align:"right"
        }
    );
}

//--------------------------
// SAVE PDF
//--------------------------    
    pdf.save(
        "Safe_Insight_Training_Summary.pdf"
    );
}

//--------------------------
// SET APP MODE FUNCTION
//--------------------------
function setAppMode(mode){
    appMode = mode;
    switch(mode){
        case APP_SETUP:
            exitRecordingMode();
            break;
        case APP_COUNTDOWN:
            exitRecordingMode();
            break;
        case APP_RECORDING:
            enterRecordingMode();
            break;
        case APP_PLAYBACK:
            exitRecordingMode();
            break;
    }
}

//--------------------------
// Start Button OnClick
//--------------------------
startBtn.onclick = ()=>{
    console.log("START BUTTON CLICKED");

    continuousTargetDrawing = false;
    const drillsPanel =
        document.getElementById("drillsPanel");
    if(drillsPanel){
        drillsPanel.style.display = "none";
    }

    settingsPanel.style.display = "none";
    setAppMode(APP_RECORDING);
    clearSessionData();

//--------------------------
// Stop Button OnClick
//--------------------------
stopBtn.onclick = ()=>{
    console.log("STOP BUTTON CLICKED");

    if(countdownRunning){
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownRunning = false;
        countdownValue = null;
        clearOverlay();
        drawHits();
        exitRecordingMode();
        console.log("COUNTDOWN CANCELLED");
        return;
    }

    // Otherwise stop active recording
    stopRecording();
};
    
//------------------------------------------------
// CLEAR ALL TARGETS FUNCTION
//------------------------------------------------
function clearTargets(){
    targets = [];
    currentTarget = null;
    redrawOverlay();
}
    playback.pause();
    playback.src = "";
    preview.style.display = "block";
    playback.style.display = "none";
    setupControls.hidden = true;

beginCountdown();
};

analysisBtn.onchange=()=>{
    analysisEnabled =
        analysisBtn.checked;
};

sensitivitySelect.onchange = ()=>{
    laserSensitivity = sensitivitySelect.value;
    switch(laserSensitivity){
        case "normal":
            DETECTOR.baseThreshold = 30;
            DETECTOR.colorDifference = 22;
            break;
        case "medium":
            DETECTOR.baseThreshold = 22;
            DETECTOR.colorDifference = 16;
            break;
        case "high":
            DETECTOR.baseThreshold = 12;
            DETECTOR.colorDifference = 8;
            break;
    }


};
    
targetShapeSelect.onchange = ()=>{
    targetShape =
        targetShapeSelect.value;
    redrawOverlay();
};

countdownSelect.onchange = ()=>{
    if(countdownSelect.value === "random"){
        countdownSeconds = "random";
    }else{
        countdownSeconds =
            Number(countdownSelect.value);
    }
};

distanceSelect.onchange = ()=>{
    targetDistance =
        Number(distanceSelect.value);
};

//--------------------------------
// Settings Button OnClick
//--------------------------------
settingsBtn.onclick=()=>{
    returnToLive();
    continuousTargetDrawing = false;
    if(settingsPanel.style.display=="block"){
        settingsPanel.style.display="none";
    }

    else{
        settingsPanel.style.display="block";
    }

    const drillsPanel =
        document.getElementById("drillsPanel");
    if(drillsPanel){
        drillsPanel.style.display="none";
    }
};

//------------------------------------------------
// DRILLS TO USE ARRAY
//------------------------------------------------
const drills = [

    {
        name: "Single Shot Accuracy",
        setup:
            "Draw one target near the center of the screen.",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire one deliberate shot<br>&bull; Reset and repeat<br>&bull; Fire ten (10) shots total",
        goal:
            "Build consistent trigger control."
    },

    {
        name: "Five Shot Group",
        setup:
            "Draw one target near middle of screen.",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire five (5) slow, controlled shots without rushing",
        goal:
            "Increase precision with trigger press."
    },

    {
        name: "Controlled Pair",
        setup:
            "Draw one target on the screen.",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire two (2) accurate shots as quickly as you can<br>&bull; Maintain control keeping shots close together",
        goal:
            "Improve trigger press and follow-up shot speed."
    },

    {
        name: "Failure Drill",
        setup:
            "&bull; Draw one large rectangle target (body)<br>&bull; Change Target Shape to OVAL<br>&bull; Draw small circle (head) above rectangle",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire two (2) shots to center of body<br>&bull; Immediately follow with one (1) shot to the head",
        goal:
            "Develop rapid target transitions and shot placement."
    },

 {
        name: "Target Transition",
        setup:
            "Draw three targets with even space between them.",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire one (2) shots on each target from left to right<br>&bull; Reverse direction on the next run",
        goal:
            "Improve eye speed and muzzle transitions."
    },
    
    {
        name: "Transition Advanced",
        setup:
            "&bull; Draw three targets with even space between them<br>&bull; Click Target Selection<br>&bull; Choose CONSECUTIVE<br>&bull; Click Shots Per Target<br>&bull; Choose NUMBER",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire chosen # of shots on each target that gets called",
        goal:
            "Improve eye speed and muzzle transitions."
    },

    {
        name: "Near to Far",
        setup:
            "&bull; Draw one large target (near)<br>&bull; Draw one small target (far)<br>&bull; Click Target Selection<br>&bull; Choose CONSECUTIVE<br>&bull; Click Shots Per Target<br>&bull; Choose NUMBER",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire chosen # of shot(s) until target changes<br>&bull; Repeat",
        goal:
            "Improve sight adjustment between different target sizes."
    },

    {
        name: "Box Drill",
        setup:
            "&bull; Draw four square targets clockwise<br>&bull; Squares should be in the rough shape of a large square<br>&bull; Click Target Selection&bull; Choose CONSECUTIVE&bull;  Select Shots Per Target&bull; Choose NUMBER",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire chosen # of shot(s) on each target in clockwise order",
        goal:
            "Develop smooth movement between multiple targets."
    },

    {
        name: "Reload Drill",
        setup:
            "Draw one target on screen",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire five (5) shots<br>&bull; Take a step to right<br>&bull; Perform a reload<br>&bull; Fire five (5) more shots<br>&bull; Take a step to left<br>&bull; Perform a reload<br>&bull; Fire five (5) more shots",
        goal:
            "Increase reload efficiency while instilling movement into process."
    },

    {
        name: "Draw to First Shot",
        setup:
            "Draw one target on screen.",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Begin from your normal ready position<br>&bull; Draw and fire one accurate shot as quickly as possible",
        goal:
            "Reduce first-shot time while maintaining accuracy."
    },

    {
        name: "Dot Torture",
        setup:
            "&bull; Draw up to nine (9) small circle targets (dots)<br>&bull; Each one should be about the size of a dime<br>&bull; Click Target Selection to RANDOM or CONSECUTIVE<br>&bull; Select Shots Per Target<br>&bull; Choose NUMBER",
        execution:
            "&bull; Click Start<br>&bull; Wait for beep<br>&bull; Fire chosen # of shot(s) at each dot without rushing",
        goal:
            "Develop extreme precision and trigger control."
    }
];


//------------------------------------------------
// Build Drills Dropdown
//------------------------------------------------

const drillSelect =
    document.getElementById("drillSelect");

const drillWrapper =
    document.querySelector(
        "#drillsPanel .custom-select-wrapper"
    );

const drillTrigger =
    drillWrapper.querySelector(
        ".select-trigger"
    );

const drillOptionsPanel =
    drillWrapper.querySelector(
        ".custom-options-panel"
    );

const drillInfo =
    document.getElementById("drillInfo");

drills.forEach((drill, index) => {

    // Add to hidden native select
    const option =
        document.createElement("option");
    option.value = index;
    option.textContent = drill.name;
    drillSelect.appendChild(option);

    // Add to visible custom dropdown
    const item =
        document.createElement("div");
    item.className =
        "custom-option-item";
    item.dataset.value =
        index;
    item.textContent =
        drill.name;
    drillOptionsPanel.appendChild(item);

//--------------------------------
// When Clicked Save Selected Drill
//--------------------------------
item.addEventListener("click", () => {
    selectedDrill = drill;
    drillSelect.value =
        index;
    drillTrigger.textContent =
        drill.name;
        drillWrapper.classList.remove(
            "open"
        );

        drillInfo.innerHTML = `
            <div style="
                font-size:20px;
                font-weight:bold;
                color:#ff0000;
                margin-bottom:15px;
            ">
                ${drill.name}
            </div>
            <div>
                <strong>SETUP</strong>
            </div>
            <div>
                ${drill.setup}
            </div>
            <div style="margin-top:15px;">
                <strong>PERFORM</strong>
            </div>
            <div>
                ${drill.execution}
            </div>
            <div style="margin-top:15px;">
                <strong>GOAL</strong>
            </div>
            <div>
                ${drill.goal}
            </div>
        `;

        drillInfo.style.display =
            "block";
    });
});

const drillsPanel =
    document.getElementById("drillsPanel");

if (
    drillsPanel &&
    drillsPanel.parentElement &&
    drillsPanel.parentElement.id === "settingsPanel"
) {

    document.body.appendChild(drillsPanel);
}

//------------------------------------------------
// Drills Button Click
//------------------------------------------------
drillsBtn.onclick = () => {
    returnToLive();
    continuousTargetDrawing = false;
    const drillsPanel =
        document.getElementById("drillsPanel");

    // If Drills is currently open, close it
    if(
        drillsPanel &&
        drillsPanel.style.display === "block"
    ){

        drillsPanel.style.display = "none";
        return;
    }

    closeSettingsPanel();
    if(drillsPanel){
        drillsPanel.style.display = "block";
    }
};
    
summaryBtn.onclick = () => {

    const logo = new Image();

    logo.onload = () => {

        console.log(
            "LOGO LOADED",
            logo.width,
            logo.height
        );

        const canvas =
            document.createElement("canvas");

        canvas.width = logo.naturalWidth;
        canvas.height = logo.naturalHeight;

        const ctx =
            canvas.getContext("2d");

        ctx.drawImage(
            logo,
            0,
            0
        );

        const logoData =
            canvas.toDataURL("image/png");

        createPDFSummary(logoData);
    };

    logo.onerror = (e) => {

        console.error(
            "LOGO FAILED TO LOAD",
            e
        );

    };

    logo.src = "Logo High Res.png";
};

//------------------------------------------------
// Clear Target Button Click
//------------------------------------------------
clearTargetBtn.onclick = () => {
    clearTargetData();
    settingsPanel.style.display = "none";
};

//------------------------------------------------
// Delete Targets Button Click
//------------------------------------------------
deleteTargetsBtn.onclick = async ()=>{

    const confirmed =
        await showCustomConfirm(
            "Delete ALL targets?"
        );

    if(confirmed){

        deleteAllTargets();

        settingsPanel.style.display =
            "none";
    }
};

//------------------------------------------------
// Play Last Replay Button Click
//------------------------------------------------
playLastBtn.onclick = ()=>{
    closeSettingsPanel();
    // Nothing to play yet
    if(!playback.src){
        console.log("No recording available.");
        return;
    }

     // Mute replay audio
    playback.muted = true;
    playback.volume = 0;

    //----------------------------------------
    // Switch to playback video
    //----------------------------------------
    preview.style.display = "none";
    playback.style.display = "block";
    showRecordedHits = true;

    //----------------------------------------
    // Start from beginning
    //----------------------------------------
    playback.currentTime = 0;
    playbackSyncActive = true;
    playback.play();
    requestAnimationFrame(syncPlayback);
};
