/* ═══════════════════════════════════════════════════════════════════════════
   AI Prediction Dashboard — script.js
   Handles: particles, form submission, result display, validation
═══════════════════════════════════════════════════════════════════════════ */

"use strict";

/* ── Animated Particles ──────────────────────────────────────────────────── */
(function initParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const COUNT = window.innerWidth < 600 ? 25 : 50;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement("div");
    p.className = "particle";

    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      opacity: ${Math.random() * 0.4 + 0.05};
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: ${Math.random() * 20}s;
    `;
    container.appendChild(p);
  }
})();


/* ── Utility: collect form data as plain object ─────────────────────────── */
function collectFormData(form) {
  const data = {};
  const elements = form.querySelectorAll("input, select");
  elements.forEach(el => {
    if (el.name) data[el.name] = el.value;
  });
  return data;
}

/* ── Utility: mark/clear field errors ──────────────────────────────────── */
function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));
}

/* ── Utility: show inline error ─────────────────────────────────────────── */
function showError(boxId, message) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("hidden");
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearError(boxId) {
  const box = document.getElementById(boxId);
  if (box) { box.textContent = ""; box.classList.add("hidden"); }
}

/* ── Utility: set button loading state ──────────────────────────────────── */
function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const textSpan    = btn.querySelector(".btn-text");
  const loadingSpan = btn.querySelector(".btn-loading");
  btn.disabled = isLoading;
  if (isLoading) {
    textSpan.classList.add("hidden");
    loadingSpan.classList.remove("hidden");
  } else {
    textSpan.classList.remove("hidden");
    loadingSpan.classList.add("hidden");
  }
}

/* ── Utility: format number with commas ─────────────────────────────────── */
function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(Math.round(num));
}

/* ── Build Result Card HTML ──────────────────────────────────────────────── */
function buildResultCard(formatted, prediction, type, meta) {
  const colorClass   = type === "house" ? "blue" : "purple";
  const amountClass  = type === "house" ? "blue-text" : "purple-text";
  const label        = type === "house" ? "Predicted House Price" : "Predicted Car Price";

  let metaHTML = "";
  if (meta && meta.length) {
    metaHTML = `<div class="result-meta">` +
      meta.map(m => `
        <div class="meta-item">
          <span class="meta-key">${m.key}</span>
          <span class="meta-val">${m.val}</span>
        </div>`).join("") +
      `</div>`;
  }

  return `
    <div class="result-card">
      <div class="result-label ${colorClass}">${label}</div>
      <div class="result-amount ${amountClass}">${formatted}</div>
      <p class="result-currency-note">USD · Estimated Market Value</p>
      <div class="result-divider"></div>
      ${metaHTML}
      <div class="result-confidence">Model confidence — Gradient Boosting Regressor</div>
    </div>
  `;
}

/* ── Show Prediction Result ──────────────────────────────────────────────── */
function showResult(panelId, formatted, prediction, type, meta) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.innerHTML = buildResultCard(formatted, prediction, type, meta);
  panel.classList.add("has-result", `${type}-result`);
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOUSE PRICE FORM
═══════════════════════════════════════════════════════════════════════════ */
const houseForm = document.getElementById("houseForm");
if (houseForm) {
  houseForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError("houseError");
    clearFieldErrors(houseForm);

    const data = collectFormData(houseForm);

    // Client-side validation
    const errors = [];
    const numericChecks = [
      { key: "OverallQual", label: "Overall Quality", min: 1, max: 10, integer: true },
      { key: "GrLivArea",   label: "Living Area",     min: 300, max: 10000 },
      { key: "TotalBsmtSF", label: "Basement Area",   min: 0,   max: 8000 },
      { key: "1stFlrSF",    label: "First Floor Area",min: 100, max: 6000 },
      { key: "TotRmsAbvGrd",label: "Total Rooms",     min: 2,   max: 20, integer: true },
    ];
    const catChecks = ["MSZoning","Utilities","BldgType","Heating","KitchenQual","SaleCondition","LandSlope"];

    numericChecks.forEach(({ key, label, min, max, integer }) => {
      const el = houseForm.querySelector(`[name="${key}"]`);
      if (!data[key] || data[key].trim() === "") {
        errors.push(`${label} is required.`);
        if (el) el.classList.add("field-error");
      } else {
        const v = parseFloat(data[key]);
        if (isNaN(v) || v < min || v > max) {
          errors.push(`${label} must be between ${min} and ${max}.`);
          if (el) el.classList.add("field-error");
        }
      }
    });

    catChecks.forEach(key => {
      const el = houseForm.querySelector(`[name="${key}"]`);
      if (!data[key] || data[key].trim() === "") {
        errors.push(`Please select a value for ${key.replace(/_/g, " ")}.`);
        if (el) el.classList.add("field-error");
      }
    });

    if (errors.length > 0) {
      showError("houseError", errors[0]);
      return;
    }

    setLoading("houseSubmit", true);

    try {
      const resp = await fetch("/predict/house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await resp.json();

      if (!resp.ok || json.error) {
        showError("houseError", json.error || "Prediction failed. Please try again.");
        return;
      }

      const meta = [
        { key: "Living Area",    val: `${formatNumber(data["GrLivArea"])} sq ft` },
        { key: "Quality Rating", val: `${data["OverallQual"]} / 10` },
        { key: "Rooms",          val: data["TotRmsAbvGrd"] },
        { key: "Building",       val: data["BldgType"] },
      ];

      showResult("houseResult", json.formatted, json.prediction, "house", meta);

    } catch (err) {
      showError("houseError", "Network error. Please check that the server is running.");
    } finally {
      setLoading("houseSubmit", false);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   CAR PRICE FORM
═══════════════════════════════════════════════════════════════════════════ */
const carForm = document.getElementById("carForm");
if (carForm) {
  carForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError("carError");
    clearFieldErrors(carForm);

    const data = collectFormData(carForm);

    // Client-side validation
    const errors = [];
    const numericChecks = [
      { key: "Year",               label: "Manufacturing Year",       min: 1990, max: 2025, integer: true },
      { key: "Mileage_km",         label: "Total Mileage",            min: 0,    max: 500000 },
      { key: "Engine_CC",          label: "Engine Displacement",      min: 500,  max: 8000 },
      { key: "Horsepower",         label: "Horsepower",               min: 30,   max: 800 },
      { key: "Num_Owners",         label: "Number of Owners",         min: 1,    max: 10, integer: true },
      { key: "Accidents_Reported", label: "Accidents Reported",       min: 0,    max: 10, integer: true },
    ];
    const catChecks = ["Brand","Fuel_Type","Transmission","Body_Type","Condition","Service_History","Insurance_Valid","Doors","Seats"];

    numericChecks.forEach(({ key, label, min, max }) => {
      const el = carForm.querySelector(`[name="${key}"]`);
      if (!data[key] || data[key].trim() === "") {
        errors.push(`${label} is required.`);
        if (el) el.classList.add("field-error");
      } else {
        const v = parseFloat(data[key]);
        if (isNaN(v) || v < min || v > max) {
          errors.push(`${label} must be between ${min} and ${max}.`);
          if (el) el.classList.add("field-error");
        }
      }
    });

    catChecks.forEach(key => {
      const el = carForm.querySelector(`[name="${key}"]`);
      if (data[key] === undefined || data[key].trim() === "") {
        errors.push(`Please select a value for ${key.replace(/_/g, " ")}.`);
        if (el) el.classList.add("field-error");
      }
    });

    if (errors.length > 0) {
      showError("carError", errors[0]);
      return;
    }

    setLoading("carSubmit", true);

    try {
      const resp = await fetch("/predict/car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await resp.json();

      if (!resp.ok || json.error) {
        showError("carError", json.error || "Prediction failed. Please try again.");
        return;
      }

      const carAge = 2025 - parseInt(data["Year"]);
      const meta = [
        { key: "Brand",       val: data["Brand"] },
        { key: "Car Age",     val: `${carAge} yr${carAge !== 1 ? "s" : ""}` },
        { key: "Mileage",     val: `${formatNumber(data["Mileage_km"])} km` },
        { key: "Fuel",        val: data["Fuel_Type"] },
        { key: "Condition",   val: data["Condition"] },
      ];

      showResult("carResult", json.formatted, json.prediction, "car", meta);

    } catch (err) {
      showError("carError", "Network error. Please check that the server is running.");
    } finally {
      setLoading("carSubmit", false);
    }
  });
}
