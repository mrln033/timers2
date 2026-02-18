let missionsData = [];

document.addEventListener("DOMContentLoaded", () => {
  loadMissions();
});

/* ================= UTIL ================= */

function formatTime(ms) {
  const total = Math.floor(ms/1000);
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

/* ================= LOAD ================= */

function loadMissions() {

  const params = new URLSearchParams(window.location.search);
  const planet = params.get("planet");
  const category = params.get("category");

const pageTitle = document.getElementById("pageTitle");

if (pageTitle) {

  const formattedPlanet =
    planet.charAt(0).toUpperCase() + planet.slice(1);

  const formattedCategory =
    category.charAt(0).toUpperCase() + category.slice(1);

  pageTitle.textContent =
    `-= ${formattedPlanet} - ${formattedCategory} =-`;
}

  if (!planet || !category) return;

  const storageKey = `timers_${planet}_${category}`;
  const topbarKey = `${storageKey}_showSelected`;
  const file = `data/timers_${planet}_${category}.json`;

  fetch(file)
    .then(r => r.json())
.then(data => {

  missionsData = data;

      const stored = initMissionStorage(storageKey, data);

      const showSelectedOnly = document.getElementById("showSelectedOnly");
      showSelectedOnly.checked = localStorage.getItem(topbarKey) === "true";

      showSelectedOnly.addEventListener("change", e => {
        localStorage.setItem(topbarKey, e.target.checked);
        render(data, storageKey, e.target.checked);
      });

      render(data, storageKey, showSelectedOnly.checked);

      setInterval(() => {
        updateTimers(storageKey);
      }, 1000);

    });
}

/* ================= RENDER ================= */

function render(data, storageKey, showSelected=false) {

  const stored = getStorage(storageKey);
  const table = document.getElementById("timersTable");
  table.innerHTML = "";

  const now = Date.now();
  let selectedCount = 0;

  const active = [];
  const inactive = [];

  /* ================= CLASSIFICATION ================= */

  data.forEach(m => {

    const state = stored[m.id];
    const isActive = state.endTime && state.endTime > now;

    if (state.selected) selectedCount++;

    if (isActive) {
      active.push(m);
    } else {

      // Le filtre ne s'applique QUE sur les inactifs
      if (showSelected && !state.selected) return;

      inactive.push(m);
    }
  });

  /* ================= TRI ================= */

  // Actifs → alphabétique uniquement
  active.sort((a,b)=>
    a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
  );

  // Inactifs → sélection d'abord, puis alphabétique
  inactive.sort((a,b)=>{

    const selA = stored[a.id].selected;
    const selB = stored[b.id].selected;

    if (selA !== selB) return selB - selA;

    return a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
  });

  /* ================= RENDER SECTION ================= */

  function section(title) {
    const row = document.createElement("tr");
    row.className = "section-header";
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = title;
    row.appendChild(cell);
    return row;
  }

  function rowMission(m) {

    const state = stored[m.id];
    const isActive = state.endTime && state.endTime > now;

    const row = document.createElement("tr");

    /* COL 1 */
    const col1 = document.createElement("td");
    col1.className = "col-select";
    col1.innerHTML = `
      <input type="checkbox"
        ${state.selected ? "checked" : ""}
        onchange="handleSelectedChange('${storageKey}','${m.id}')">
    `;

    /* COL 2 */
const col2 = document.createElement("td");
col2.style.textAlign = "left";

const wrapper = document.createElement("div");
wrapper.className = "name-wrapper";

const nameText = document.createElement("span");
nameText.textContent = m.name;
wrapper.appendChild(nameText);

// 🛈 Info tooltip si présent
if (m.info) {
  const infoIcon = document.createElement("span");
  infoIcon.className = "info-icon";
  infoIcon.textContent = " 🛈";

  const tooltip = document.createElement("span");
  tooltip.className = "info-tooltip";
  tooltip.textContent = m.info;

  infoIcon.appendChild(tooltip);
  wrapper.appendChild(infoIcon);
}

// Badge actif
if (isActive) {
  const badge = document.createElement("span");
  badge.className = "badge-active";
  badge.textContent = "Actif";
  wrapper.appendChild(badge);
}

col2.appendChild(wrapper);

    /* COL 3 */
    const remaining = isActive
      ? formatTime(state.endTime - now)
      : "--:--:--";

    const col3 = document.createElement("td");
    col3.innerHTML = `
      <input type="checkbox"
        ${isActive ? "checked" : ""}
        onchange="handleTimerToggle('${storageKey}','${m.id}',${m.durationHours})">
      <span class="timer-display" data-timer="${m.id}">
        ${remaining}
      </span>
    `;

    /* COL 4 */
    const col4 = document.createElement("td");
    col4.innerHTML = `
      <button class="copy-btn"
        onclick="handleCopy(this, \`${m.coords}\`)">
        Copier WP
      </button>
    `;

    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    row.appendChild(col4);

    return row;
  }

  if (active.length) {
    table.appendChild(section("Timers Actifs"));
    active.forEach(m => table.appendChild(rowMission(m)));
  }

  if (inactive.length) {
    table.appendChild(section("Timers Inactifs"));
    inactive.forEach(m => table.appendChild(rowMission(m)));
  }

  document.getElementById("counter").textContent =
    `${selectedCount} / ${data.length}`;
}
/* ================= TIMER UPDATE ================= */

function updateTimers(storageKey) {

  const stored = getStorage(storageKey);
  const now = Date.now();

  Object.keys(stored).forEach(id => {

    const state = stored[id];

    if (state.endTime && state.endTime > now) {

      const el = document.querySelector(`[data-timer="${id}"]`);
      if (el) {
        el.textContent = formatTime(state.endTime - now);
      }

    }

  });
}

/* ================= DYNAMIC ACTIONS ================= */

function handleSelectedChange(storageKey, id) {

  toggleSelected(storageKey, id);

  refreshView(storageKey);
}

function handleTimerToggle(storageKey, id, durationHours) {

  toggleTimerState(storageKey, id, durationHours);

  refreshView(storageKey);
}

function refreshView(storageKey) {

  const showSelected =
    document.getElementById("showSelectedOnly")?.checked || false;

  render(missionsData, storageKey, showSelected);
}

function handleCopy(button, text) {

  async function copyText() {

    // API moderne
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }

    // Fallback compatible iframe
    try {
      const tempInput = document.createElement("textarea");
      tempInput.value = text;
      tempInput.style.position = "fixed";
      tempInput.style.opacity = "0";
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      return true;
    } catch {}

    return false;
  }

  copyText().then(success => {

    const originalText = button.textContent;

    if (success) {
      button.textContent = "Copié !";
      button.classList.add("copied");
    } else {
      button.textContent = "Erreur";
    }

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1200);

  });

}

