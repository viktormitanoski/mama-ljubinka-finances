import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

/* ---------------- References ---------------- */
const utilitiesRef = collection(db, "utilities");

/* ---------------- Elements ---------------- */
const utilTableBody = document.querySelector("#utilitiesTable tbody");

// Form
const utilTypeInput = document.getElementById("utilityType");
const utilAmountInput = document.getElementById("utilityAmount");
const utilDateInput = document.getElementById("utilityDate");
const addUtilityBtn = document.getElementById("addUtilityBtn");

// Filters
const utilDayFilter = document.getElementById("utilDayFilter");
const utilMonthFilter = document.getElementById("utilMonthFilter");
const utilYearFilter = document.getElementById("utilYearFilter");
const utilTypeFilter = document.getElementById("utilTypeFilter");
const clearUtilFilters = document.getElementById("clearUtilFilters");
const utilTotalEl = document.getElementById("utilTotal");

let utilEditId = null;
let utilities = [];

/* ---------------- Render ---------------- */
function renderUtilities() {
  utilTableBody.innerHTML = "";
  let total = 0;

  const day = utilDayFilter.value;
  const month = utilMonthFilter.value;
  const year = utilYearFilter.value;
  const typeFilter = utilTypeFilter.value;

  let filteredUtilities = utilities.filter((data) => {
    const [y, m, d] = data.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (typeFilter && data.type !== typeFilter) return false;
    return true;
  });

  filteredUtilities
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach((data) => {

    total += data.amount || 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.type}</td>
      <td>${data.amount}</td>
      <td>${data.date}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-util" data-id="${data.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-util" data-id="${data.id}">Избриши</button>
      </td>
    `;
    utilTableBody.appendChild(row);
  });

  utilTotalEl.textContent = total;
}

/* ---------------- Add / Update ---------------- */
addUtilityBtn.addEventListener("click", async () => {
  const type = utilTypeInput.value;
  const amount = Number(utilAmountInput.value);
  const date = utilDateInput.value;

  if (!type || !amount || !date) {
    alert("Пополнете ги задолжителните полиња (Тип, Вкупно, Датум)");
    return;
  }

  const docData = { type, amount, date };

  try {
    if (utilEditId) {
      await updateDoc(doc(db, "utilities", utilEditId), docData);
      utilEditId = null;
      addUtilityBtn.textContent = "Зачувај";
    } else {
      await addDoc(utilitiesRef, docData);
    }

    // Reset form
    utilTypeInput.value = "Електрична енергија погон";
    utilAmountInput.value = "";
    utilDateInput.value = "";
  } catch (error) {
    console.error("Error saving utility: ", error);
    alert("Грешка при зачувување: " + error.message);
  }
});

/* ---------------- Edit/Delete ---------------- */
utilTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-util")) {
    const id = e.target.dataset.id;
    const utility = utilities.find(u => u.id === id);
    
    if (utility) {
      utilTypeInput.value = utility.type;
      utilAmountInput.value = utility.amount;
      utilDateInput.value = utility.date;
      utilEditId = id;
      addUtilityBtn.textContent = "Ажурирај";
    }
  }

  if (e.target.classList.contains("delete-util")) {
    if (confirm("Дали сте сигурни дека сакате да го избришете овој запис?")) {
      try {
        await deleteDoc(doc(db, "utilities", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting utility: ", error);
        alert("Грешка при бришење: " + error.message);
      }
    }
  }
});

/* ---------------- Filters ---------------- */
[utilDayFilter, utilMonthFilter, utilYearFilter, utilTypeFilter].forEach((el) =>
  el.addEventListener("change", renderUtilities)
);

clearUtilFilters.addEventListener("click", (e) => {
  e.preventDefault();
  utilDayFilter.value = "";
  utilMonthFilter.value = "";
  utilYearFilter.value = "";
  utilTypeFilter.value = "";
  renderUtilities();
});

/* ---------------- Live Updates ---------------- */
onSnapshot(utilitiesRef, (snapshot) => {
  utilities = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
  renderUtilities();
});

/* ---------------- Init ---------------- */
// Initialize day filter
for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = i < 10 ? `0${i}` : `${i}`;
  option.textContent = i;
  utilDayFilter.appendChild(option);
}

// Initialize year filter
const currentYear = new Date().getFullYear();
for (let year = currentYear - 5; year <= currentYear; year++) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  utilYearFilter.appendChild(option);
}