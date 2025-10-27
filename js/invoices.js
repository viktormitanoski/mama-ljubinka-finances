import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ================== DOM Elements ==================

// Companies
const companyNameInput = document.getElementById("companyName");
const addCompanyBtn = document.getElementById("addCompanyBtn");
const companiesTableBody = document.querySelector("#companiesTable tbody");

// Invoices
const invoiceCompanySelect = document.getElementById("invoiceCompany");
const invoiceArticleInput = document.getElementById("invoiceArticle");
const invoiceQuantityInput = document.getElementById("invoiceQuantity");
const invoiceWeightInput = document.getElementById("invoiceWeight");
const invoiceTotalInput = document.getElementById("invoiceTotal");
const invoiceDateInput = document.getElementById("invoiceDate");
const addInvoiceBtn = document.getElementById("addInvoiceBtnVlez");
const invoicesTableBody = document.querySelector("#invoicesTable tbody");

// Totals
const invoiceTotalSumEl = document.getElementById("invTotal");
const invoiceFiskTotalEl = document.getElementById("invFiskalenTotal");
const invoiceNetEl = document.getElementById("invNet");

// Filters
const invDayFilter = document.getElementById("invDayFilter");
const invMonthFilter = document.getElementById("invMonthFilter");
const invYearFilter = document.getElementById("invYearFilter");
const invCompanyFilter = document.getElementById("invCompanyFilter");
const clearInvoiceFiltersBtn = document.getElementById("clearInvoiceFilters");

// ================== State ==================
let companies = [];
let invoices = [];
let companyEditId = null;
let invoiceEditId = null;

// ================== Firestore Collections ==================
const companiesRef = collection(db, "companies");
const invoicesRef = collection(db, "invoices");

// ================== Companies ==================

// Render companies table
function renderCompanies() {
  companiesTableBody.innerHTML = "";
  companies.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-company" data-id="${c.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-company" data-id="${c.id}">Избриши</button>
      </td>
    `;
    companiesTableBody.appendChild(tr);
  });

  // Update dropdown filter + form select
  invoiceCompanySelect.innerHTML = `<option value="">Избери компанија</option>`;
  invCompanyFilter.innerHTML = `<option value="">Сите компании</option>`;
  companies.forEach(c => {
    invoiceCompanySelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    invCompanyFilter.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });
}

// Save company
addCompanyBtn.addEventListener("click", async () => {
  const name = companyNameInput.value.trim();
  if (!name) {
    alert("Внесете име на компанија");
    return;
  }

  try {
    if (companyEditId) {
      await updateDoc(doc(db, "companies", companyEditId), { name });
      companyEditId = null;
      addCompanyBtn.textContent = "Зачувај";
    } else {
      await addDoc(companiesRef, { name });
    }
    companyNameInput.value = "";
  } catch (error) {
    console.error("Error saving company: ", error);
    alert("Грешка при зачувување на компанија: " + error.message);
  }
});

// Company table event delegation
companiesTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-company")) {
    const companyId = e.target.dataset.id;
    const company = companies.find(c => c.id === companyId);
    if (company) {
      companyNameInput.value = company.name;
      companyEditId = company.id;
      addCompanyBtn.textContent = "Измени";
    }
  }
  
  if (e.target.classList.contains("delete-company")) {
    if (confirm("Дали сте сигурни дека сакате да ја избришете оваа компанија?")) {
      try {
        await deleteDoc(doc(db, "companies", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting company: ", error);
        alert("Грешка при бришење на компанија: " + error.message);
      }
    }
  }
});

// Live update companies
onSnapshot(companiesRef, snap => {
  companies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCompanies();
});

// ================== Invoices ==================

// Render invoices
function renderInvoices() {
  invoicesTableBody.innerHTML = "";

  const day = invDayFilter.value;
  const month = invMonthFilter.value;
  const year = invYearFilter.value;
  const companyFilter = invCompanyFilter.value;

  let filtered = invoices.filter(inv => {
    const [y, m, d] = inv.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (companyFilter && inv.company !== companyFilter) return false;
    return true;
  });

  let totalSum = 0;
  let fiskTotal = 0;

  filtered
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach(inv => {

    totalSum += Number(inv.total);
    fiskTotal += Number(inv.total); // for invoices, fisk = total

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${inv.company}</td>
      <td>${inv.article}</td>
      <td>${inv.quantity ? inv.quantity : "-"}</td>
      <td>${inv.weight ? inv.weight + " kg" : "-"}</td>
      <td>${inv.total}</td>
      <td>${inv.date}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-invoice" data-id="${inv.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-invoice" data-id="${inv.id}">Избриши</button>
      </td>
    `;
    invoicesTableBody.appendChild(tr);
  });

  // Update totals
  invoiceTotalSumEl.textContent = totalSum;
  invoiceFiskTotalEl.textContent = fiskTotal;
  invoiceNetEl.textContent = totalSum - fiskTotal;
}

// Save invoice
addInvoiceBtn.addEventListener("click", async () => {
  const company = invoiceCompanySelect.value;
  const article = invoiceArticleInput.value.trim();
  const quantity = invoiceQuantityInput.value;
  const weight = invoiceWeightInput.value;
  const total = invoiceTotalInput.value;
  const date = invoiceDateInput.value;

  if (!company || !article || !total || !date) {
    alert("Пополнете ги задолжителните полиња (Компанија, Артикал, Вкупно, Датум)");
    return;
  }

  // Количина и Килограми не се задолжителни
  const docData = {
    company,
    article,
    quantity: quantity || null,
    weight: weight ? Number(weight) : null,
    total: Number(total),
    date
  };

  try {
    if (invoiceEditId) {
      await updateDoc(doc(db, "invoices", invoiceEditId), docData);
      invoiceEditId = null;
      addInvoiceBtn.textContent = "Зачувај";
    } else {
      await addDoc(invoicesRef, docData);
    }

    // Reset form
    invoiceCompanySelect.value = "";
    invoiceArticleInput.value = "";
    invoiceQuantityInput.value = "";
    invoiceWeightInput.value = "";
    invoiceTotalInput.value = "";
    invoiceDateInput.value = "";
  } catch (error) {
    console.error("Error saving invoice: ", error);
    alert("Грешка при зачувување на фактура: " + error.message);
  }
});

// Invoice table event delegation
invoicesTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-invoice")) {
    const invoiceId = e.target.dataset.id;
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
      invoiceCompanySelect.value = invoice.company;
      invoiceArticleInput.value = invoice.article;
      invoiceQuantityInput.value = invoice.quantity || "";
      invoiceWeightInput.value = invoice.weight || "";
      invoiceTotalInput.value = invoice.total;
      invoiceDateInput.value = invoice.date;
      invoiceEditId = invoice.id;
      addInvoiceBtn.textContent = "Измени";
    }
  }
  
  if (e.target.classList.contains("delete-invoice")) {
    if (confirm("Дали сте сигурни дека сакате да ја избришете оваа фактура?")) {
      try {
        await deleteDoc(doc(db, "invoices", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting invoice: ", error);
        alert("Грешка при бришење на фактура: " + error.message);
      }
    }
  }
});

// Live update invoices
onSnapshot(invoicesRef, snap => {
  invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  populateInvoiceYears();
  renderInvoices();
});

// ================== Filters ==================
function populateInvoiceYears() {
  const years = [...new Set(invoices.map(inv => inv.date.split("-")[0]))].sort();
  invYearFilter.innerHTML = `<option value="">Година</option>`;
  years.forEach(y => {
    invYearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });
}

// Initialize day filter
for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = i < 10 ? `0${i}` : `${i}`;
  option.textContent = i;
  invDayFilter.appendChild(option);
}

[invDayFilter, invMonthFilter, invYearFilter, invCompanyFilter].forEach(el => {
  el.addEventListener("change", renderInvoices);
});

clearInvoiceFiltersBtn.addEventListener("click", e => {
  e.preventDefault();
  invDayFilter.value = "";
  invMonthFilter.value = "";
  invYearFilter.value = "";
  invCompanyFilter.value = "";
  renderInvoices();
});