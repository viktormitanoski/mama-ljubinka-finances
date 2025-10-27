import { db } from "./firebase-config.js";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// DOM elements for Pogon
const pogonForm = document.getElementById("pogonForm");
const pogonCakeInput = document.getElementById("pogonCake");
const pogonMethodInput = document.getElementById("pogonMethod");
const pogonQuantityInput = document.getElementById("pogonQuantity");
const pogonWeightInput = document.getElementById("pogonWeight");
const pogonPiecesInput = document.getElementById("pogonPieces");
const pogonTotalInput = document.getElementById("pogonTotal");
const pogonFiskInput = document.getElementById("pogonFisk");
const pogonDateInput = document.getElementById("pogonDate");
const pogonSentInput = document.getElementById("pogonSent");
const pogonDecorationInput = document.getElementById("pogonDecoration");
const addPogonBtn = document.getElementById("addPogonBtn");
const pogonTableBody = document.querySelector("#pogonTable tbody");

// DOM elements for Slatkar
const slatkarForm = document.getElementById("slatkarForm");
const slatkarMethodInput = document.getElementById("slatkarMethod");
const slatkarTotalInput = document.getElementById("slatkarTotal");
const slatkarFiskInput = document.getElementById("slatkarFisk");
const slatkarDateInput = document.getElementById("slatkarDate");
const addSlatkarBtn = document.getElementById("addSlatkarBtn");
const slatkarTableBody = document.querySelector("#slatkarTable tbody");

// DOM elements for Vkupen
const vkupenTableBody = document.querySelector("#vkupenTable tbody");

// Filters
const pogonDayFilter = document.getElementById("pogonDayFilter");
const pogonMonthFilter = document.getElementById("pogonMonthFilter");
const pogonYearFilter = document.getElementById("pogonYearFilter");
const clearPogonFilters = document.getElementById("clearPogonFilters");

const slatkarDayFilter = document.getElementById("slatkarDayFilter");
const slatkarMonthFilter = document.getElementById("slatkarMonthFilter");
const slatkarYearFilter = document.getElementById("slatkarYearFilter");
const slatkarMethodFilter = document.getElementById("slatkarMethodFilter");
const pogonTortaFilter = document.getElementById("pogonTortaFilter");
const clearSlatkarFilters = document.getElementById("clearSlatkarFilters");

const vkupenDayFilter = document.getElementById("vkupenDayFilter");
const vkupenMonthFilter = document.getElementById("vkupenMonthFilter");
const vkupenYearFilter = document.getElementById("vkupenYearFilter");
const vkupenSourceFilter = document.getElementById("vkupenSourceFilter");
const vkupenMethodFilter = document.getElementById("vkupenMethodFilter");
const clearVkupenFilters = document.getElementById("clearVkupenFilters");

// Totals
const pogonTotalSumEl = document.getElementById("pogonTotalSum");
const pogonFiskTotalEl = document.getElementById("pogonFiskTotal");
const pogonNetEl = document.getElementById("pogonNet");

const slatkarTotalSumEl = document.getElementById("slatkarTotalSum");
const slatkarFiskTotalEl = document.getElementById("slatkarFiskTotal");
const slatkarNetEl = document.getElementById("slatkarNet");

const vkupenTotalSumEl = document.getElementById("vkupenTotalSum");
const vkupenFiskTotalEl = document.getElementById("vkupenFiskTotal");
const vkupenNetEl = document.getElementById("vkupenNet");

// State
let pogonEditId = null;
let slatkarEditId = null;
let pogonTransactions = [];
let slatkarTransactions = [];
let invoiceTransactions = [];

// Firestore collections
const pogonRef = collection(db, "pogon_transactions");
const slatkarRef = collection(db, "slatkar_transactions");
const invoicesRef = collection(db, "invoices");

// ================== Pogon Transactions ==================

// Add Pogon transaction
addPogonBtn.addEventListener("click", async () => {
  const cake = pogonCakeInput.value;
  const method = pogonMethodInput.value;
  const quantity = pogonQuantityInput.value;
  const weight = pogonWeightInput.value;
  const pieces = pogonPiecesInput.value;
  const total = pogonTotalInput.value;
  const fisk = pogonFiskInput.value;
  const date = pogonDateInput.value;
  const sent = pogonSentInput.checked;
  const decoration = pogonDecorationInput.checked;

  if (!cake || !date) {
    alert("Пополнете ги задолжителните полиња (Торта, Метод, Датум)");
    return;
  }

  const docData = {
    cake,
    method,
    quantity: quantity || null,
    weight: weight ? Number(weight) : null,
    pieces: pieces ? Number(pieces) : null,
    total: Number(total),
    fisk: Number(fisk),
    date,
    sent,
    decoration
  };

  try {
    if (pogonEditId) {
      await updateDoc(doc(db, "pogon_transactions", pogonEditId), docData);
      pogonEditId = null;
      addPogonBtn.textContent = "Зачувај";
    } else {
      await addDoc(pogonRef, docData);
    }

    // Reset form
    pogonCakeInput.value = "";
    pogonMethodInput.value = "Кеш";
    pogonQuantityInput.value = "";
    pogonWeightInput.value = "";
    pogonPiecesInput.value = "";
    pogonTotalInput.value = "";
    pogonFiskInput.value = "";
    pogonDateInput.value = "";
    pogonSentInput.checked = false;
    pogonDecorationInput.checked = false;
  } catch (error) {
    console.error("Error saving pogon transaction: ", error);
    alert("Грешка при зачувување на трансакција: " + error.message);
  }
});

// Render Pogon transactions
function renderPogonTransactions() {
  const day = pogonDayFilter.value;
  const month = pogonMonthFilter.value;
  const year = pogonYearFilter.value;
  const torta = pogonTortaFilter.value;


  pogonTableBody.innerHTML = "";
  let totalSum = 0;
  let fiskTotal = 0;

  let filtered = pogonTransactions.filter(t => {
    const [y, m, d] = t.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (torta && t.cake !== torta) return false; // <— new condition
    return true;
  });


  filtered
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
    .forEach(t => {
      totalSum += Number(t.total);
      fiskTotal += Number(t.fisk);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.cake}</td>
        <td>${t.method || "-"}</td>
        <td>${t.quantity || "-"}</td>
        <td>${t.pieces != null ? `${t.pieces}` : "-"}</td>
        <td>${t.weight != null ? `${t.weight} kg` : "-"}</td>
        <td>${t.total}</td>
        <td>${t.fisk}</td>
        <td>${t.date}</td>
        <td>${t.sent ? "Да" : "Не"}</td>
        <td>${t.decoration ? "Да" : "Не"}</td>
        <td>
          <button class="btn btn-sm btn-warning edit-pogon" data-id="${t.id}">Измени</button>
          <button class="btn btn-sm btn-danger delete-pogon" data-id="${t.id}">Избриши</button>
        </td>
      `;
      pogonTableBody.appendChild(tr);
    });

  pogonTotalSumEl.textContent = totalSum;
  pogonFiskTotalEl.textContent = fiskTotal;
  pogonNetEl.textContent = totalSum - fiskTotal;
}


// Pogon table event delegation
pogonTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-pogon")) {
    const id = e.target.dataset.id;
    const transaction = pogonTransactions.find(t => t.id === id);
    
    if (transaction) {
      pogonCakeInput.value = transaction.cake;
      pogonMethodInput.value = transaction.method;
      pogonQuantityInput.value = transaction.quantity || "";
      pogonWeightInput.value = transaction.weight || "";
      pogonPiecesInput.value = transaction.pieces || "";
      pogonTotalInput.value = transaction.total;
      pogonFiskInput.value = transaction.fisk;
      pogonDateInput.value = transaction.date;
      pogonSentInput.checked = transaction.sent;
      pogonDecorationInput.checked = transaction.decoration;
      pogonEditId = id;
      addPogonBtn.textContent = "Ажурирај";
    }
  }
  
  if (e.target.classList.contains("delete-pogon")) {
    if (confirm("Дали сте сигурни дека сакате да ја избришете оваа трансакција?")) {
      try {
        await deleteDoc(doc(db, "pogon_transactions", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting pogon transaction: ", error);
        alert("Грешка при бришење на трансакција: " + error.message);
      }
    }
  }
});

// ================== Slatkar Transactions ==================

// Add Slatkar transaction
addSlatkarBtn.addEventListener("click", async () => {
  const method = slatkarMethodInput.value;
  const total = slatkarTotalInput.value;
  const fisk = slatkarFiskInput.value;
  const date = slatkarDateInput.value;

  if (!method || !total || !fisk || !date) {
    alert("Пополнете ги задолжителните полиња (Метод, Вкупно, Фискален, Датум)");
    return;
  }

  const docData = {
    method,
    total: Number(total),
    fisk: Number(fisk),
    date
  };

  try {
    if (slatkarEditId) {
      await updateDoc(doc(db, "slatkar_transactions", slatkarEditId), docData);
      slatkarEditId = null;
      addSlatkarBtn.textContent = "Зачувај";
    } else {
      await addDoc(slatkarRef, docData);
    }

    // Reset form
    slatkarMethodInput.value = "Кеш";
    slatkarTotalInput.value = "";
    slatkarFiskInput.value = "";
    slatkarDateInput.value = "";
  } catch (error) {
    console.error("Error saving slatkar transaction: ", error);
    alert("Грешка при зачувување на трансакција: " + error.message);
  }
});

// Render Slatkar transactions
function renderSlatkarTransactions() {
  const day = slatkarDayFilter.value;
  const month = slatkarMonthFilter.value;
  const year = slatkarYearFilter.value;
  const methodFilter = slatkarMethodFilter.value;

  slatkarTableBody.innerHTML = "";
  let totalSum = 0;
  let fiskTotal = 0;

  let filtered = slatkarTransactions.filter(t => {
    const [y, m, d] = t.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (methodFilter && t.method !== methodFilter) return false;
    return true;
  });

  filtered
  .sort((a, b) => new Date(b.date) - new Date(a.date)) // sort by newest first
  .forEach(t => {

    totalSum += Number(t.total);
    fiskTotal += Number(t.fisk);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.method}</td>
      <td>${t.total}</td>
      <td>${t.fisk}</td>
      <td>${t.date}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-slatkar" data-id="${t.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-slatkar" data-id="${t.id}">Избриши</button>
      </td>
    `;
    slatkarTableBody.appendChild(tr);
  });

  slatkarTotalSumEl.textContent = totalSum;
  slatkarFiskTotalEl.textContent = fiskTotal;
  slatkarNetEl.textContent = totalSum - fiskTotal;
}

// Slatkar table event delegation
slatkarTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-slatkar")) {
    const id = e.target.dataset.id;
    const transaction = slatkarTransactions.find(t => t.id === id);
    
    if (transaction) {
      slatkarMethodInput.value = transaction.method;
      slatkarTotalInput.value = transaction.total;
      slatkarFiskInput.value = transaction.fisk;
      slatkarDateInput.value = transaction.date;
      slatkarEditId = id;
      addSlatkarBtn.textContent = "Ажурирај";
    }
  }
  
  if (e.target.classList.contains("delete-slatkar")) {
    if (confirm("Дали сте сигурни дека сакате да ја избришете оваа трансакција?")) {
      try {
        await deleteDoc(doc(db, "slatkar_transactions", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting slatkar transaction: ", error);
        alert("Грешка при бришење на трансакција: " + error.message);
      }
    }
  }
});

// ================== Vkupen Promet ==================

// Render Vkupen Promet
// Render Vkupen Promet
function renderVkupenPromet() {
  const day = vkupenDayFilter.value;
  const month = vkupenMonthFilter.value;
  const year = vkupenYearFilter.value;
  const sourceFilter = vkupenSourceFilter.value;
  const methodFilter = vkupenMethodFilter.value;

  vkupenTableBody.innerHTML = "";
  let totalSum = 0;
  let fiskTotal = 0;

  // Combine all transactions
  const allTransactions = [
    ...pogonTransactions.filter(t => !t.sent).map(t => ({...t, source: "Погон", originalCollection: "pogon_transactions"})),
    ...slatkarTransactions.map(t => ({...t, source: "Слаткарница", originalCollection: "slatkar_transactions"})),
    ...invoiceTransactions.map(t => ({...t, source: "Излезни фактури", method: "Фактура", originalCollection: "invoices"}))
  ];

  // Group by date, source, and method
  const grouped = {};
  allTransactions.forEach(t => {
    const [y, m, d] = t.date.split("-");
    if (day && d !== day) return;
    if (month && m !== month) return;
    if (year && y !== year) return;
    if (sourceFilter && t.source !== sourceFilter) return;
    if (methodFilter && t.method !== methodFilter) return;

    const key = `${t.date}-${t.source}-${t.method}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: t.date,
        source: t.source,
        method: t.method,
        total: 0,
        fisk: 0,
        transactions: [] // Store individual transactions for deletion
      };
    }
    
    grouped[key].total += Number(t.total);
    grouped[key].fisk += Number(t.fisk || 0);
    grouped[key].transactions.push(t); // Add transaction to the group
  });

  // Convert to array and sort by date
  const groupedArray = Object.values(grouped).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  groupedArray.forEach(item => {
    totalSum += item.total;
    fiskTotal += item.fisk;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.source}</td>
      <td>${item.method}</td>
      <td>${item.total}</td>
      <td>${item.fisk}</td>
      <td>${item.total - item.fisk}</td>
      <td>
        <button class="btn btn-sm btn-danger delete-vkupen" data-transactions='${JSON.stringify(item.transactions)}'>Избриши</button>
      </td>
    `;
    vkupenTableBody.appendChild(tr);
  });

  vkupenTotalSumEl.textContent = totalSum;
  vkupenFiskTotalEl.textContent = fiskTotal;
  vkupenNetEl.textContent = totalSum - fiskTotal;
}

// Vkupen table event delegation for delete
vkupenTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-vkupen")) {
    if (confirm("Дали сте сигурни дека сакате ја избришете оваа трансакција?")) {
      try {
        const transactions = JSON.parse(e.target.dataset.transactions);
        
        // Delete each transaction from its original collection
        for (const transaction of transactions) {
          await deleteDoc(doc(db, transaction.originalCollection, transaction.id));
        }
      } catch (error) {
        console.error("Error deleting vkupen transactions: ", error);
        alert("Грешка при бришење на трансакции: " + error.message);
      }
    }
  }
});

// ================== Live Updates ==================

// Live updates for Pogon transactions
onSnapshot(pogonRef, (snapshot) => {
  pogonTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderPogonTransactions();
  renderVkupenPromet();
});

// Live updates for Slatkar transactions
onSnapshot(slatkarRef, (snapshot) => {
  slatkarTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderSlatkarTransactions();
  renderVkupenPromet();
});

// Live updates for Invoices
onSnapshot(invoicesRef, (snapshot) => {
  invoiceTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderVkupenPromet();
});

// ================== Filters ==================

// Initialize day filters
for (let i = 1; i <= 31; i++) {
  const day = i < 10 ? `0${i}` : `${i}`;
  
  const option1 = document.createElement("option");
  option1.value = day;
  option1.textContent = i;
  pogonDayFilter.appendChild(option1);
  
  const option2 = document.createElement("option");
  option2.value = day;
  option2.textContent = i;
  slatkarDayFilter.appendChild(option2);
  
  const option3 = document.createElement("option");
  option3.value = day;
  option3.textContent = i;
  vkupenDayFilter.appendChild(option3);
}

// Initialize year filters
const currentYear = new Date().getFullYear();
for (let year = currentYear - 2; year <= currentYear; year++) {
  const option1 = document.createElement("option");
  option1.value = year;
  option1.textContent = year;
  pogonYearFilter.appendChild(option1);
  
  const option2 = document.createElement("option");
  option2.value = year;
  option2.textContent = year;
  slatkarYearFilter.appendChild(option2);
  
  const option3 = document.createElement("option");
  option3.value = year;
  option3.textContent = year;
  vkupenYearFilter.appendChild(option3);
}

// Filter events
pogonDayFilter.addEventListener("change", renderPogonTransactions);
pogonMonthFilter.addEventListener("change", renderPogonTransactions);
pogonYearFilter.addEventListener("change", renderPogonTransactions);
pogonTortaFilter.addEventListener("change", renderPogonTransactions);


slatkarDayFilter.addEventListener("change", renderSlatkarTransactions);
slatkarMonthFilter.addEventListener("change", renderSlatkarTransactions);
slatkarYearFilter.addEventListener("change", renderSlatkarTransactions);
slatkarMethodFilter.addEventListener("change", renderSlatkarTransactions);

vkupenDayFilter.addEventListener("change", renderVkupenPromet);
vkupenMonthFilter.addEventListener("change", renderVkupenPromet);
vkupenYearFilter.addEventListener("change", renderVkupenPromet);
vkupenSourceFilter.addEventListener("change", renderVkupenPromet);
vkupenMethodFilter.addEventListener("change", renderVkupenPromet);

// Clear filter events
clearPogonFilters.addEventListener("click", () => {
  pogonDayFilter.value = "";
  pogonMonthFilter.value = "";
  pogonYearFilter.value = "";
  pogonTortaFilter.value = ""; 
  renderPogonTransactions();
});


clearSlatkarFilters.addEventListener("click", () => {
  slatkarDayFilter.value = "";
  slatkarMonthFilter.value = "";
  slatkarYearFilter.value = "";
  slatkarMethodFilter.value = "";
  renderSlatkarTransactions();
});

clearVkupenFilters.addEventListener("click", () => {
  vkupenDayFilter.value = "";
  vkupenMonthFilter.value = "";
  vkupenYearFilter.value = "";
  vkupenSourceFilter.value = "";
  vkupenMethodFilter.value = "";
  renderVkupenPromet();
});

// Set default date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('pogonDate').value = today;
document.getElementById('slatkarDate').value = today;