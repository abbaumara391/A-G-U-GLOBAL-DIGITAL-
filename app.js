// ==========================================
// A G U GLOBAL DIGITAL
// APPLICATION ENGINE
// SERVICE NAVIGATION UPGRADE
// ==========================================

(() => {
"use strict";

// ==========================================
// CONFIGURATION
// ==========================================

const config = window.AGU_CONFIG || {};

const $ = id => document.getElementById(id);

const loading = $("loading");

const AGU_ADMIN_ID =
  "4df784df-05a3-48ec-94b6-6ce6d5ae5a09";

const clientReady = Boolean(
  window.supabase &&
  config.SUPABASE_URL &&
  config.SUPABASE_PUBLISHABLE_KEY
);

const db = clientReady
  ? window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_PUBLISHABLE_KEY
    )
  : null;

// ==========================================
// SERVICE CATALOGUE
// ==========================================

const SERVICES = {
  airtime: {
    title: "Airtime & Data",
    icon: "▤",
    status: "Planned",
    description: "Mobile top-ups and data bundles.",
    details:
      "A G U GLOBAL DIGITAL is preparing an international mobile recharge service.",
    features: [
      "Mobile airtime top-ups",
      "Mobile data bundles",
      "Supported mobile networks",
      "Order and delivery records",
      "International coverage where providers are available"
    ],
    availability:
      "This service is not yet connected to a live airtime provider.",
    notice:
      "Purchases are currently unavailable. Do not send money for airtime or data."
  },

  bills: {
    title: "Bills & Utilities",
    icon: "ϟ",
    status: "Planned",
    description: "Electricity and TV subscriptions.",
    details:
      "The platform is preparing a secure utility payment service for supported countries.",
    features: [
      "Electricity bill payments",
      "Cable and television subscriptions",
      "Customer and meter verification",
      "Payment references",
      "Transaction receipts"
    ],
    availability:
      "No live electricity or television payment provider is connected yet.",
    notice:
      "Bill payments are not available at this stage."
  },

  education: {
    title: "Education PINs",
    icon: "▣",
    status: "Planned",
    description: "WAEC, NECO, JAMB and more.",
    details:
      "The education service is being prepared to support examination PINs and other educational products.",
    features: [
      "WAEC PINs",
      "NECO PINs",
      "JAMB products",
      "Other supported examination products",
      "Order history and delivery records"
    ],
    availability:
      "No verified education PIN supplier is connected yet.",
    notice:
      "Do not make payments for examination PINs through this dashboard."
  },

  giftcards: {
    title: "Gift Cards",
    icon: "◇",
    status: "Planned",
    description: "Digital gift card services.",
    details:
      "The gift card section is planned for supported digital gift card products.",
    features: [
      "Supported gift card categories",
      "Available denominations",
      "Order records",
      "Delivery information",
      "Supported international markets"
    ],
    availability:
      "Gift card suppliers and fulfilment integrations are not active yet.",
    notice:
      "Gift card purchases are not currently available."
  },

  crypto: {
    title: "Crypto Dashboard",
    icon: "₿",
    status: "Test phase",
    description: "Market information and test tools.",
    details:
      "This section is intended for cryptocurrency market information and controlled testing.",
    features: [
      "Cryptocurrency market information",
      "Supported asset reference information",
      "Test-phase wallet tools",
      "Transaction history design",
      "Future provider integration"
    ],
    availability:
      "The crypto section is in its test phase. Live cryptocurrency deposits, conversions, withdrawals and transfers are not enabled.",
    notice:
      "This dashboard does not currently accept cryptocurrency deposits or execute live crypto transactions."
  },

  globalpayments: {
    title: "Global Payments",
    icon: "⇄",
    status: "Planned",
    description: "Supported international payment options.",
    details:
      "The international payments service is being designed around supported currencies, countries and regulated payment providers.",
    features: [
      "International payment options",
      "Supported currency information",
      "Future currency conversion",
      "Payment records",
      "International provider integrations"
    ],
    availability:
      "International payment providers have not yet been activated.",
    notice:
      "International transfers and payments are not available yet."
  }
};

// ==========================================
// LOADING
// ==========================================

function showLoading(show) {
  if (loading) {
    loading.classList.toggle("hidden", !show);
  }
}

// ==========================================
// AUTHENTICATION MESSAGES
// ==========================================

function showMessage(message, error = false) {
  const element = $("authMessage");

  if (!element) return;

  element.textContent = message;

  element.classList.remove("hidden", "error");

  if (error) {
    element.classList.add("error");
  }
}

function clearMessage() {
  const element = $("authMessage");

  if (element) {
    element.classList.add("hidden");
  }
}

// ==========================================
// SECURITY HELPERS
// ==========================================

function safe(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

// ==========================================
// CURRENCY FORMATTING
// ==========================================

function money(amount, currency = "NGN") {
  const validCurrencies = [
    "NGN",
    "USD",
    "EUR",
    "GBP"
  ];

  const selectedCurrency =
    validCurrencies.includes(currency)
      ? currency
      : "NGN";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: selectedCurrency,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

// ==========================================
// AUTHENTICATION TABS
// ==========================================

function setTab(tab) {
  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tab
    );
  });

  $("loginForm").classList.toggle(
    "hidden",
    tab !== "login"
  );

  $("signupForm").classList.toggle(
    "hidden",
    tab !== "signup"
  );

  clearMessage();
}

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    setTab(button.dataset.tab);
  });
});

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showAuth() {
  $("authView").classList.remove("hidden");

  $("dashboardView").classList.add("hidden");

  $("logoutBtn").classList.add("hidden");

  closeServicePanel();
}

function showDashboard() {
  $("authView").classList.add("hidden");

  $("dashboardView").classList.remove("hidden");

  $("logoutBtn").classList.remove("hidden");
}

// ==========================================
// SERVICE INFORMATION PANEL
// ==========================================

let servicePanel = null;
let previousFocusedElement = null;

function createServicePanel() {
  if (servicePanel) return servicePanel;

  const panel = document.createElement("div");

  panel.id = "aguServicePanel";

  panel.className = "agu-service-overlay hidden";

  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "aguServiceTitle");

  panel.innerHTML = `
    <div class="agu-service-dialog">

      <button
        type="button"
        class="agu-service-close"
        aria-label="Close service information">
        &times;
      </button>

      <div class="agu-service-icon" id="aguServiceIcon"></div>

      <div class="eyebrow">
        A G U GLOBAL DIGITAL
      </div>

      <h2 id="aguServiceTitle"></h2>

      <span
        class="agu-service-status"
        id="aguServiceStatus">
      </span>

      <p
        class="agu-service-description"
        id="aguServiceDescription">
      </p>

      <h3>What this service will offer</h3>

      <ul id="aguServiceFeatures"></ul>

      <div class="agu-service-availability">
        <b>Availability</b>
        <p id="aguServiceAvailability"></p>
      </div>

      <div class="agu-service-notice" id="aguServiceNotice"></div>

      <button
        type="button"
        class="btn btn-primary full"
        id="aguServiceCloseButton">
        Return to dashboard
      </button>

    </div>
  `;

  document.body.appendChild(panel);

  servicePanel = panel;

  panel.querySelector(".agu-service-close")
    .addEventListener("click", closeServicePanel);

  panel.querySelector("#aguServiceCloseButton")
    .addEventListener("click", closeServicePanel);

  panel.addEventListener("click", event => {
    if (event.target === panel) {
      closeServicePanel();
    }
  });

  return panel;
}

// ==========================================
// OPEN SERVICE INFORMATION
// ==========================================

function openServicePanel(serviceKey, triggerElement) {
  const service = SERVICES[serviceKey];

  if (!service) return;

  const panel = createServicePanel();

  previousFocusedElement = triggerElement || document.activeElement;

  $("aguServiceIcon").textContent = service.icon;

  $("aguServiceTitle").textContent = service.title;

  $("aguServiceStatus").textContent = service.status;

  $("aguServiceDescription").textContent =
    service.details;

  $("aguServiceAvailability").textContent =
    service.availability;

  $("aguServiceNotice").textContent =
    service.notice;

  $("aguServiceFeatures").innerHTML =
    service.features.map(feature => `
      <li>${safe(feature)}</li>
    `).join("");

  panel.classList.remove("hidden");

  document.body.classList.add("agu-service-open");

  panel.querySelector(".agu-service-close").focus();
}

// ==========================================
// CLOSE SERVICE INFORMATION
// ==========================================

function closeServicePanel() {
  if (!servicePanel) return;

  servicePanel.classList.add("hidden");

  document.body.classList.remove("agu-service-open");

  if (
    previousFocusedElement &&
    typeof previousFocusedElement.focus === "function"
  ) {
    previousFocusedElement.focus();
  }

  previousFocusedElement = null;
}

// ==========================================
// SERVICE CARD NAVIGATION
// ==========================================

function identifyService(card) {
  const title = card.querySelector("b")?.textContent
    ?.trim()
    .toLowerCase();

  if (!title) return null;

  const matchingServices = {
    "airtime & data": "airtime",
    "bills & utilities": "bills",
    "education pins": "education",
    "gift cards": "giftcards",
    "crypto dashboard": "crypto",
    "global payments": "globalpayments"
  };

  return matchingServices[title] || null;
}

function configureServiceCards() {
  const grid = $("servicesGrid");

  if (!grid) return;

  grid.querySelectorAll(".service-card").forEach(card => {
    const serviceKey = identifyService(card);

    if (!serviceKey) return;

    card.dataset.service = serviceKey;

    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.setAttribute(
      "aria-label",
      `Open ${SERVICES[serviceKey].title} information`
    );

    card.classList.add("agu-clickable-service");

    card.style.cursor = "pointer";
  });
}

// Click handling uses event delegation so it also works
// if the dashboard cards are refreshed later.

const serviceGrid = $("servicesGrid");

if (serviceGrid) {

  serviceGrid.addEventListener("click", event => {
    const card = event.target.closest(".service-card");

    if (!card || !serviceGrid.contains(card)) return;

    const serviceKey =
      card.dataset.service || identifyService(card);

    if (!serviceKey) return;

    openServicePanel(serviceKey, card);
  });

  serviceGrid.addEventListener("keydown", event => {
    const card = event.target.closest(".service-card");

    if (!card || !serviceGrid.contains(card)) return;

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      const serviceKey =
        card.dataset.service || identifyService(card);

      if (!serviceKey) return;

      openServicePanel(serviceKey, card);
    }
  });
}

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    servicePanel &&
    !servicePanel.classList.contains("hidden")
  ) {
    closeServicePanel();
  }
});

// ==========================================
// SERVICE PANEL STYLES
// ==========================================

function installServiceStyles() {
  if ($("aguServiceStyles")) return;

  const style = document.createElement("style");

  style.id = "aguServiceStyles";

  style.textContent = `
    .agu-service-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(2, 12, 25, 0.82);
      backdrop-filter: blur(8px);
      overflow-y: auto;
    }

    .agu-service-overlay.hidden {
      display: none !important;
    }

    .agu-service-dialog {
      position: relative;
      width: min(100%, 540px);
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
      border-radius: 22px;
      background: #ffffff;
      color: #10243a;
      box-shadow: 0 25px 80px rgba(0,0,0,0.35);
    }

    .agu-service-close {
      position: absolute;
      top: 14px;
      right: 17px;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      background: #edf2f7;
      color: #10243a;
      font-size: 28px;
      cursor: pointer;
    }

    .agu-service-icon {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      margin-bottom: 18px;
      border-radius: 16px;
      background: #e6f4ed;
      color: #087b50;
      font-size: 30px;
      font-weight: 800;
    }

    .agu-service-dialog h2 {
      margin: 10px 0;
      font-size: 27px;
    }

    .agu-service-dialog h3 {
      margin-top: 24px;
      font-size: 17px;
    }

    .agu-service-status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 30px;
      background: #fff3d9;
      color: #8a5700;
      font-size: 12px;
      font-weight: 800;
    }

    .agu-service-description {
      margin-top: 18px;
      line-height: 1.7;
      color: #536477;
    }

    .agu-service-dialog ul {
      padding-left: 22px;
      line-height: 1.9;
      color: #34485c;
    }

    .agu-service-availability {
      margin-top: 22px;
      padding: 16px;
      border-radius: 12px;
      background: #edf4fb;
    }

    .agu-service-availability p {
      margin-bottom: 0;
      line-height: 1.6;
    }

    .agu-service-notice {
      margin: 16px 0;
      padding: 14px;
      border-left: 4px solid #d69b20;
      border-radius: 8px;
      background: #fff8e8;
      color: #624500;
      font-size: 13px;
      line-height: 1.6;
    }

    .agu-clickable-service {
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .agu-clickable-service:hover,
    .agu-clickable-service:focus-visible {
      transform: translateY(-4px);
      outline: 2px solid #20a875;
      outline-offset: 3px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }

    body.agu-service-open {
      overflow: hidden;
    }

    @media(max-width: 520px) {
      .agu-service-dialog {
        padding: 24px 20px;
      }
    }
  `;

  document.head.appendChild(style);
}

installServiceStyles();

// ==========================================
// EMPTY TRANSACTION STATE
// ==========================================

function showEmptyTransactions() {
  $("transactionsBody").innerHTML = `
    <tr>
      <td colspan="5" class="empty">
        No transactions recorded yet.
      </td>
    </tr>
  `;
}

// ==========================================
// LOAD TRANSACTION HISTORY
// ==========================================

async function loadTransactions(userId) {
  const { data, error } = await db
    .from("transactions")
    .select(`
      reference,
      service_type,
      amount,
      currency,
      status,
      created_at
    `)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false
    })
    .limit(10);

  if (error) {
    console.error("Transaction loading error:", error);

    showEmptyTransactions();

    return 0;
  }

  if (!data || data.length === 0) {
    showEmptyTransactions();

    return 0;
  }

  $("transactionsBody").innerHTML = data.map(transaction => {
    const date = new Date(
      transaction.created_at
    ).toLocaleDateString();

    return `
      <tr>
        <td>${safe(transaction.reference)}</td>

        <td>${safe(transaction.service_type)}</td>

        <td>
          ${money(
            transaction.amount,
            transaction.currency
          )}
        </td>

        <td>${safe(transaction.status)}</td>

        <td>${safe(date)}</td>
      </tr>
    `;
  }).join("");

  return data.length;
}

// ==========================================
// LOAD WALLET BALANCE
// AUTHENTICATED EDGE FUNCTION VERSION
// ==========================================

async function loadWallet(userId) {
  $("walletBalance").textContent = money(0);

  try {
    const {
      data: sessionData,
      error: sessionError
    } = await db.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.error("Customer session not found.");
      return;
    }

    const loggedInUserId =
      sessionData.session.user.id;

    if (loggedInUserId !== userId) {
      console.error("Customer account verification failed.");
      return;
    }

    const {
      data,
      error
    } = await db.functions.invoke(
      "wallet-overview",
      {
        body: {}
      }
    );

    if (error) {
      console.error(
        "Wallet Edge Function error:",
        error.message
      );

      return;
    }

    if (!data || !data.success) {
      console.error(
        "Wallet response error:",
        data?.message
      );

      return;
    }

    if (data.account_id !== userId) {
      console.error("Wallet account verification failed.");
      return;
    }

    const ngnWallet = (data.wallets || []).find(
      wallet => wallet.currency === "NGN"
    );

    const balance = Number(
      ngnWallet?.balance || 0
    );

    if (!Number.isFinite(balance)) {
      console.error("Invalid wallet balance.");
      return;
    }

    $("walletBalance").textContent = money(balance);

  } catch (error) {
    console.error(
      "Wallet loading failed:",
      error.message
    );
  }
}

// ==========================================
// LOAD USER PROFILE
// ==========================================

async function loadProfile(user) {
  const { data, error } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile loading error:", error);
    return;
  }

  if (data && data.full_name) {
    $("userName").textContent = data.full_name;

    $("avatar").textContent =
      data.full_name.trim().charAt(0).toUpperCase();
  }
}

// ==========================================
// AGU GLOBAL COUNTRY IMPORT
// ADMIN ONLY
// ==========================================

async function importGlobalCountries() {
  const {
    data: sessionData,
    error: sessionError
  } = await db.auth.getSession();

  if (sessionError || !sessionData.session) {
    alert("Please sign in again.");
    return;
  }

  if (sessionData.session.user.id !== AGU_ADMIN_ID) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Import the global country catalogue into AGU staging? No countries or services will be activated."
  );

  if (!confirmed) return;

  showLoading(true);

  try {
    const { data, error } = await db.functions.invoke(
      "agu-import-countries",
      {
        body: {}
      }
    );

    if (error) {
      console.error("Country import error:", error);

      alert(
        "Import request failed. Check the Edge Function logs."
      );

      return;
    }

    if (!data || !data.success) {
      alert(
        data?.error ||
        "Country import was unsuccessful."
      );

      return;
    }

    alert(
      "Country import successful!\n\n" +
      "Imported: " + data.imported +
      "\nCountries activated: No" +
      "\nServices activated: No"
    );

  } catch (error) {
    console.error(error);

    alert("Unable to complete the country import.");

  } finally {
    showLoading(false);
  }
}

// ==========================================
// AGU GLOBAL CURRENCY IMPORT
// ADMIN ONLY
// ==========================================

async function importGlobalCurrencies() {
  const {
    data: sessionData,
    error: sessionError
  } = await db.auth.getSession();

  if (sessionError || !sessionData.session) {
    alert("Please sign in again.");
    return;
  }

  if (sessionData.session.user.id !== AGU_ADMIN_ID) {
    alert("Administrator access required.");
    return;
  }

  const confirmed = confirm(
    "Import global currency reference records into staging? Production currencies and ECO will not be activated."
  );

  if (!confirmed) return;

  showLoading(true);

  try {
    const { data, error } = await db.functions.invoke(
      "agu-import-currencies",
      {
        body: {}
      }
    );

    if (error) {
      console.error("Currency import error:", error);

      alert(
        "Currency import failed. Check the Edge Function logs."
      );

      return;
    }

    if (!data || !data.success) {
      alert(
        data?.error ||
        "Currency import was unsuccessful."
      );

      return;
    }

    alert(
      "Currency import successful!\n\n" +
      "Imported: " + data.imported +
      "\nProduction updated: No" +
      "\nECO activated: No"
    );

  } catch (error) {
    console.error(error);

    alert("Unable to complete currency import.");

  } finally {
    showLoading(false);
  }
}

// ==========================================
// ADMINISTRATOR PANEL ACCESS
// ==========================================

function configureAdminPanel(user) {
  const panel = $("adminPanel");

  if (!panel) return;

  const isAdmin =
    user.id === AGU_ADMIN_ID;

  panel.classList.toggle("hidden", !isAdmin);
}

// ==========================================
// COUNTRY IMPORT BUTTON
// ==========================================

const importButton = $("importCountriesBtn");

if (importButton) {
  importButton.addEventListener("click", async () => {
    await importGlobalCountries();
  });
}

// ==========================================
// CURRENCY IMPORT BUTTON
// ==========================================

const currencyImportButton = $("importCurrenciesBtn");

if (currencyImportButton) {
  currencyImportButton.addEventListener("click", async () => {
    await importGlobalCurrencies();
  });
}

// ==========================================
// MAIN DASHBOARD
// ==========================================

async function loadDashboard(user) {
  showDashboard();

  configureAdminPanel(user);

  const email = user.email || "";

  const metadataName =
    user.user_metadata?.full_name || "";

  $("userEmail").textContent = email;

  $("userName").textContent =
    metadataName ||
    email.split("@")[0] ||
    "Member";

  $("avatar").textContent =
    (
      $("userName").textContent.trim().charAt(0) ||
      "A"
    ).toUpperCase();

  $("walletBalance").textContent = money(0);

  $("transactionCount").textContent = "0";

  showEmptyTransactions();

  // Keep the six original service cards.
  // They must not be replaced by database records
  // that are not connected to real service providers.

  configureServiceCards();

  try {
    await loadProfile(user);

    const [
      transactionCount
    ] = await Promise.all([
      loadTransactions(user.id),
      loadWallet(user.id)
    ]);

    $("transactionCount").textContent =
      String(transactionCount);

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// ==========================================
// LOGIN
// ==========================================

$("loginForm").addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (!db) {
      showMessage(
        "Configuration error. Check config.js.",
        true
      );

      return;
    }

    clearMessage();

    showLoading(true);

    try {
      const { data, error } = await db.auth
        .signInWithPassword({
          email: $("loginEmail").value.trim(),
          password: $("loginPassword").value
        });

      if (error) {
        showMessage(error.message, true);
        return;
      }

      await loadDashboard(data.user);

    } catch (error) {
      showMessage(
        "Login failed. Please try again.",
        true
      );

      console.error(error);

    } finally {
      showLoading(false);
    }
  }
);

// ==========================================
// REGISTRATION
// ==========================================

$("signupForm").addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (!db) {
      showMessage(
        "Configuration error. Check config.js.",
        true
      );

      return;
    }

    clearMessage();

    showLoading(true);

    const fullName =
      $("signupName").value.trim();

    const email =
      $("signupEmail").value.trim();

    const phone =
      $("signupPhone").value.trim();

    const password =
      $("signupPassword").value;

    try {
      const { data, error } = await db.auth
        .signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            },

            emailRedirectTo:
              window.location.origin +
              window.location.pathname
          }
        });

      if (error) {
        showMessage(error.message, true);
        return;
      }

      if (data.session && data.user) {
        await loadDashboard(data.user);

      } else {
        showMessage(
          "Account created successfully. Check your email for the confirmation link. After confirming, return here and sign in."
        );
      }

    } catch (error) {
      showMessage(
        "Registration failed. Please try again.",
        true
      );

      console.error(error);

    } finally {
      showLoading(false);
    }
  }
);

// ==========================================
// LOGOUT
// ==========================================

$("logoutBtn").addEventListener(
  "click",
  async () => {
    if (!db) return;

    showLoading(true);

    try {
      const { error } = await db.auth.signOut();

      if (error) {
        console.error("Logout error:", error);

        showMessage(error.message, true);

        return;
      }

      closeServicePanel();

      showAuth();

    } finally {
      showLoading(false);
    }
  }
);

// ==========================================
// SESSION INITIALIZATION
// ==========================================

async function initializeApp() {
  if (!clientReady) {
    showAuth();

    showMessage(
      "Supabase configuration is missing. Check config.js.",
      true
    );

    return;
  }

  showLoading(true);

  try {
    const {
      data: { session },
      error
    } = await db.auth.getSession();

    if (error) throw error;

    if (session && session.user) {
      await loadDashboard(session.user);

    } else {
      showAuth();
    }

  } catch (error) {
    console.error("Session error:", error);

    showAuth();

  } finally {
    showLoading(false);
  }

  // Monitor future login/logout events.

  db.auth.onAuthStateChange(
    (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => {
          loadDashboard(session.user);
        }, 0);
      }

      if (event === "SIGNED_OUT") {
        closeServicePanel();

        showAuth();
      }
    }
  );
}

// ==========================================
// SERVICE WORKER
// ==========================================

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => {
        console.error(
          "Service worker registration failed:",
          error
        );
      });
  });
}

// ==========================================
// START APPLICATION
// ==========================================

initializeApp();

})();
