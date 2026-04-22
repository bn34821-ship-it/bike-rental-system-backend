function showToast(message, type = "success") {
  const host = document.getElementById("toast-container");
  if (!host) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  host.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

async function handleAction(url, method = "POST", body = null) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ success: false, message: "Action failed" }));
  if (!res.ok || !data.success) {
    showToast(data.message || "Action failed", "error");
    return;
  }
  showToast(data.message || "Success");
  setTimeout(() => window.location.reload(), 500);
}

document.querySelectorAll(".admin-action").forEach((btn) => {
  btn.addEventListener("click", () => {
    handleAction(btn.dataset.url, btn.dataset.method || "POST");
  });
});

document.querySelectorAll("[data-modal-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById(btn.dataset.modalTarget);
    if (modal) modal.classList.add("show");
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
});

document.querySelectorAll(".ajax-form").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.classList.add("loading");
      submitBtn.textContent = form.dataset.loadingText || "Saving...";
    }
    const payload = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      payload[checkbox.name] = checkbox.checked;
    });
    form.querySelectorAll('input[type="file"]').forEach((fileInput) => {
      payload[fileInput.name] = fileInput.files?.length ? fileInput.files[0].name : "";
    });
    await handleAction(form.dataset.url, "POST", payload);
    if (submitBtn) {
      submitBtn.classList.remove("loading");
      submitBtn.textContent = originalText;
    }
    const modal = form.closest(".modal");
    if (modal) modal.classList.remove("show");
  });
});

document.querySelectorAll(".open-edit-user").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById("edit-user-modal");
    const form = document.getElementById("edit-user-form");
    if (!modal || !form) return;
    const fullNameEl = document.getElementById("edit-user-full-name");
    if (fullNameEl) fullNameEl.value = btn.dataset.fullName || "";
    document.getElementById("edit-user-phone").value = btn.dataset.phone || "";
    const emailInput = document.getElementById("edit-user-email");
    if (emailInput) emailInput.value = btn.dataset.email || "";
    const locationInput = document.getElementById("edit-user-location");
    if (locationInput) locationInput.value = btn.dataset.location || "";
    form.dataset.url = `/admin/users/${btn.dataset.id}/edit`;
    modal.classList.add("show");
  });
});

document.querySelectorAll(".open-maintenance-status").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById("update-maintenance-modal");
    const form = document.getElementById("update-maintenance-form");
    if (!modal || !form) return;
    form.dataset.url = `/admin/maintenance/${btn.dataset.id}/status`;
    const statusEl = document.getElementById("maintenance-status");
    const techEl = document.getElementById("maintenance-tech");
    const costEl = document.getElementById("maintenance-cost");
    const expectedEl = document.getElementById("maintenance-expected");
    if (statusEl) statusEl.value = btn.dataset.status || "under_repair";
    if (techEl) techEl.value = btn.dataset.tech || "";
    if (costEl) costEl.value = btn.dataset.cost || "";
    if (expectedEl) expectedEl.value = btn.dataset.expected || "";
    modal.classList.add("show");
  });
});

function parseJsonScript(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  try {
    return JSON.parse(el.textContent);
  } catch {
    return [];
  }
}

function renderLineChart(canvasId, labels, values, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  // eslint-disable-next-line no-new
  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: color,
          backgroundColor: "rgba(234,179,8,0.15)",
          tension: 0.35,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#374151" } } },
      scales: {
        x: { ticks: { color: "#6b7280" }, grid: { color: "#e5e7eb" } },
        y: { ticks: { color: "#6b7280" }, grid: { color: "#e5e7eb" } },
      },
    },
  });
}

function renderBarChart(canvasId, labels, values, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  // eslint-disable-next-line no-new
  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: color }],
    },
    options: {
      plugins: { legend: { labels: { color: "#374151" } } },
      scales: {
        x: { ticks: { color: "#6b7280" }, grid: { color: "#e5e7eb" } },
        y: { ticks: { color: "#6b7280" }, grid: { color: "#e5e7eb" } },
      },
    },
  });
}

function renderPieChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  // eslint-disable-next-line no-new
  new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ["#eab308", "#3b82f6"],
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#374151" } } },
    },
  });
}

const earningsSeries = parseJsonScript("earnings-chart-data");
if (earningsSeries.length) {
  renderLineChart(
    "earningsLineChart",
    earningsSeries.map((x) => x.label),
    earningsSeries.map((x) => x.value),
    "Revenue",
    "#ca8a04"
  );
}

const earningsPie = parseJsonScript("earnings-pie-data");
if (earningsPie.length) {
  renderPieChart(
    "earningsBreakdownChart",
    earningsPie.map((x) => x.label),
    earningsPie.map((x) => x.value)
  );
}

const analyticsEarnings = parseJsonScript("analytics-earnings-data");
if (analyticsEarnings.length) {
  renderLineChart(
    "revenueChart",
    analyticsEarnings.map((x) => x.label),
    analyticsEarnings.map((x) => x.value),
    "Revenue",
    "#ca8a04"
  );
}

const analyticsOrders = parseJsonScript("analytics-orders-data");
if (analyticsOrders.length) {
  renderLineChart(
    "ordersChart",
    analyticsOrders.map((x) => x.label),
    analyticsOrders.map((x) => x.value),
    "Orders",
    "#7aa2ff"
  );
}

const analyticsRevenue = parseJsonScript("analytics-revenue-data");
if (analyticsRevenue.length) {
  renderLineChart(
    "revenueChart",
    analyticsRevenue.map((x) => x.label),
    analyticsRevenue.map((x) => x.value),
    "Revenue",
    "#ca8a04"
  );
}

const analyticsOrdersBar = parseJsonScript("analytics-orders-bar-data");
if (analyticsOrdersBar.length) {
  renderBarChart(
    "ordersBarChart",
    analyticsOrdersBar.map((x) => x.label),
    analyticsOrdersBar.map((x) => x.value),
    "Orders",
    "rgba(122,162,255,0.7)"
  );
}

const analyticsPie = parseJsonScript("analytics-pie-data");
if (analyticsPie.length) {
  renderPieChart(
    "earningsPieChart",
    analyticsPie.map((x) => x.label),
    analyticsPie.map((x) => x.value)
  );
}

document.querySelectorAll(".chart-skeleton").forEach((el) => {
  el.style.display = "none";
});

const scheduleToggle = document.getElementById("schedule-toggle");
const scheduleFields = document.getElementById("schedule-fields");
if (scheduleToggle && scheduleFields) {
  const toggleScheduleFields = () => {
    scheduleFields.classList.toggle("hidden", !scheduleToggle.checked);
  };
  scheduleToggle.addEventListener("change", toggleScheduleFields);
  toggleScheduleFields();
}
