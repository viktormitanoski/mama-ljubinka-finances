import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ---------------- References ---------------- */
const materialsRef = collection(db, "materials");

// Table body
const matTableBody = document.querySelector("#materialsTable tbody");

// Invoice form
const vendorInput = document.getElementById("matVendor");
const invoiceNameInput = document.getElementById("matInvoiceName");
const invoiceQuantityInput = document.getElementById("matInvoiceQuantity");
const invoiceWeightInput = document.getElementById("matInvoiceWeight");
const invoiceAmountInput = document.getElementById("matInvoiceAmount");
const invoiceDateInput = document.getElementById("matInvoiceDate");
const addMaterialInvoiceBtn = document.getElementById("addMaterialInvoiceBtn");

// Cash form
const cashItemInput = document.getElementById("cashItem");
const cashVendorInput = document.getElementById("cashVendor");
const cashQuantityInput = document.getElementById("cashQuantity");
const cashWeightInput = document.getElementById("cashWeight");
const cashAmountInput = document.getElementById("cashAmount");
const cashDateInput = document.getElementById("cashDate");
const addCashBtn = document.getElementById("addCashBtn");

// Filters
const matDayFilter = document.getElementById("matDayFilter");
const matMonthFilter = document.getElementById("matMonthFilter");
const matYearFilter = document.getElementById("matYearFilter");
const matTypeFilter = document.getElementById("matTypeFilter");
const matVendorFilter = document.getElementById("matVendorFilter");
const clearMatFilters = document.getElementById("clearMatFilters");
const matTotalEl = document.getElementById("matTotal");

let matEditId = null;
let materials = [];

/* ---------------- Render ---------------- */
function renderMaterials() {
  matTableBody.innerHTML = "";
  let total = 0;

  const day = matDayFilter.value;
  const month = matMonthFilter.value;
  const year = matYearFilter.value;
  const typeFilter = matTypeFilter.value;
  const vendorFilter = matVendorFilter.value;

  let filteredMaterials = materials.filter((data) => {
    const dateObj = new Date(data.date);
    const materialDay = String(dateObj.getDate()).padStart(2, "0");
    const materialMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const materialYear = String(dateObj.getFullYear());

    if (day && materialDay !== day) return false;
    if (month && materialMonth !== month) return false;
    if (year && materialYear !== year) return false;
    if (typeFilter && data.type !== typeFilter) return false;
    if (vendorFilter && data.vendor !== vendorFilter) return false;
    return true;
  });

  filteredMaterials
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach((data) => {

    total += data.amount || 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.type === "invoice" ? "Фактура" : "Кеш"}</td>
      <td>${data.item}</td>
      <td>${data.vendor}</td>
      <td>${data.quantity || ""}</td>
      <td>${data.weight || ""}</td>
      <td>${data.amount}</td>
      <td>${data.date}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-mat" data-id="${data.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-mat" data-id="${data.id}">Избриши</button>
      </td>
    `;
    matTableBody.appendChild(row);
  });

  matTotalEl.textContent = total;

  // Populate vendor filter
  const vendors = [...new Set(materials.map(item => item.vendor).filter(v => v))];
  matVendorFilter.innerHTML = '<option value="">Сите добавувачи</option>';
  vendors.forEach(vendor => {
    if (vendor && ![...matVendorFilter.options].some(o => o.value === vendor)) {
      const option = document.createElement("option");
      option.value = vendor;
      option.textContent = vendor;
      matVendorFilter.appendChild(option);
    }
  });
}

/* ---------------- Add / Update ---------------- */
addMaterialInvoiceBtn.addEventListener("click", async () => {
  const vendor = vendorInput.value;
  const item = invoiceNameInput.value.trim();
  const quantity = invoiceQuantityInput.value ? Number(invoiceQuantityInput.value) : null;
  const weight = invoiceWeightInput.value ? Number(invoiceWeightInput.value) : null;
  const amountStr = invoiceAmountInput.value.trim();
  const amount = Number(amountStr);
  const date = invoiceDateInput.value;

  // Add this at the beginning of the click handler
  console.log("Vendor:", vendorInput.value);
  console.log("Item:", invoiceNameInput.value);
  console.log("Amount:", invoiceAmountInput.value);
  console.log("Date:", invoiceDateInput.value);

  console.log("Form values:", {vendor, item, quantity, weight, amount, date});

  // Better validation with more specific checks
  if (vendor === "") {
    alert("Изберете добавувач");
    return;
  }
  if (item === "") {
    alert("Внесете име на артикал");
    return;
  }
  if (amountStr === "" || isNaN(amount)) {
    alert("Внесете валидна вредност за вкупно");
    return;
  }
  if (date === "") {
    alert("Изберете датум");
    return;
  }

  // Rest of the code remains the same...
  const docData = { 
    type: "invoice", 
    vendor, 
    item, 
    quantity, 
    weight, 
    amount, 
    date 
  };

  try {
    if (matEditId) {
      await updateDoc(doc(db, "materials", matEditId), docData);
      matEditId = null;
      addMaterialInvoiceBtn.textContent = "Зачувај";
    } else {
      await addDoc(materialsRef, docData);
    }

    // Reset form
    vendorInput.value = "";
    invoiceNameInput.value = "";
    invoiceQuantityInput.value = "";
    invoiceWeightInput.value = "";
    invoiceAmountInput.value = "";
    invoiceDateInput.value = "";
  } catch (error) {
    console.error("Error saving material: ", error);
    alert("Грешка при зачувување: " + error.message);
  }
});

addCashBtn.addEventListener("click", async () => {
  const vendor = cashVendorInput.value.trim();
  const item = cashItemInput.value.trim();
  const quantity = cashQuantityInput.value ? Number(cashQuantityInput.value) : null;
  const weight = cashWeightInput.value ? Number(cashWeightInput.value) : null;
  const amount = Number(cashAmountInput.value);
  const date = cashDateInput.value;

  if (!vendor || !item || !amount || !date) {
    alert("Пополнете ги задолжителните полиња (Добавувач, Артикал, Вкупно, Датум)");
    return;
  }

  const docData = { 
    type: "cash", 
    vendor, 
    item, 
    quantity, 
    weight, 
    amount, 
    date 
  };

  try {
    if (matEditId) {
      await updateDoc(doc(db, "materials", matEditId), docData);
      matEditId = null;
      addCashBtn.textContent = "Зачувај";
    } else {
      await addDoc(materialsRef, docData);
    }

    // Reset form
    cashVendorInput.value = "";
    cashItemInput.value = "";
    cashQuantityInput.value = "";
    cashWeightInput.value = "";
    cashAmountInput.value = "";
    cashDateInput.value = "";
  } catch (error) {
    console.error("Error saving cash material: ", error);
    alert("Грешка при зачувување: " + error.message);
  }
});

/* ---------------- Edit/Delete ---------------- */
matTableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-mat")) {
    const id = e.target.dataset.id;
    const material = materials.find(m => m.id === id);
    
    if (!material) return;
    
    matEditId = id;
    
    if (material.type === "invoice") {
      vendorInput.value = material.vendor || "";
      invoiceNameInput.value = material.item || "";
      invoiceQuantityInput.value = material.quantity || "";
      invoiceWeightInput.value = material.weight || "";
      invoiceAmountInput.value = material.amount || "";
      invoiceDateInput.value = material.date || "";
      addMaterialInvoiceBtn.textContent = "Ажурирај";
      
      // Switch to invoice form tab if needed
      const invoiceTab = document.querySelector('[data-bs-target="#invoice-tab"]');
      if (invoiceTab) invoiceTab.click();
    } else {
      cashVendorInput.value = material.vendor || "";
      cashItemInput.value = material.item || "";
      cashQuantityInput.value = material.quantity || "";
      cashWeightInput.value = material.weight || "";
      cashAmountInput.value = material.amount || "";
      cashDateInput.value = material.date || "";
      addCashBtn.textContent = "Ажурирај";
      
      // Switch to cash form tab if needed
      const cashTab = document.querySelector('[data-bs-target="#cash-tab"]');
      if (cashTab) cashTab.click();
    }
  }

  if (e.target.classList.contains("delete-mat")) {
    if (confirm("Дали сте сигурни дека сакате да го избришете овој запис?")) {
      try {
        await deleteDoc(doc(db, "materials", e.target.dataset.id));
      } catch (error) {
        console.error("Error deleting material: ", error);
        alert("Грешка при бришење: " + error.message);
      }
    }
  }
});

/* ---------------- Filters ---------------- */
[matDayFilter, matMonthFilter, matYearFilter, matTypeFilter, matVendorFilter].forEach((el) =>
  el.addEventListener("change", renderMaterials)
);

clearMatFilters.addEventListener("click", (e) => {
  e.preventDefault();
  matDayFilter.value = "";
  matMonthFilter.value = "";
  matYearFilter.value = "";
  matTypeFilter.value = "";
  matVendorFilter.value = "";
  renderMaterials();
});

/* ---------------- Live Updates ---------------- */
onSnapshot(materialsRef, (snapshot) => {
  materials = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
  renderMaterials();
});

/* ---------------- Init ---------------- */
// Initialize day filter
for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = i < 10 ? `0${i}` : `${i}`;
  option.textContent = i;
  matDayFilter.appendChild(option);
}

// Initialize year filter
const currentYear = new Date().getFullYear();
for (let year = currentYear - 5; year <= currentYear; year++) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  matYearFilter.appendChild(option);
}

// At the end of materials.js
invoiceDateInput.valueAsDate = new Date();
cashDateInput.valueAsDate = new Date();