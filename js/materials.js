import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
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
let vendors = [];

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

  // Populate vendor filter from vendors collection (maintain order)
  matVendorFilter.innerHTML = '<option value="">Сите добавувачи</option>';
  if (vendors && vendors.length > 0) {
      vendors.forEach(vendor => {
          const option = document.createElement("option");
          option.value = vendor.name;
          option.textContent = vendor.name;
          matVendorFilter.appendChild(option);
      });
  }
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


// ================== Vendor Management ==================

// ================== Vendor Management ==================

// DOM elements for Vendor Management
const manageVendorsBtn = document.getElementById("manageVendorsBtn");
const vendorsModalElement = document.getElementById('vendorsModal');
const newVendorNameInput = document.getElementById("newVendorName");
const addVendorBtn = document.getElementById("addVendorBtn");
const vendorsTableBody = document.getElementById("vendorsTableBody");

// Only initialize vendor management if the elements exist
if (manageVendorsBtn && vendorsModalElement && newVendorNameInput && addVendorBtn && vendorsTableBody) {
    const vendorsModal = new bootstrap.Modal(vendorsModalElement);
    
    // Firestore collection for vendors
    const vendorsRef = collection(db, "vendors");

    // State
    let editVendorId = null;

    // Load vendors from Firestore and populate dropdown
    function loadVendors() {
        onSnapshot(vendorsRef, (snapshot) => {
            vendors = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data()
            }));
            
            // Sort vendors by order field to maintain the order they were added
            vendors.sort((a, b) => {
                // Use order field if available, otherwise use creation date
                const orderA = a.order !== undefined ? a.order : (a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0);
                const orderB = b.order !== undefined ? b.order : (b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0);
                
                return orderA - orderB;
            });
            
            populateVendorDropdown();
            renderVendorsTable();
            renderMaterials(); // Call this to update the filter with vendors
        });
    }

    // Populate vendor dropdown WITHOUT numbers
    function populateVendorDropdown() {
        vendorInput.innerHTML = '<option value="">Избери добавувач</option>';
        
        vendors.forEach((vendor) => {
            const option = document.createElement('option');
            option.value = vendor.name;
            option.textContent = vendor.name; // No numbering
            vendorInput.appendChild(option);
        });
        
        // Also populate cash vendor input if it exists
        if (cashVendorInput) {
            cashVendorInput.innerHTML = '<option value="">Избери добавувач</option>';
            vendors.forEach((vendor) => {
                const option = document.createElement('option');
                option.value = vendor.name;
                option.textContent = vendor.name; // No numbering
                cashVendorInput.appendChild(option);
            });
        }
    }

    // Render vendors table in modal with numbering
    function renderVendorsTable() {
        vendorsTableBody.innerHTML = '';
        
        vendors.forEach((vendor, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${vendor.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-vendor" data-id="${vendor.id}">
                        Измени
                    </button>
                    <button class="btn btn-sm btn-danger delete-vendor" data-id="${vendor.id}">
                        Избриши
                    </button>
                </td>
            `;
            vendorsTableBody.appendChild(tr);
        });
    }

    // Get the next order number for new vendors
    function getNextVendorOrderNumber() {
        if (vendors.length === 0) return 1;
        
        // Find the highest order number
        const maxOrder = Math.max(...vendors.map(vendor => vendor.order || 0));
        return maxOrder + 1;
    }

    // Add new vendor
    addVendorBtn.addEventListener("click", async () => {
        const vendorName = newVendorNameInput.value.trim();
        
        if (!vendorName) {
            alert("Внесете име на добавувачот!");
            return;
        }
        
        // Check if vendor already exists
        const existingVendor = vendors.find(vendor => 
            vendor.name.toLowerCase() === vendorName.toLowerCase()
        );
        
        if (existingVendor) {
            alert("Добавувач со ова име веќе постои!");
            return;
        }
        
        try {
            if (editVendorId) {
                // Update existing vendor
                await updateDoc(doc(db, "vendors", editVendorId), { 
                    name: vendorName 
                });
                editVendorId = null;
                addVendorBtn.textContent = "Додај";
            } else {
                // Add new vendor with order number
                const nextOrder = getNextVendorOrderNumber();
                await addDoc(vendorsRef, { 
                    name: vendorName,
                    order: nextOrder,
                    createdAt: new Date()
                });
            }
            
            newVendorNameInput.value = "";
        } catch (error) {
            console.error("Error saving vendor: ", error);
            alert("Грешка при зачувување на добавувач: " + error.message);
        }
    });

    // Vendors table event delegation
    vendorsTableBody.addEventListener("click", async (e) => {
        if (e.target.classList.contains("edit-vendor")) {
            const vendorId = e.target.dataset.id;
            const vendor = vendors.find(v => v.id === vendorId);
            
            if (vendor) {
                newVendorNameInput.value = vendor.name;
                editVendorId = vendorId;
                addVendorBtn.textContent = "Ажурирај";
                newVendorNameInput.focus();
            }
        }
        
        if (e.target.classList.contains("delete-vendor")) {
            const vendorId = e.target.dataset.id;
            const vendor = vendors.find(v => v.id === vendorId);
            
            if (vendor && confirm(`Дали сте сигурни дека сакате да го избришете добавувачот "${vendor.name}"?`)) {
                try {
                    await deleteDoc(doc(db, "vendors", vendorId));
                } catch (error) {
                    console.error("Error deleting vendor: ", error);
                    alert("Грешка при бришење на добавувач: " + error.message);
                }
            }
        }
    });

    // Open vendors management modal
    manageVendorsBtn.addEventListener("click", () => {
        // Reset form when opening modal
        newVendorNameInput.value = "";
        editVendorId = null;
        addVendorBtn.textContent = "Додај";
        vendorsModal.show();
    });

    // Add vendor on Enter key
    newVendorNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addVendorBtn.click();
        }
    });

    // Initialize vendors management - CALL IT HERE!
    loadVendors();

} else {
    console.log("Vendor management elements not found - skipping vendor management initialization");
}
