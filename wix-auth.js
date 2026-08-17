/*
 * Safe Insight Laser Target
 * Wix member authorization gate for the GitHub Pages PWA.
 *
 * Access is granted only when the logged-in Wix member has an ACTIVE
 * Laser App Annual or Laser App Monthly Pricing Plan order.
 *
 * Offline behavior:
 * A member who has been successfully verified online may continue using
 * the app offline for 24 hours. Once that grace period expires, an online
 * membership verification is required again.
 */

(() => {
    "use strict";

    const WIX_CLIENT_ID = "4eeedd13-888d-45bd-a27f-dabdab13e448";
    const REDIRECT_URI = "https://safeinsight.github.io/laser-camera/";
    const TOKEN_STORAGE_KEY = "safeInsightWixTokens";
    const OAUTH_STORAGE_KEY = "safeInsightWixOAuthData";
    const AUTHORIZATION_CACHE_KEY = "safeInsightWixMembershipAuthorization";
    const OFFLINE_GRACE_MS = 24 * 60 * 60 * 1000;

    const ALLOWED_PLANS = new Set([
        "Laser App Annual",
        "Laser App Monthly"
    ]);

    let wixClient = null;

    document.documentElement.style.visibility = "hidden";

    function createGate() {
        const overlay = document.createElement("div");
        overlay.id = "wixMembershipGate";
        overlay.innerHTML = `
            <div id="wixMembershipCard">
                <img src="SI Logo Border.png" alt="Safe Insight">
                <h2 id="wixMembershipTitle">Checking membership...</h2>
                <p id="wixMembershipMessage">Please wait.</p>
                <button id="wixMembershipLogin" type="button" hidden>Log In With Wix</button>
                <button id="wixMembershipLogout" type="button" hidden>Log Out</button>
            </div>
        `;

        const style = document.createElement("style");
        style.textContent = `
            html, body { margin:0; min-height:100%; }
            #wixMembershipGate {
                position:fixed;
                inset:0;
                z-index:2147483647;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#111;
                color:#fff;
                font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
                text-align:center;
                padding:24px;
                box-sizing:border-box;
            }
            #wixMembershipCard {
                width:min(420px,100%);
                padding:32px 24px;
                border-radius:12px;
                background:#fff;
                color:#111;
                box-sizing:border-box;
                box-shadow:0 10px 40px rgba(0,0,0,.35);
            }
            #wixMembershipCard img {
                width:110px;
                height:auto;
                margin-bottom:18px;
            }
            #wixMembershipTitle { margin:0 0 12px; }
            #wixMembershipMessage { line-height:1.5; margin:0 0 20px; }
            #wixMembershipCard button {
                width:100%;
                border:0;
                border-radius:7px;
                padding:13px 16px;
                background:#111;
                color:#fff;
                font-size:16px;
                cursor:pointer;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);
        return overlay;
    }

    const gate = createGate();
    const title = gate.querySelector("#wixMembershipTitle");
    const message = gate.querySelector("#wixMembershipMessage");
    const loginButton = gate.querySelector("#wixMembershipLogin");
    const logoutButton = gate.querySelector("#wixMembershipLogout");

    function showGate(titleText, messageText) {
        title.textContent = titleText;
        message.textContent = messageText;
        gate.hidden = false;
        document.documentElement.style.visibility = "visible";
    }

    function openApp() {
        gate.remove();
        document.documentElement.style.visibility = "visible";
    }

    function loadTokens() {
        try {
            const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
            return raw ? JSON.parse(raw) : undefined;
        } catch {
            return undefined;
        }
    }

    function clearTokens() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(OAUTH_STORAGE_KEY);
        localStorage.removeItem(AUTHORIZATION_CACHE_KEY);
    }

    function saveAuthorizationCache(planName) {
        localStorage.setItem(
            AUTHORIZATION_CACHE_KEY,
            JSON.stringify({
                planName,
                verifiedAt: Date.now()
            })
        );
    }

    function loadAuthorizationCache() {
        try {
            const raw = localStorage.getItem(AUTHORIZATION_CACHE_KEY);
            return raw ? JSON.parse(raw) : undefined;
        } catch {
            return undefined;
        }
    }

    function getOfflineAuthorization() {
        const cached = loadAuthorizationCache();

        if (!cached || !ALLOWED_PLANS.has(cached.planName)) {
            return null;
        }

        const verifiedAt = Number(cached.verifiedAt);

        if (!Number.isFinite(verifiedAt)) {
            return null;
        }

        if (Date.now() - verifiedAt > OFFLINE_GRACE_MS) {
            localStorage.removeItem(AUTHORIZATION_CACHE_KEY);
            return null;
        }

        return cached;
    }

    async function loadWixClient() {
        const sdk = await import("https://esm.sh/@wix/sdk@latest");
        const pricingPlans = await import("https://esm.sh/@wix/pricing-plans@latest");

        wixClient = sdk.createClient({
            auth: sdk.OAuthStrategy({
                clientId: WIX_CLIENT_ID,
                tokens: loadTokens()
            }),
            modules: {
                orders: pricingPlans.orders
            }
        });
    }

    async function startLogin() {
        loginButton.disabled = true;
        loginButton.textContent = "Opening Wix Login...";

        try {
            if (!wixClient) {
                throw new Error("WIX_CLIENT_NOT_READY");
            }

            const originalURI = window.location.href.split("#")[0];
            const oauthData = wixClient.auth.generateOAuthData(
                REDIRECT_URI,
                originalURI
            );

            localStorage.setItem(
                OAUTH_STORAGE_KEY,
                JSON.stringify(oauthData)
            );

            const { authUrl } = await wixClient.auth.getAuthUrl(oauthData);
            window.location.assign(authUrl);
        } catch (error) {
            console.error("Wix login start failed:", error);
            showGate(
                "Unable to start login",
                "Wix could not start the login process. Please check the browser Console for the exact error."
            );
            loginButton.disabled = false;
            loginButton.textContent = "Log In With Wix";
            loginButton.hidden = false;
        }
    }

    async function finishLoginIfNeeded() {
        const returnedOAuthData = wixClient.auth.parseFromUrl();

        if (!returnedOAuthData || (!returnedOAuthData.code && !returnedOAuthData.error)) {
            return;
        }

        if (returnedOAuthData.error) {
            throw new Error(
                returnedOAuthData.errorDescription || returnedOAuthData.error
            );
        }

        const raw = localStorage.getItem(OAUTH_STORAGE_KEY);

        if (!raw) {
            throw new Error("WIX_OAUTH_STATE_MISSING");
        }

        const oauthData = JSON.parse(raw);
        const tokens = await wixClient.auth.getMemberTokens(
            returnedOAuthData.code,
            returnedOAuthData.state,
            oauthData
        );

        wixClient.auth.setTokens(tokens);

        localStorage.setItem(
            TOKEN_STORAGE_KEY,
            JSON.stringify(tokens)
        );

        localStorage.removeItem(OAUTH_STORAGE_KEY);

        window.history.replaceState(
            {},
            document.title,
            window.location.origin + window.location.pathname
        );
    }

    async function verifyMembership() {
        const response = await wixClient.orders.memberListOrders();

        if (!response || !Array.isArray(response.orders)) {
            console.error("Unexpected Wix Pricing Plans response:", response);
            throw new Error("INVALID_PRICING_PLANS_RESPONSE");
        }

        console.log("Wix current member orders:", response.orders);

        const activeOrder = response.orders.find(order =>
            order &&
            order.status === "ACTIVE" &&
            ALLOWED_PLANS.has(order.planName)
        );

        if (!activeOrder) {
            throw new Error("NO_ACTIVE_LASER_PLAN");
        }

        saveAuthorizationCache(activeOrder.planName);

        return activeOrder;
    }

    async function canReachWix() {
        try {
            await fetch(
                "https://www.wix.com/favicon.ico?safeInsightConnectivityCheck=" + Date.now(),
                {
                    method: "GET",
                    mode: "no-cors",
                    cache: "no-store"
                }
            );
            return true;
        } catch {
            return false;
        }
    }

    async function tryOfflineFallback(error) {
        const cached = getOfflineAuthorization();

        if (!cached) return false;

        // navigator.onLine can remain true on some desktop browsers even when
        // Wi-Fi has lost Internet access. Confirm actual external connectivity
        // before deciding that a Wix API failure is a network failure.
        if (!navigator.onLine || !(await canReachWix())) {
            console.log(
                "Wix unavailable; using recent offline authorization:",
                cached.planName
            );
            openApp();
            return true;
        }

        return false;
    }

    function showTechnicalError(error) {
        console.error("Wix membership verification failed:", error);

        let detail = "Please try again while connected to the internet.";

        if (error && error.message === "WIX_OAUTH_STATE_MISSING") {
            detail = "The Wix login session could not be completed. Please start the login again.";
        } else if (error && error.message === "WIX_CLIENT_NOT_READY") {
            detail = "The Wix login service is not ready yet. Please refresh and try again.";
        } else if (error && error.message) {
            detail = `Wix returned: ${error.message}`;
        }

        showGate(
            "Membership Verification Failed",
            detail
        );

        loginButton.disabled = false;
        loginButton.textContent = "Log In With Wix";
        loginButton.hidden = false;
    }

    async function run() {
        loginButton.addEventListener("click", startLogin);

        logoutButton.addEventListener("click", () => {
            clearTokens();
            window.location.reload();
        });

        // Fast path for an already-authorized member when the browser knows
        // there is no network connection.
        if (!navigator.onLine) {
            const offlineAuthorization = getOfflineAuthorization();

            if (offlineAuthorization) {
                console.log(
                    "Offline membership authorization accepted:",
                    offlineAuthorization.planName
                );
                openApp();
                return;
            }

            showGate(
                "Membership Verification Required",
                "You need an active Laser App Annual or Laser App Monthly subscription that was verified online within the last 24 hours. Please reconnect to the Internet and try again."
            );
            loginButton.hidden = true;
            return;
        }

        try {
            await loadWixClient();
            await finishLoginIfNeeded();

            if (!wixClient.auth.loggedIn()) {
                showGate(
                    "Safe Insight Laser Target",
                    "Please log in with your Safe Insight Wix account to continue."
                );
                loginButton.hidden = false;
                return;
            }

            showGate(
                "Verifying membership",
                "Checking your Safe Insight Laser App subscription..."
            );

            const activeOrder = await verifyMembership();

            console.log(
                "Safe Insight membership verified:",
                activeOrder.planName
            );

            openApp();
        } catch (error) {
            if (error && error.message === "NO_ACTIVE_LASER_PLAN") {
                // A successful online response with no qualifying plan must
                // remove any previously cached authorization.
                localStorage.removeItem(AUTHORIZATION_CACHE_KEY);

                showGate(
                    "Laser Target Access Required",
                    "An active Laser App Annual or Laser App Monthly subscription is required to use Laser Target."
                );
                logoutButton.hidden = false;
                return;
            }

            // If Wix cannot be reached, an authorization that was successfully
            // verified online within the last 24 hours remains valid for offline
            // PWA use. Other Wix errors are still shown normally.
            if (await tryOfflineFallback(error)) {
                return;
            }

            showTechnicalError(error);
        }
    }

    run();
})();
