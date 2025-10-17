import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

let isLoggingIn = false;

// -------- Login handler (click or Enter) --------
async function handleLogin() {
  if (isLoggingIn) return; // prevent double submit
  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    isLoggingIn = true;
    loginBtn && (loginBtn.disabled = true);

    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  } finally {
    isLoggingIn = false;
    loginBtn && (loginBtn.disabled = false);
  }
}

// Click on button
if (loginBtn) {
  loginBtn.addEventListener("click", handleLogin);
}

// Press Enter in either input
if (emailInput) {
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });
}
if (passwordInput) {
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });
}

// logout handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } finally {
      window.location.href = "index.html";
    }
  });
}

// auth state redirect
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;

  // if not logged in, redir to login  
  if (!user && path.includes("dashboard.html")) {
    window.location.href = "index.html";
  }

  if (user && (path.endsWith("/") || path.includes("index.html"))) {
    window.location.href = "dashboard.html";
  }
});
