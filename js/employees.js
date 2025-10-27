import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Employee elements
const empTableBody = document.querySelector("#employeesTable tbody");
const dailyTableBody = document.querySelector("#dailyTable tbody");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const empTypeInput = document.getElementById("empType");
const empNameInput = document.getElementById("empName");
const empSalaryInput = document.getElementById("empSalary");
const empDateInput = document.getElementById("empDate");

// Work hours elements
const workEmpSelect = document.getElementById("workEmpName");
const workDateInput = document.getElementById("workDate");
const workHoursInput = document.getElementById("workHours");
const addWorkHourBtn = document.getElementById("addWorkHourBtn");
const workTableBody = document.querySelector("#workHoursTable tbody");

// Filters
const empMonthFilter = document.getElementById("empMonthFilter");
const empTypeFilter = document.getElementById("empTypeFilter");
const empNameFilter = document.getElementById("empNameFilter");
const clearEmpFilters = document.getElementById("clearEmpFilters");
const empTotalEl = document.getElementById("empTotal");

const workDayFilter = document.getElementById("workDayFilter");
const workMonthFilter = document.getElementById("workMonthFilter");
const workYearFilter = document.getElementById("workYearFilter");
const workNameFilter = document.getElementById("workNameFilter");
const clearWorkFilters = document.getElementById("clearWorkFilters");
const workTotalEl = document.getElementById("workTotal");

let editId = null;
let editType = null;
let workEditId = null;

let allContract = [];
let allDaily = [];
let allWork = [];
let allEmployees = [];

// === Employees Section ===
addEmployeeBtn.addEventListener("click", async () => {
  const type = empTypeInput.value;
  const name = empNameInput.value;
  const salary = empSalaryInput.value;
  const date = empDateInput.value;

  if (!name || !salary || !date) {
    alert("Пополнете ги сите полиња");
    return;
  }

  try {
    if (editId) {
      await updateDoc(
        doc(db, type === "contract" ? "employees" : "daily_workers", editId),
        {
          name,
          salary: Number(salary),
          date,
          start_date: date,
        }
      );
      editId = null;
      addEmployeeBtn.textContent = "Зачувај";
    } else {
      if (type === "contract") {
        await addDoc(collection(db, "employees"), {
          name,
          salary: Number(salary),
          start_date: date,
        });
      } else {
        await addDoc(collection(db, "daily_workers"), {
          name,
          salary: Number(salary),
          date,
        });
      }
    }

    // Reset form
    empNameInput.value = "";
    empSalaryInput.value = "";
    empDateInput.value = "";
  } catch (error) {
    console.error("Error saving employee: ", error);
    alert("Грешка при зачувување на вработен: " + error.message);
  }
});

// Live updates for employees
onSnapshot(collection(db, "employees"), (snapshot) => {
  allContract = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    type: "contract",
  }));
  allEmployees = [...allContract, ...allDaily];
  renderEmployees();
  populateWorkEmployeeDropdown();
  populateEmployeeNameFilter();
});

onSnapshot(collection(db, "daily_workers"), (snapshot) => {
  allDaily = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    type: "daily",
  }));
  allEmployees = [...allContract, ...allDaily];
  renderEmployees();
  populateWorkEmployeeDropdown();
  populateEmployeeNameFilter();
});

function renderEmployees() {
  const typeFilter = empTypeFilter.value;
  const month = empMonthFilter.value;
  const nameFilter = empNameFilter.value;

  empTableBody.innerHTML = "";
  dailyTableBody.innerHTML = "";
  let total = 0;

  let contracts = [...allContract];
  let dailies = [...allDaily];

  if (month) {
    contracts = contracts.filter((e) => e.start_date?.includes(month));
    dailies = dailies.filter((e) => e.date?.includes(month));
  }
  if (nameFilter) {
    contracts = contracts.filter((e) => e.name === nameFilter);
    dailies = dailies.filter((e) => e.name === nameFilter);
  }
  if (typeFilter === "contract") dailies = [];
  if (typeFilter === "daily") contracts = [];

  contracts
  .sort((a, b) => new Date(b.start_date || b.date) - new Date(a.start_date || a.date))
  .forEach((e) => {

    total += Number(e.salary);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.name}</td>
      <td>${e.salary}</td>
      <td>${e.start_date}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-employee" data-id="${e.id}" data-type="contract">Измени</button>
        <button class="btn btn-sm btn-danger delete-employee" data-id="${e.id}" data-type="contract">Избриши</button>
      </td>
    `;
    empTableBody.appendChild(row);
  });

  dailies
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach((d) => {

    total += Number(d.salary);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.name}</td>
      <td>${d.salary}</td>
      <td>${d.date}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-employee" data-id="${d.id}" data-type="daily">Измени</button>
        <button class="btn btn-sm btn-danger delete-employee" data-id="${d.id}" data-type="daily">Избриши</button>
      </td>
    `;
    dailyTableBody.appendChild(row);
  });

  empTotalEl.textContent = total.toFixed(2) + " ден.";
}

// Employee table event delegation
empTableBody.addEventListener("click", handleEmployeeAction);
dailyTableBody.addEventListener("click", handleEmployeeAction);

function handleEmployeeAction(e) {
  if (e.target.classList.contains("edit-employee")) {
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    const employee = (type === "contract" ? allContract : allDaily).find(emp => emp.id === id);
    
    if (employee) {
      empTypeInput.value = type;
      empNameInput.value = employee.name;
      empSalaryInput.value = employee.salary;
      empDateInput.value = employee.start_date || employee.date;
      editId = id;
      editType = type;
      addEmployeeBtn.textContent = "Ажурирај";
    }
  }
  
  if (e.target.classList.contains("delete-employee")) {
    deleteEmployee(e.target.dataset.id, e.target.dataset.type);
  }
}

async function deleteEmployee(id, type) {
  if (confirm("Дали сте сигурни дека сакате да го избришете овој запис?")) {
    try {
      await deleteDoc(doc(db, type === "contract" ? "employees" : "daily_workers", id));
    } catch (error) {
      console.error("Error deleting employee: ", error);
      alert("Грешка при бришење на вработен: " + error.message);
    }
  }
}

// === Populate Name Filter ===
function populateEmployeeNameFilter() {
  const names = [
    ...new Set([...allContract.map((e) => e.name), ...allDaily.map((d) => d.name)]),
  ];
  empNameFilter.innerHTML =
    `<option value="">Сите вработени</option>` +
    names.map((n) => `<option value="${n}">${n}</option>`).join("");
}

// Employee Filters
empMonthFilter.addEventListener("input", renderEmployees);
empTypeFilter.addEventListener("change", renderEmployees);
empNameFilter.addEventListener("change", renderEmployees);

clearEmpFilters.addEventListener("click", () => {
  empMonthFilter.value = "";
  empTypeFilter.value = "";
  empNameFilter.value = "";
  renderEmployees();
});

// === Work Hours Section ===

// Populate dropdowns with employee names
function populateWorkEmployeeDropdown() {
  const names = [
    ...new Set([...allContract.map((e) => e.name), ...allDaily.map((e) => e.name)]),
  ];
  if (workEmpSelect) {
    workEmpSelect.innerHTML = names
      .map((n) => `<option value="${n}">${n}</option>`)
      .join("");
  }
  if (workNameFilter) {
    workNameFilter.innerHTML =
      `<option value="">Сите вработени</option>` +
      names.map((n) => `<option value="${n}">${n}</option>`).join("");
  }
}

// Add Work Hour Entry
addWorkHourBtn.addEventListener("click", async () => {
  const name = workEmpSelect.value;
  const date = workDateInput.value;
  const hours = workHoursInput.value;

  if (!name || !date || !hours) {
    alert("Пополнете ги сите полиња");
    return;
  }

  try {
    if (workEditId) {
      await updateDoc(doc(db, "work_hours", workEditId), {
        name,
        date,
        hours: Number(hours),
      });
      workEditId = null;
      addWorkHourBtn.textContent = "Зачувај";
    } else {
      await addDoc(collection(db, "work_hours"), {
        name,
        date,
        hours: Number(hours),
      });
    }

    // Reset form
    workDateInput.value = "";
    workHoursInput.value = "";
  } catch (error) {
    console.error("Error saving work hours: ", error);
    alert("Грешка при зачувување на работните часови: " + error.message);
  }
});

// Live updates for work hours
onSnapshot(collection(db, "work_hours"), (snap) => {
  allWork = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  populateWorkYears();
  renderWorkHours();
});

function renderWorkHours() {
  const day = workDayFilter.value;
  const month = workMonthFilter.value;
  const year = workYearFilter.value;
  const empFilter = workNameFilter.value;

  workTableBody.innerHTML = "";
  let total = 0;
  let data = [...allWork];

  data = data.filter((w) => {
    const [y, m, d] = w.date.split("-");
    if (day && d !== day) return false;
    if (month && m !== month) return false;
    if (year && y !== year) return false;
    if (empFilter && w.name !== empFilter) return false;
    return true;
  });

  data
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach((w) => {

    total += Number(w.hours);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${w.name}</td>
      <td>${w.date}</td>
      <td>${w.hours}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-work" data-id="${w.id}">Измени</button>
        <button class="btn btn-sm btn-danger delete-work" data-id="${w.id}">Избриши</button>
      </td>
    `;
    workTableBody.appendChild(row);
  });

  workTotalEl.textContent = total.toFixed(2) + " ч.";
}

// Work hours table event delegation
workTableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-work")) {
    const id = e.target.dataset.id;
    const work = allWork.find(w => w.id === id);
    
    if (work) {
      workEmpSelect.value = work.name;
      workDateInput.value = work.date;
      workHoursInput.value = work.hours;
      workEditId = id;
      addWorkHourBtn.textContent = "Ажурирај";
    }
  }
  
  if (e.target.classList.contains("delete-work")) {
    deleteWork(e.target.dataset.id);
  }
});

async function deleteWork(id) {
  if (confirm("Дали сте сигурни дека сакате да го избришете овој запис?")) {
    try {
      await deleteDoc(doc(db, "work_hours", id));
    } catch (error) {
      console.error("Error deleting work hours: ", error);
      alert("Грешка при бришење на работни часови: " + error.message);
    }
  }
}

function populateWorkYears() {
  const years = [...new Set(allWork.map((w) => w.date.split("-")[0]))].sort();
  workYearFilter.innerHTML =
    `<option value="">Година</option>` +
    years.map((y) => `<option value="${y}">${y}</option>`).join("");
}

// Initialize day filter for work hours
for (let i = 1; i <= 31; i++) {
  const option = document.createElement("option");
  option.value = i < 10 ? `0${i}` : `${i}`;
  option.textContent = i;
  workDayFilter.appendChild(option);
}

// Work Hours Filters
workDayFilter.addEventListener("change", renderWorkHours);
workMonthFilter.addEventListener("change", renderWorkHours);
workYearFilter.addEventListener("change", renderWorkHours);
workNameFilter.addEventListener("change", renderWorkHours);

clearWorkFilters.addEventListener("click", () => {
  workDayFilter.value = "";
  workMonthFilter.value = "";
  workYearFilter.value = "";
  workNameFilter.value = "";
  renderWorkHours();
});