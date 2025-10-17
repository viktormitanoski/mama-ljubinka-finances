// js/table-pagination.js
// Lightweight client-side pagination for any table. Max rows per page is configurable (default 20).
// It auto-initializes for the tables listed in TABLE_IDS and re-applies on data changes (MutationObserver).

const TABLE_IDS = [
  "pogonTable",
  "slatkarTable",
  "vkupenTable",
  "companiesTable",
  "invoicesTable",
  "employeesTable",
  "dailyTable",
  "workHoursTable",
  "materialsTable",
  "utilitiesTable",
];

const DEFAULT_PAGE_SIZE = 15;

class TablePaginator {
  constructor(table, pageSize = DEFAULT_PAGE_SIZE) {
    this.table = table;
    this.tbody = table.tBodies[0];
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = 1;

    // Insert a container for controls right after the table
    this.controls = document.createElement("nav");
    this.controls.className = "d-flex justify-content-end";
    this.controls.setAttribute("aria-label", "Table pagination");
    table.insertAdjacentElement("afterend", this.controls);

    // Recalculate whenever rows change (adds, deletes, filtering re-render)
    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(this.tbody, { childList: true, subtree: false });

    // Initial render
    this.refresh();

    // If a parent tab is hidden at load, re-render when it becomes visible
    this.handleTabShown = this.handleTabShown.bind(this);
    document.addEventListener("shown.bs.tab", this.handleTabShown);
  }

  handleTabShown() {
    // When a table becomes visible, recalc sizes (avoids layout quirks)
    this.refresh();
  }

  get rows() {
    // Only element rows (ignore stray text nodes)
    return Array.from(this.tbody.querySelectorAll("tr"));
  }

  refresh() {
    const rows = this.rows;
    const total = rows.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    // Clamp current page
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    // Show only the current page
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = startIdx + this.pageSize;

    rows.forEach((tr, idx) => {
      tr.style.display = idx >= startIdx && idx < endIdx ? "" : "none";
    });

    this.renderControls();
  }

  goTo(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.refresh();
  }

  renderControls() {
    // Build Bootstrap pagination
    const ul = document.createElement("ul");
    ul.className = "pagination pagination-sm my-2";

    const makeItem = (label, disabled, active, onClick) => {
      const li = document.createElement("li");
      li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
      const a = document.createElement("button");
      a.className = "page-link";
      a.type = "button";
      a.textContent = label;
      if (!disabled) a.addEventListener("click", onClick);
      li.appendChild(a);
      return li;
    };

    // Prev
    ul.appendChild(
      makeItem("«", this.currentPage === 1, false, () => this.goTo(this.currentPage - 1))
    );

    // Page numbers (compact: first, last, current ±2)
    const pages = this.buildPageList(this.currentPage, this.totalPages);
    pages.forEach(p => {
      if (p === "...") {
        const li = document.createElement("li");
        li.className = "page-item disabled";
        const span = document.createElement("span");
        span.className = "page-link";
        span.textContent = "...";
        li.appendChild(span);
        ul.appendChild(li);
      } else {
        ul.appendChild(
          makeItem(String(p), false, p === this.currentPage, () => this.goTo(p))
        );
      }
    });

    // Next
    ul.appendChild(
      makeItem("»", this.currentPage === this.totalPages, false, () => this.goTo(this.currentPage + 1))
    );

    // Replace controls
    this.controls.innerHTML = "";
    this.controls.appendChild(ul);

    // Also show a tiny status (e.g., "1–20 of 137")
    const status = document.createElement("div");
    status.className = "ms-2 my-2 small text-muted d-flex align-items-center";
    const totalRows = this.rows.length;
    const start = totalRows === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, totalRows);
    status.textContent = `${start}–${end} од ${totalRows}`;
    this.controls.appendChild(status);
  }

  buildPageList(current, total) {
    // Compact pagination list: 1, 2, ..., current-2, current-1, current, current+1, current+2, ..., total-1, total
    const pages = new Set([1, 2, total - 1, total, current - 2, current - 1, current, current + 1, current + 2]);
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] !== sorted[i] + 1) {
        result.push("...");
      }
    }
    return result;
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  TABLE_IDS.forEach(id => {
    const table = document.getElementById(id);
    if (table && table.tBodies && table.tBodies[0]) {
      // Attach paginator instance to the element so other scripts can access if needed
      table._paginator = new TablePaginator(table, DEFAULT_PAGE_SIZE);
    }
  });
});

// Optional: expose a tiny API so your other modules can force-refresh after they finish rendering
export function refreshTablePagination(tableId) {
  const table = document.getElementById(tableId);
  if (table && table._paginator) table._paginator.refresh();
}
