/*
 * Safe Insight Laser Target
 * Wix member authorization gate for the GitHub Pages PWA.
 *
 * Access is granted only when the logged-in Wix member has an ACTIVE
 * Laser App Annual or Laser App Monthly Pricing Plan order.
 */

(() => {
    "use strict";

    const WIX_CLIENT_ID = "4eeedd13-888d-45bd-a27f-dabdab13e448";
    const REDIRECT_URI = "https://safeinsight.github.io/laser-camera/";
    const TOKEN_STORAGE_KEY = "safeInsightWixTokens";
    const OAUTH_STORAGE_KEY = "safeInsightWixOAuthData";

    const ALLOWED_PLANS = new Set([
        "Laser App Annual",
        "Laser App Monthly"
    ]);

    let wixClient;

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
    }

    async function loadWixClient() {
        const sdk = await import("https://esm.sh/@wix/sdk@latest");
        const sitePricingPlans = await import("https://esm.sh/@wix/site-pricing-plans@latest");

        wixClient = sdk.createClient({
            auth: sdk.OAuthStrategy({
                clientId: WIX_CLIENT_ID,
                tokens: loadTokens()
            }),
            modules: {
                sitePricingPlans
            }
        });
    }

    async function startLogin() {
        try {
            const originalURI = window.location.href.split("#")[0];
            const oauthData = wixClient.auth.generateOAuthData(
                REDIRECT_URI,
                originalURI
            );

            localStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(oauthData));

            const { authUrl } = await wixClient.auth.getAuthUrl(oauthData);
            window.location.href = authUrl;
        } catch (error) {
            console.error("Wix login start failed:", error);
            showGate(
                "Unable to start login",
                "Please try again. If the problem continues, check the Wix OAuth redirect settings."
            );
            loginButton.hidden = false;
        }
    }

    async function finishLoginIfNeeded() {
        const returned = wixClient.auth.parseFromUrl();

        if (!returned || (!returned.code && !returned.error)) {
            return;
        }

        if (returned.error) {
            throw new Error(returned.errorDescription || returned.error);
        }

        const raw = localStorage.getItem(OAUTH_STORAGE_KEY);
        if (!raw) {
            throw new Error("Wix login state is missing. Please start login again.");
        }

        const oauthData = JSON.parse(raw);
        const tokens = await wixClient.auth.getMemberTokens(
            returned.code,
            returned.state,
            oauthData
        );

        wixClient.auth.setTokens(tokens);
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
        localStorage.removeItem(OAUTH_STORAGE_KEY);

        window.history.replaceState(
            {},
            document.title,
            window.location.origin + window.location.pathname
        );
    }

    async function verifyMembership() {
        // Wix's current frontend Pricing Plans API returns the member's
        // orders as an array, not as { orders: [...] }.
        const orders = await wixClient.sitePricingPlans.listCurrentMemberOrders();

        if (!Array.isArray(orders)) {
            throw new Error("INVALID_PRICING_PLANS_RESPONSE");
        }

        console.log("Wix current member orders:", orders);

        const activeOrder = orders.find(order =>
            order &&
            order.status === "ACTIVE" &&
            ALLOWED_PLANS.has(order.planName)
        );

        if (!activeOrder) {
            throw new Error("NO_ACTIVE_LASER_PLAN");
        }

        return activeOrder;
    }

    async function run() {
        loginButton.addEventListener("click", startLogin);
        logoutButton.addEventListener("click", () => {
            clearTokens();
            window.location.reload();
        });

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
            console.log("Safe Insight membership verified:", activeOrder.planName);
            openApp();
        } catch (error) {
            console.error("Wix membership verification failed:", error);

            if (error.message === "NO_ACTIVE_LASER_PLAN") {
                showGate(
                    "Laser Target Access Required",
                    "An active Laser App Annual or Laser App Monthly subscription is required to use Laser Target."
                );
                logoutButton.hidden = false;
                return;
            }

            showGate(
                "Membership Verification Failed",
                "We could not verify your Safe Insight membership. Please try again while connected to the internet."
            );
            loginButton.hidden = false;
        }
    }

    run();
})();
