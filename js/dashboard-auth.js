// js/dashboard-auth.js
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      alert("Грешка при одјавување: " + err.message);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "index.html";
  }
});