// total-expenses.js
import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// DOM elements
const totalExpensesTableBody = document.querySelector("#totalExpensesTable tbody");
const totalExpensesSumEl = document.getElementById("totalExpensesSum");
const totalExpensesDayFilter = document.getElementById("totalExpensesDayFilter");
const totalExpensesMonthFilter = document.getElementById("totalExpensesMonthFilter");
const totalExpensesYearFilter = document.getElementById("totalExpensesYearFilter");
const totalExpensesTypeFilter = document.getElementById("totalExpensesTypeFilter");
const clearTotalExpensesFilters = document.getElementById("clearTotalExpensesFilters");

// State
let allExpenses = [];

// Initialize day filter
for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = i < 10 ? `0${i}` : `${i}`;
  option.textContent = i;
  totalExpensesDayFilter.appendChild(option);
}

// Initialize year filter
const currentYear = new Date().getFullYear();
for (let year = currentYear - 5; year <= currentYear; year++) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  totalExpensesYearFilter.appendChild(option);
}

// Function to render total expenses
function renderTotalExpenses() {
  const day = totalExpensesDayFilter.value;
  const month = totalExpensesMonthFilter.value;
  const year = totalExpensesYearFilter.value;
  const typeFilter = totalExpensesTypeFilter.value;

  totalExpensesTableBody.innerHTML = "";
  let total = 0;

  const filteredExpenses = allExpenses.filter(expense => {
    const [y, m, d] = expense.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (typeFilter && expense.type !== typeFilter) return false;
    return true;
  });

  filteredExpenses.forEach(expense => {
    total += expense.amount;
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.type === 'employees' ? 'Вработени' : expense.type === 'materials' ? 'Материјали' : 'Режиски трошоци'}</td>
      <td>${expense.description}</td>
      <td>${expense.amount}</td>
      <td>${expense.date}</td>
    `;
    totalExpensesTableBody.appendChild(row);
  });

  totalExpensesSumEl.textContent = total;
}

// Fetch data from all collections
function fetchAllExpenses() {
  allExpenses = [];
  
  // Employees
  onSnapshot(collection(db, "employees"), (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allExpenses.push({
        type: "employees",
        description: `${data.name} - Плата`,
        amount: data.salary,
        date: data.start_date
      });
    });
    renderTotalExpenses();
  });

  // Daily workers
  onSnapshot(collection(db, "daily_workers"), (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allExpenses.push({
        type: "employees",
        description: `${data.name} - Дневна плата`,
        amount: data.salary,
        date: data.date
      });
    });
    renderTotalExpenses();
  });

  // Materials
  onSnapshot(collection(db, "materials"), (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allExpenses.push({
        type: "materials",
        description: `${data.vendor} - ${data.item}`,
        amount: data.amount,
        date: data.date
      });
    });
    renderTotalExpenses();
  });

  // Utilities
  onSnapshot(collection(db, "utilities"), (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allExpenses.push({
        type: "utilities",
        description: data.type,
        amount: data.amount,
        date: data.date
      });
    });
    renderTotalExpenses();
  });
}

// Filter events
totalExpensesDayFilter.addEventListener("change", renderTotalExpenses);
totalExpensesMonthFilter.addEventListener("change", renderTotalExpenses);
totalExpensesYearFilter.addEventListener("change", renderTotalExpenses);
totalExpensesTypeFilter.addEventListener("change", renderTotalExpenses);

clearTotalExpensesFilters.addEventListener("click", () => {
  totalExpensesDayFilter.value = "";
  totalExpensesMonthFilter.value = "";
  totalExpensesYearFilter.value = "";
  totalExpensesTypeFilter.value = "";
  renderTotalExpenses();
});

// Initialize
fetchAllExpenses();