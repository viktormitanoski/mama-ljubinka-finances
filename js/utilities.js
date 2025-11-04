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
const utilityTypesRef = collection(db, "utility_types");

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
let utilityTypes = [];

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

  // Populate type filter from utility types collection (maintain order)
  utilTypeFilter.innerHTML = '<option value="">Сите типови</option>';
  if (typeof utilityTypes !== 'undefined' && utilityTypes.length > 0) {
      utilityTypes.forEach(utilityType => {
          const option = document.createElement("option");
          option.value = utilityType.name;
          option.textContent = utilityType.name;
          utilTypeFilter.appendChild(option);
      });
  }
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
    utilTypeInput.value = "";
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

// ================== Utility Types Management ==================

// DOM elements for Utility Types Management
const manageUtilityTypesBtn = document.getElementById("manageUtilityTypesBtn");
const utilityTypesModalElement = document.getElementById('utilityTypesModal');
const newUtilityTypeNameInput = document.getElementById("newUtilityTypeName");
const addUtilityTypeBtn = document.getElementById("addUtilityTypeBtn");
const utilityTypesTableBody = document.getElementById("utilityTypesTableBody");


// Only initialize utility types management if the elements exist
if (manageUtilityTypesBtn && utilityTypesModalElement && newUtilityTypeNameInput && addUtilityTypeBtn && utilityTypesTableBody) {
    const utilityTypesModal = new bootstrap.Modal(utilityTypesModalElement);
    
    

    // State
    let editUtilityTypeId = null;

    // Load utility types from Firestore and populate dropdown
    function loadUtilityTypes() {
        onSnapshot(utilityTypesRef, (snapshot) => {
            utilityTypes = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data()
            }));
            
            // Sort utility types by order field to maintain the order they were added
            utilityTypes.sort((a, b) => {
                // Use order field if available, otherwise use creation date
                const orderA = a.order !== undefined ? a.order : (a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0);
                const orderB = b.order !== undefined ? b.order : (b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0);
                
                return orderA - orderB;
            });
            
            populateUtilityTypeDropdown();
            renderUtilityTypesTable();
            renderUtilities(); // Call this to update the filter with utility types
        });
    }

    // Populate utility type dropdown WITHOUT numbers
    function populateUtilityTypeDropdown() {
        utilTypeInput.innerHTML = '<option value="">Избери тип</option>';
        
        utilityTypes.forEach((utilityType) => {
            const option = document.createElement('option');
            option.value = utilityType.name;
            option.textContent = utilityType.name; // No numbering
            utilTypeInput.appendChild(option);
        });
    }

    // Render utility types table in modal with numbering
    function renderUtilityTypesTable() {
        utilityTypesTableBody.innerHTML = '';
        
        utilityTypes.forEach((utilityType, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${utilityType.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-utility-type" data-id="${utilityType.id}">
                        Измени
                    </button>
                    <button class="btn btn-sm btn-danger delete-utility-type" data-id="${utilityType.id}">
                        Избриши
                    </button>
                </td>
            `;
            utilityTypesTableBody.appendChild(tr);
        });
    }

    // Get the next order number for new utility types
    function getNextUtilityTypeOrderNumber() {
        if (utilityTypes.length === 0) return 1;
        
        // Find the highest order number
        const maxOrder = Math.max(...utilityTypes.map(utilityType => utilityType.order || 0));
        return maxOrder + 1;
    }

    // Add new utility type
    addUtilityTypeBtn.addEventListener("click", async () => {
        const utilityTypeName = newUtilityTypeNameInput.value.trim();
        
        if (!utilityTypeName) {
            alert("Внесете име на типот!");
            return;
        }
        
        // Check if utility type already exists
        const existingUtilityType = utilityTypes.find(utilityType => 
            utilityType.name.toLowerCase() === utilityTypeName.toLowerCase()
        );
        
        if (existingUtilityType) {
            alert("Тип со ова име веќе постои!");
            return;
        }
        
        try {
            if (editUtilityTypeId) {
                // Update existing utility type
                await updateDoc(doc(db, "utility_types", editUtilityTypeId), { 
                    name: utilityTypeName 
                });
                editUtilityTypeId = null;
                addUtilityTypeBtn.textContent = "Додај";
            } else {
                // Add new utility type with order number
                const nextOrder = getNextUtilityTypeOrderNumber();
                await addDoc(utilityTypesRef, { 
                    name: utilityTypeName,
                    order: nextOrder,
                    createdAt: new Date()
                });
            }
            
            newUtilityTypeNameInput.value = "";
        } catch (error) {
            console.error("Error saving utility type: ", error);
            alert("Грешка при зачувување на тип: " + error.message);
        }
    });

    // Utility types table event delegation
    utilityTypesTableBody.addEventListener("click", async (e) => {
        if (e.target.classList.contains("edit-utility-type")) {
            const utilityTypeId = e.target.dataset.id;
            const utilityType = utilityTypes.find(u => u.id === utilityTypeId);
            
            if (utilityType) {
                newUtilityTypeNameInput.value = utilityType.name;
                editUtilityTypeId = utilityTypeId;
                addUtilityTypeBtn.textContent = "Ажурирај";
                newUtilityTypeNameInput.focus();
            }
        }
        
        if (e.target.classList.contains("delete-utility-type")) {
            const utilityTypeId = e.target.dataset.id;
            const utilityType = utilityTypes.find(u => u.id === utilityTypeId);
            
            if (utilityType && confirm(`Дали сте сигурни дека сакате да го избришете типот "${utilityType.name}"?`)) {
                try {
                    await deleteDoc(doc(db, "utility_types", utilityTypeId));
                } catch (error) {
                    console.error("Error deleting utility type: ", error);
                    alert("Грешка при бришење на тип: " + error.message);
                }
            }
        }
    });

    // Open utility types management modal
    manageUtilityTypesBtn.addEventListener("click", () => {
        // Reset form when opening modal
        newUtilityTypeNameInput.value = "";
        editUtilityTypeId = null;
        addUtilityTypeBtn.textContent = "Додај";
        utilityTypesModal.show();
    });

    // Add utility type on Enter key
    newUtilityTypeNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addUtilityTypeBtn.click();
        }
    });

    // Initialize utility types management
    loadUtilityTypes();

} else {
    console.log("Utility types management elements not found - skipping utility types management initialization");
}
