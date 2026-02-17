document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("timersTable")) {
    loadMissions();
  }
});

/* ================= LOAD ================= */

function loadMissions() {

  const params = new URLSearchParams(window.location.search);
  const planet = params.get("planet");
  const category = params.get("category");

  if (!planet || !category) return;

  const file = `data/timers_${planet}_${category}.json`;
  const storageKey = `timers_${planet}_${category}`;
  const topbarKey = `${storageKey}_showSelected`;

  fetch(file)
    .then(r => r.json())
    .then(data => {

      data.sort((a,b)=>
        a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
      );

      let stored = JSON.parse(localStorage.getItem(storageKey)) || {};

      data.forEach(m => {
        if (!stored[m.id]) {
          stored[m.id] = {
            selected:false,
            timerEnd:null
          };
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));

      // restore topbar checkbox
      const showSelectedOnly = document.getElementById("showSelectedOnly");
      const savedTopbar = localStorage.getItem(topbarKey);
      if (savedTopbar === "true") showSelectedOnly.checked = true;

      showSelectedOnly.addEventListener("change", e => {
        localStorage.setItem(topbarKey, e.target.checked);
        render(data, stored, storageKey, e.target.checked);
      });

      render(data, stored, storageKey, showSelectedOnly.checked);

      setInterval(() => {
        render(data, stored, storageKey, showSelectedOnly.checked);
      }, 1000);

    });
}

/* ================= RENDER ================= */

function render(data, stored, storageKey, showSelected=false) {

  const table = document.getElementById("timersTable");
  table.innerHTML = "";

  let selectedCount = 0;

  const active = [];
  const inactive = [];

  const now = Date.now();

  data.forEach(m => {

    const state = stored[m.id];

    if (showSelected && !state.selected) return;

    if (state.selected) selectedCount++;

    if (state.timerEnd && state.timerEnd > now)
      active.push(m);
    else
      inactive.push(m);
  });

  function section(title) {
    const row = document.createElement("tr");
    row.className = "section-header";
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = title;
    row.appendChild(cell);
    return row;
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms/1000);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = totalSec%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  function rowMission(m) {

    const state = stored[m.id];
    const row = document.createElement("tr");

    const now = Date.now();
    const isActive = state.timerEnd && state.timerEnd > now;

    /* COL 1 */
    const col1 = document.createElement("td");
    col1.style.width = "45px";
    col1.innerHTML = `
      <input type="checkbox" ${state.selected ? "checked" : ""}
        onchange="toggleSelect('${m.id}','${storageKey}')">
    `;

    /* COL 2 */
    const col2 = document.createElement("td");
    col2.style.textAlign = "left";
    col2.innerHTML = `
      ${m.name}
      ${isActive ? `<span class="badge-active">Actif</span>` : ""}
    `;

    /* COL 3 */
    const col3 = document.createElement("td");

    const remaining = isActive
      ? formatTime(state.timerEnd - now)
      : "--:--:--";

    col3.innerHTML = `
      <input type="checkbox"
        ${isActive ? "checked" : ""}
        onchange="toggleTimer('${m.id}',${m.durationHours},'${storageKey}')">
      <span class="timer-display">${remaining}</span>
    `;

    /* COL 4 */
    const col4 = document.createElement("td");
    col4.innerHTML = `
      <button onclick="navigator.clipboard.writeText(\`${m.coords}\`)">
        Copier
      </button>
    `;

    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    row.appendChild(col4);

    return row;
  }

  if (active.length) {
    table.appendChild(section("🔥 Timers actifs"));
    active.forEach(m => table.appendChild(rowMission(m)));
  }

  if (inactive.length) {
    table.appendChild(section("⏳ Timers inactifs"));
    inactive.forEach(m => table.appendChild(rowMission(m)));
  }

  document.getElementById("counter").textContent =
    `${selectedCount} / ${data.length}`;
}

/* ================= ACTIONS ================= */

function toggleSelect(id, storageKey) {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  stored[id].selected = !stored[id].selected;
  localStorage.setItem(storageKey, JSON.stringify(stored));
}

function toggleTimer(id, durationHours, storageKey) {

  const stored = JSON.parse(localStorage.getItem(storageKey));
  const now = Date.now();

  if (stored[id].timerEnd && stored[id].timerEnd > now) {
    stored[id].timerEnd = null;
  } else {
    stored[id].timerEnd = now + (durationHours * 3600 * 1000);
  }

  localStorage.setItem(storageKey, JSON.stringify(stored));
}