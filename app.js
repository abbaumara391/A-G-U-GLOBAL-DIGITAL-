// ==========================================
// A G U GLOBAL DIGITAL — APPLICATION ENGINE
// Paystack wallet funding integration (TEST MODE)
// Existing authentication, wallet overview, admin imports
// and service navigation preserved.
// ==========================================
(() => {
"use strict";

const config = window.AGU_CONFIG || {};
const $ = id => document.getElementById(id);
const loading = $("loading");
const AGU_ADMIN_ID = "4df784df-05a3-48ec-94b6-6ce6d5ae5a09";

const clientReady = Boolean(
  window.supabase &&
  config.SUPABASE_URL &&
  config.SUPABASE_PUBLISHABLE_KEY
);

const db = clientReady
  ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY)
  : null;

const SERVICES = {
  airtime: {
    title: "Airtime & Data", icon: "▤", status: "Planned",
    details: "A G U GLOBAL DIGITAL is preparing an international mobile recharge service.",
    features: ["Mobile airtime top-ups", "Mobile data bundles", "Supported mobile networks", "Order and delivery records", "International coverage where providers are available"],
    availability: "This service is not yet connected to a live airtime provider.",
    notice: "Purchases are currently unavailable. Do not send money for airtime or data."
  },
  bills: {
    title: "Bills & Utilities", icon: "ϟ", status: "Planned",
    details: "The platform is preparing a secure utility payment service for supported countries.",
    features: ["Electricity bill payments", "Cable and television subscriptions", "Customer and meter verification", "Payment references", "Transaction receipts"],
    availability: "No live electricity or television payment provider is connected yet.",
    notice: "Bill payments are not available at this stage."
  },
  education: {
    title: "Education PINs", icon: "▣", status: "Planned",
    details: "The education service is being prepared to support examination PINs and other educational products.",
    features: ["WAEC PINs", "NECO PINs", "JAMB products", "Other supported examination products", "Order history and delivery records"],
    availability: "No verified education PIN supplier is connected yet.",
    notice: "Do not make payments for examination PINs through this dashboard."
  },
  giftcards: {
    title: "Gift Cards", icon: "◇", status: "Planned",
    details: "The gift card section is planned for supported digital gift card products.",
    features: ["Supported gift card categories", "Available denominations", "Order records", "Delivery information", "Supported international markets"],
    availability: "Gift card suppliers and fulfilment integrations are not active yet.",
    notice: "Gift card purchases are not currently available."
  },
  crypto: {
    title: "Crypto Dashboard", icon: "₿", status: "Test phase",
    details: "This section is intended for cryptocurrency market information and controlled testing.",
    features: ["Cryptocurrency market information", "Supported asset reference information", "Test-phase wallet tools", "Transaction history design", "Future provider integration"],
    availability: "The crypto section is in its test phase. Live cryptocurrency deposits, conversions, withdrawals and transfers are not enabled.",
    notice: "This dashboard does not currently accept cryptocurrency deposits or execute live crypto transactions."
  },
  globalpayments: {
    title: "Global Payments", icon: "⇄", status: "Planned",
    details: "The international payments service is being designed around supported currencies, countries and regulated payment providers.",
    features: ["International payment options", "Supported currency information", "Future currency conversion", "Payment records", "International provider integrations"],
    availability: "International payment providers have not yet been activated.",
    notice: "International transfers and payments are not available yet."
  }
};

function showLoading(show) {
  if (loading) loading.classList.toggle("hidden", !show);
}

function showMessage(message, error = false) {
  const element = $("authMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.remove("hidden", "error");
  if (error) element.classList.add("error");
}
function clearMessage() {
  const element = $("authMessage");
  if (element) element.classList.add("hidden");
}
function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}
function money(amount, currency = "NGN") {
  const allowed = ["NGN", "USD", "EUR", "GBP"];
  const code = allowed.includes(currency) ? currency : "NGN";
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: code, maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

// ---------------- AUTH TABS ----------------
function setTab(tab) {
  document.querySelectorAll(".tab").forEach(button =>
    button.classList.toggle("active", button.dataset.tab === tab)
  );
  $("loginForm").classList.toggle("hidden", tab !== "login");
  $("signupForm").classList.toggle("hidden", tab !== "signup");
  clearMessage();
}
document.querySelectorAll(".tab").forEach(button =>
  button.addEventListener("click", () => setTab(button.dataset.tab))
);

// ---------------- NAVIGATION ----------------
function showAuth() {
  $("authView").classList.remove("hidden");
  $("dashboardView").classList.add("hidden");
  $("logoutBtn").classList.add("hidden");
  closeServicePanel();
  closeFundingPanel();
}
function showDashboard() {
  $("authView").classList.add("hidden");
  $("dashboardView").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
}

// ---------------- SERVICE INFORMATION ----------------
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
      <button type="button" class="agu-service-close" aria-label="Close service information">&times;</button>
      <div class="agu-service-icon" id="aguServiceIcon"></div>
      <div class="eyebrow">A G U GLOBAL DIGITAL</div>
      <h2 id="aguServiceTitle"></h2>
      <span class="agu-service-status" id="aguServiceStatus"></span>
      <p id="aguServiceDescription"></p>
      <h3>What this service will offer</h3>
      <ul id="aguServiceFeatures"></ul>
      <div class="agu-service-availability"><b>Availability</b><p id="aguServiceAvailability"></p></div>
      <div class="agu-service-notice" id="aguServiceNotice"></div>
      <button type="button" class="btn btn-primary full" id="aguServiceCloseButton">Return to dashboard</button>
    </div>`;
  document.body.appendChild(panel);
  servicePanel = panel;
  panel.querySelector(".agu-service-close").addEventListener("click", closeServicePanel);
  panel.querySelector("#aguServiceCloseButton").addEventListener("click", closeServicePanel);
  panel.addEventListener("click", event => {
    if (event.target === panel) closeServicePanel();
  });
  return panel;
}
function openServicePanel(key, trigger) {
  const service = SERVICES[key];
  if (!service) return;
  const panel = createServicePanel();
  previousFocusedElement = trigger || document.activeElement;
  $("aguServiceIcon").textContent = service.icon;
  $("aguServiceTitle").textContent = service.title;
  $("aguServiceStatus").textContent = service.status;
  $("aguServiceDescription").textContent = service.details;
  $("aguServiceAvailability").textContent = service.availability;
  $("aguServiceNotice").textContent = service.notice;
  $("aguServiceFeatures").innerHTML = service.features.map(item => `<li>${safe(item)}</li>`).join("");
  panel.classList.remove("hidden");
  document.body.classList.add("agu-service-open");
  panel.querySelector(".agu-service-close").focus();
}
function closeServicePanel() {
  if (!servicePanel) return;
  servicePanel.classList.add("hidden");
  document.body.classList.remove("agu-service-open");
  if (previousFocusedElement?.focus) previousFocusedElement.focus();
  previousFocusedElement = null;
}
function identifyService(card) {
  const title = card.querySelector("b")?.textContent?.trim().toLowerCase();
  const map = {
    "airtime & data":"airtime", "bills & utilities":"bills",
    "education pins":"education", "gift cards":"giftcards",
    "crypto dashboard":"crypto", "global payments":"globalpayments"
  };
  return title ? map[title] || null : null;
}
function configureServiceCards() {
  const grid = $("servicesGrid");
  if (!grid) return;
  grid.querySelectorAll(".service-card").forEach(card => {
    const key = identifyService(card);
    if (!key) return;
    card.dataset.service = key;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open ${SERVICES[key].title} information`);
    card.classList.add("agu-clickable-service");
    card.style.cursor = "pointer";
  });
}
const serviceGrid = $("servicesGrid");
if (serviceGrid) {
  serviceGrid.addEventListener("click", event => {
    const card = event.target.closest(".service-card");
    if (!card || !serviceGrid.contains(card)) return;
    const key = card.dataset.service || identifyService(card);
    if (key) openServicePanel(key, card);
  });
  serviceGrid.addEventListener("keydown", event => {
    const card = event.target.closest(".service-card");
    if (!card || !serviceGrid.contains(card)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const key = card.dataset.service || identifyService(card);
      if (key) openServicePanel(key, card);
    }
  });
}

// ---------------- STYLES ----------------
function installStyles() {
  if ($("aguDynamicStyles")) return;
  const style = document.createElement("style");
  style.id = "aguDynamicStyles";
  style.textContent = `
    .agu-service-overlay,.agu-funding-overlay{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,12,25,.82);backdrop-filter:blur(8px);overflow-y:auto}
    .agu-service-overlay.hidden,.agu-funding-overlay.hidden{display:none!important}
    .agu-service-dialog,.agu-funding-dialog{position:relative;width:min(100%,540px);max-height:90vh;overflow-y:auto;padding:30px;border-radius:22px;background:#fff;color:#10243a;box-shadow:0 25px 80px rgba(0,0,0,.35)}
    .agu-service-close,.agu-funding-close{position:absolute;top:14px;right:17px;width:40px;height:40px;border:0;border-radius:50%;background:#edf2f7;color:#10243a;font-size:28px;cursor:pointer}
    .agu-service-icon{display:grid;place-items:center;width:58px;height:58px;margin-bottom:18px;border-radius:16px;background:#e6f4ed;color:#087b50;font-size:30px;font-weight:800}
    .agu-service-dialog h2,.agu-funding-dialog h2{margin:10px 0;font-size:27px}
    .agu-service-dialog h3{margin-top:24px;font-size:17px}
    .agu-service-status{display:inline-block;padding:6px 12px;border-radius:30px;background:#fff3d9;color:#8a5700;font-size:12px;font-weight:800}
    .agu-service-description{margin-top:18px;line-height:1.7;color:#536477}
    .agu-service-dialog ul{padding-left:22px;line-height:1.9;color:#34485c}
    .agu-service-availability{margin-top:22px;padding:16px;border-radius:12px;background:#edf4fb}
    .agu-service-availability p{margin-bottom:0;line-height:1.6}
    .agu-service-notice{margin:16px 0;padding:14px;border-left:4px solid #d69b20;border-radius:8px;background:#fff8e8;color:#624500;font-size:13px;line-height:1.6}
    .agu-clickable-service{transition:transform .2s ease,box-shadow .2s ease}
    .agu-clickable-service:hover,.agu-clickable-service:focus-visible{transform:translateY(-4px);outline:2px solid #20a875;outline-offset:3px;box-shadow:0 12px 30px rgba(0,0,0,.12)}
    body.agu-service-open,body.agu-funding-open{overflow:hidden}
    .agu-funding-dialog>label{display:block;margin:22px 0 8px;font-weight:700}
    .agu-amount-wrap{display:flex;align-items:center;gap:10px;border:1px solid #cbd5e1;border-radius:12px;padding:0 14px;background:#fff}
    .agu-amount-wrap span{font-size:22px;font-weight:800;color:#087b50}
    .agu-amount-wrap input{width:100%;min-width:0;padding:14px 0;border:0;outline:0;font-size:20px;color:#10243a;background:transparent}
    .agu-funding-message{min-height:24px;margin:12px 0;color:#34485c;font-size:14px;line-height:1.5}
    .agu-funding-message.error{color:#b42318}
    .agu-funding-message.success{color:#087b50}
    .agu-funding-actions{display:grid;gap:10px;margin:14px 0}
    .agu-funding-dialog small{display:block;line-height:1.6}
    @media(max-width:520px){.agu-service-dialog,.agu-funding-dialog{padding:24px 20px}}
  `;
  document.head.appendChild(style);
}
installStyles();

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (servicePanel && !servicePanel.classList.contains("hidden")) closeServicePanel();
    const fundingOverlay = $("fundingOverlay");
    if (fundingOverlay && !fundingOverlay.classList.contains("hidden")) closeFundingPanel();
  }
});

// ---------------- TRANSACTIONS ----------------
function showEmptyTransactions() {
  $("transactionsBody").innerHTML = `<tr><td colspan="5" class="empty">No transactions recorded yet.</td></tr>`;
}
async function loadTransactions(userId) {
  const { data, error } = await db.from("transactions")
    .select("reference,service_type,amount,currency,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) {
    console.error("Transaction loading error:", error);
    showEmptyTransactions();
    return 0;
  }
  if (!data?.length) {
    showEmptyTransactions();
    return 0;
  }
  $("transactionsBody").innerHTML = data.map(tx => {
    const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—";
    return `<tr>
      <td>${safe(tx.reference)}</td><td>${safe(tx.service_type)}</td>
      <td>${money(tx.amount, tx.currency)}</td><td>${safe(tx.status)}</td><td>${safe(date)}</td>
    </tr>`;
  }).join("");
  return data.length;
}

// ---------------- WALLET OVERVIEW ----------------
async function loadWallet(userId) {
  $("walletBalance").textContent = money(0);
  try {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("Customer session not found.");
      return;
    }
    if (sessionData.session.user.id !== userId) {
      console.error("Customer account verification failed.");
      return;
    }
    const { data, error } = await db.functions.invoke("wallet-overview", { body: {} });
    if (error) {
      console.error("Wallet Edge Function error:", error.message);
      return;
    }
    if (!data?.success) {
      console.error("Wallet response error:", data?.message);
      return;
    }
    if (data.account_id !== userId) {
      console.error("Wallet account verification failed.");
      return;
    }
    const ngnWallet = (data.wallets || []).find(wallet => wallet.currency === "NGN");
    const balance = Number(ngnWallet?.balance || 0);
    if (!Number.isFinite(balance)) {
      console.error("Invalid wallet balance.");
      return;
    }
    $("walletBalance").textContent = money(balance);
  } catch (error) {
    console.error("Wallet loading failed:", error.message);
  }
}

// ---------------- PROFILE ----------------
async function loadProfile(user) {
  const { data, error } = await db.from("profiles")
    .select("full_name").eq("id", user.id).maybeSingle();
  if (error) {
    console.error("Profile loading error:", error);
    return;
  }
  if (data?.full_name) {
    $("userName").textContent = data.full_name;
    $("avatar").textContent = data.full_name.trim().charAt(0).toUpperCase();
  }
}

// ---------------- ADMIN IMPORTS ----------------
async function adminSession() {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session) {
    alert("Please sign in again.");
    return null;
  }
  if (data.session.user.id !== AGU_ADMIN_ID) {
    alert("Administrator access required.");
    return null;
  }
  return data.session;
}
async function importGlobalCountries() {
  const session = await adminSession();
  if (!session) return;
  if (!confirm("Import the global country catalogue into AGU staging? No countries or services will be activated.")) return;
  showLoading(true);
  try {
    const { data, error } = await db.functions.invoke("agu-import-countries", { body: {} });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Country import was unsuccessful.");
    alert(`Country import successful!\n\nImported: ${data.imported}\nCountries activated: No\nServices activated: No`);
    if ($("countryImportStatus")) $("countryImportStatus").textContent = `Imported ${data.imported} records · staging only`;
  } catch (error) {
    console.error("Country import error:", error);
    alert(error.message || "Unable to complete the country import.");
  } finally { showLoading(false); }
}
async function importGlobalCurrencies() {
  const session = await adminSession();
  if (!session) return;
  if (!confirm("Import global currency reference records into staging? Production currencies and ECO will not be activated.")) return;
  showLoading(true);
  try {
    const { data, error } = await db.functions.invoke("agu-import-currencies", { body: {} });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Currency import was unsuccessful.");
    alert(`Currency import successful!\n\nImported: ${data.imported}\nProduction updated: No\nECO activated: No`);
    if ($("currencyImportStatus")) $("currencyImportStatus").textContent = `Imported ${data.imported} records · staging only`;
  } catch (error) {
    console.error("Currency import error:", error);
    alert(error.message || "Unable to complete currency import.");
  } finally { showLoading(false); }
}
$("importCountriesBtn")?.addEventListener("click", importGlobalCountries);
$("importCurrenciesBtn")?.addEventListener("click", importGlobalCurrencies);

function configureAdminPanel(user) {
  const panel = $("adminPanel");
  if (panel) panel.classList.toggle("hidden", user.id !== AGU_ADMIN_ID);
}

// ---------------- FUNDING DIALOG ----------------
let fundingFocusReturn = null;
function setFundingMessage(message, type = "") {
  const el = $("fundingMessage");
  if (!el) return;
  el.textContent = message;
  el.className = `agu-funding-message${type ? " " + type : ""}`;
}
function openFundingPanel() {
  fundingFocusReturn = document.activeElement;
  setFundingMessage("Enter the amount you want to test. Checkout will open on Paystack.");
  $("fundingOverlay").classList.remove("hidden");
  document.body.classList.add("agu-funding-open");
  $("fundingAmount").focus();
}
function closeFundingPanel() {
  const overlay = $("fundingOverlay");
  if (!overlay || overlay.classList.contains("hidden")) return;
  overlay.classList.add("hidden");
  document.body.classList.remove("agu-funding-open");
  if (fundingFocusReturn?.focus) fundingFocusReturn.focus();
  fundingFocusReturn = null;
}
$("fundWalletBtn")?.addEventListener("click", openFundingPanel);
$("fundingCloseBtn")?.addEventListener("click", closeFundingPanel);
$("cancelFundingBtn")?.addEventListener("click", closeFundingPanel);
$("fundingOverlay")?.addEventListener("click", event => {
  if (event.target === $("fundingOverlay")) closeFundingPanel();
});

function formatAmountInput(value) {
  const raw = String(value ?? "").trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(raw)) return null;
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number.toFixed(2);
}

async function startWalletFunding() {
  if (!db) {
    setFundingMessage("The Supabase connection is not ready. Refresh and sign in again.", "error");
    return;
  }

  const amount = formatAmountInput($("fundingAmount").value);
  if (!amount) {
    setFundingMessage("Enter a valid amount greater than zero, with no more than two decimal places.", "error");
    $("fundingAmount").focus();
    return;
  }

  const button = $("startFundingBtn");
  button.disabled = true;
  button.textContent = "Preparing secure checkout…";
  setFundingMessage("Connecting to Paystack Test Mode. Please wait.");

  try {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    const session = sessionData?.session;
    if (sessionError || !session?.user) throw new Error("Your session has expired. Sign in again.");

    const { data, error } = await db.functions.invoke("paystack-initialize", {
      body: { amount }
    });

    if (error) throw new Error(error.message || "Could not initialize Paystack checkout.");
    if (!data?.success || !data.authorization_url || !data.reference) {
      throw new Error(data?.message || "The payment provider did not return a valid checkout session.");
    }

    sessionStorage.setItem("agu_pending_funding_reference", data.reference);
    setFundingMessage("Secure checkout is ready. Redirecting to Paystack…", "success");
    window.location.assign(data.authorization_url);
  } catch (error) {
    console.error("Wallet funding initialization failed:", error);
    setFundingMessage(error.message || "Unable to start checkout. Please try again.", "error");
    button.disabled = false;
    button.textContent = "Continue to Paystack Test Checkout";
  }
}
$("startFundingBtn")?.addEventListener("click", startWalletFunding);
// ---------------- PAYSTACK RETURN VERIFICATION ----------------
function getReturnedPaymentReference() {
  const params = new URLSearchParams(window.location.search);
  return params.get("reference") || params.get("trxref") || "";
}

function clearPaymentQuery() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("reference");
    url.searchParams.delete("trxref");
    url.searchParams.delete("status");
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  } catch (error) {
    console.warn("Could not clean callback URL:", error);
  }
}

async function verifyReturnedFunding() {
  const reference = getReturnedPaymentReference();
  if (!reference) return false;

  clearPaymentQuery();

  const pending = sessionStorage.getItem("agu_pending_funding_reference");

  if (!/^AGU[a-f0-9]{32}$/.test(reference)) {
    openFundingPanel();
    setFundingMessage("The returned payment reference is not recognised. No wallet credit was made.", "error");
    return true;
  }

  if (pending && pending !== reference) {
    openFundingPanel();
    setFundingMessage("The returned reference does not match the checkout started in this browser. No wallet credit was made.", "error");
    return true;
  }

  openFundingPanel();
  $("startFundingBtn").disabled = true;
  $("startFundingBtn").textContent = "Verifying payment…";
  setFundingMessage("Checking payment directly with the secure server. Please wait.");

  try {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      throw new Error("Your sign-in session is missing. Sign in again before checking this payment.");
    }

    const { data, error } = await db.functions.invoke("paystack-verify", {
      body: { reference }
    });

    if (error) throw new Error(error.message || "The server could not verify this payment.");
    if (!data?.success) {
      throw new Error(data?.message || data?.error || "Payment is not confirmed. No wallet credit was made.");
    }

    sessionStorage.removeItem("agu_pending_funding_reference");
    await loadDashboard(sessionData.session.user);

    setFundingMessage(
      "Payment verified successfully by the server. Your wallet overview has been refreshed.",
      "success"
    );

    $("startFundingBtn").textContent = "Verified";
    $("cancelFundingBtn").textContent = "Close";

  } catch (error) {
    console.error("Paystack verification failed:", error);

    setFundingMessage(
      `${error.message || "Verification failed."} No wallet credit is confirmed by this page. Keep this reference for support: ${reference}`,
      "error"
    );

    $("startFundingBtn").disabled = false;
    $("startFundingBtn").textContent = "Retry verification";
    $("startFundingBtn").onclick = () => retryFundingVerification(reference);
  }

  return true;
}

async function retryFundingVerification(reference) {
  const button = $("startFundingBtn");
  button.disabled = true;
  button.textContent = "Verifying…";
  setFundingMessage("Retrying secure server verification…");

  try {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      throw new Error("Please sign in again before retrying.");
    }

    const { data, error } = await db.functions.invoke("paystack-verify", {
      body: { reference }
    });

    if (error) throw new Error(error.message || "Verification request failed.");
    if (!data?.success) {
      throw new Error(data?.message || data?.error || "Payment is not confirmed.");
    }

    sessionStorage.removeItem("agu_pending_funding_reference");
    await loadDashboard(sessionData.session.user);

    setFundingMessage(
      "Payment verified successfully. Your wallet overview has been refreshed.",
      "success"
    );

    button.textContent = "Verified";
    $("cancelFundingBtn").textContent = "Close";

  } catch (error) {
    setFundingMessage(
      `${error.message} No wallet credit is confirmed by this page. Keep your reference for support: ${reference}`,
      "error"
    );

    button.disabled = false;
    button.textContent = "Retry verification";
  }
}

// ---------------- DASHBOARD ----------------
async function loadDashboard(user) {
  showDashboard();
  configureAdminPanel(user);

  const email = user.email || "";
  const metadataName = user.user_metadata?.full_name || "";

  $("userEmail").textContent = email;
  $("userName").textContent = metadataName || email.split("@")[0] || "Member";
  $("avatar").textContent =
    ($("userName").textContent.trim().charAt(0) || "A").toUpperCase();

  $("walletBalance").textContent = money(0);
  $("transactionCount").textContent = "0";
  showEmptyTransactions();
  configureServiceCards();

  try {
    await loadProfile(user);

    const [count] = await Promise.all([
      loadTransactions(user.id),
      loadWallet(user.id)
    ]);

    $("transactionCount").textContent = String(count);
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// ---------------- LOGIN ----------------
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!db) {
    showMessage("Configuration error. Check config.js.", true);
    return;
  }

  clearMessage();
  showLoading(true);

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    });

    if (error) {
      showMessage(error.message, true);
      return;
    }

    await loadDashboard(data.user);
    await verifyReturnedFunding();

  } catch (error) {
    showMessage("Login failed. Please try again.", true);
    console.error(error);

  } finally {
    showLoading(false);
  }
});

// ---------------- REGISTRATION ----------------
$("signupForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!db) {
    showMessage("Configuration error. Check config.js.", true);
    return;
  }

  clearMessage();
  showLoading(true);

  const fullName = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const phone = $("signupPhone").value.trim();
  const password = $("signupPassword").value;

  try {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: window.location.origin + window.location.pathname
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
    showMessage("Registration failed. Please try again.", true);
    console.error(error);

  } finally {
    showLoading(false);
  }
});

// ---------------- LOGOUT ----------------
$("logoutBtn").addEventListener("click", async () => {
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
    closeFundingPanel();
    showAuth();

  } finally {
    showLoading(false);
  }
});

// ---------------- SESSION INITIALIZATION ----------------
async function initializeApp() {
  if (!clientReady) {
    showAuth();
    showMessage("Supabase configuration is missing. Check config.js.", true);
    return;
  }

  showLoading(true);

  try {
    const {
      data: { session },
      error
    } = await db.auth.getSession();

    if (error) throw error;

    if (session?.user) {
      await loadDashboard(session.user);
      await verifyReturnedFunding();
    } else {
      showAuth();
    }

  } catch (error) {
    console.error("Session error:", error);
    showAuth();

  } finally {
    showLoading(false);
  }

  db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      setTimeout(() => loadDashboard(session.user), 0);
    }

    if (event === "SIGNED_OUT") {
      closeServicePanel();
      closeFundingPanel();
      showAuth();
    }
  });
}

// ---------------- SERVICE WORKER ----------------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error =>
      console.error("Service worker registration failed:", error)
    );
  });
}

initializeApp();
})();
