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

  if (!planet || !category) return;

  const storageKey = `timers_${planet}_${category}`;
  const topbarKey = `${storageKey}_showSelected`;
  const file = `data/timers_${planet}_${category}.json`;

  fetch(file)
    .then(r => r.json())
    .then(data => {

      data.sort((a,b)=>
        a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
      );

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

  function rowMission(m) {

    const state = stored[m.id];
    const isActive = state.timerEnd && state.timerEnd > now;

    const row = document.createElement("tr");

    /* COL 1 */
    const col1 = document.createElement("td");
    col1.className = "col-select";
    col1.innerHTML = `
      <input type="checkbox"
        ${state.selected ? "checked" : ""}
        onchange="toggleSelected('${storageKey}','${m.id}')">
    `;

    /* COL 2 */
    const col2 = document.createElement("td");
    col2.style.textAlign = "left";
    col2.innerHTML = `
      ${m.name}
      ${isActive ? `<span class="badge-active">Actif</span>` : ""}
    `;

    /* COL 3 */
    const remaining = isActive
      ? formatTime(state.timerEnd - now)
      : "--:--:--";

    const col3 = document.createElement("td");
    col3.innerHTML = `
      <input type="checkbox"
        ${isActive ? "checked" : ""}
        onchange="toggleTimerState('${storageKey}','${m.id}',${m.durationHours})">
      <span class="timer-display" data-timer="${m.id}">
        ${remaining}
      </span>
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

/* ================= TIMER UPDATE ================= */

function updateTimers(storageKey) {

  const stored = getStorage(storageKey);
  const now = Date.now();

  Object.keys(stored).forEach(id => {

    const state = stored[id];

    if (state.timerEnd && state.timerEnd > now) {

      const el = document.querySelector(`[data-timer="${id}"]`);
      if (el) {
        el.textContent = formatTime(state.timerEnd - now);
      }

    }

  });
}