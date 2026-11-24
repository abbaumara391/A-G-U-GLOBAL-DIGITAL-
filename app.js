// ==========================================
// A G U GLOBAL DIGITAL
// APPLICATION ENGINE
// ==========================================

(() => {
"use strict";

const config = window.AGU_CONFIG || {};

const $ = (id) => document.getElementById(id);

const loading = $("loading");

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
// LOADING
// ==========================================

function showLoading(show) {
if (loading) {
loading.classList.toggle("hidden", !show);
}
}

// ==========================================
// MESSAGES
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
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[character]
);
}

// ==========================================
// CURRENCY FORMATTING
// ==========================================

function money(amount, currency = "NGN") {
const validCurrencies = [
"NGN", "USD", "EUR", "GBP"
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

}

function showDashboard() {

$("authView").classList.add("hidden");  

$("dashboardView").classList.remove("hidden");  

$("logoutBtn").classList.remove("hidden");

}

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
// SECURE EDGE FUNCTION VERSION
// ==========================================

async function loadWallet(userId) {

  $("walletBalance").textContent = money(0);

  try {

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
        error
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
      console.error(
        "Wallet account verification failed."
      );
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

    $("walletBalance").textContent =
      money(balance);

    console.log(
      "Secure wallet overview loaded successfully."
    );

  } catch (error) {

    console.error(
      "Wallet loading failed:",
      error
    );

  }
}

// ==========================================
// LOAD AVAILABLE SERVICES
// ==========================================

async function loadServices() {

const { data, error } = await db  
  .from("services")  
  .select(`  
    service_name,  
    category,  
    description,  
    is_active  
  `)  
  .eq("is_active", true)  
  .limit(12);  

if (error) {  
  console.error("Service loading error:", error);  
  return;  
}  

if (!data || data.length === 0) {  
  return;  
}  

$("servicesGrid").innerHTML = data.map(service => {  

  return `  
    <article class="service-card">  

      <span class="service-icon">◇</span>  

      <b>${safe(service.service_name)}</b>  

      <small>  
        ${safe(  
          service.description ||  
          service.category ||  
          "Digital service"  
        )}  
      </small>  

      <span class="service-state">  
        Listed · ordering not enabled  
      </span>  

    </article>  
  `;  

}).join("");

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
// MAIN DASHBOARD
// ==========================================

async function loadDashboard(user) {

showDashboard();  

const email = user.email || "";  

const metadataName =  
  user.user_metadata?.full_name || "";  

$("userEmail").textContent = email;  

$("userName").textContent =  
  metadataName ||  
  email.split("@")[0] ||  
  "Member";  

$("avatar").textContent =  
  ($("userName").textContent.trim().charAt(0) || "A")  
    .toUpperCase();  

$("walletBalance").textContent = money(0);  

$("transactionCount").textContent = "0";  

showEmptyTransactions();  

try {  

  await loadProfile(user);  

  const [transactionCount] = await Promise.all([  

    loadTransactions(user.id),  

    loadWallet(user.id),  

    loadServices()  

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
