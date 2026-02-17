document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("dashboard")) {
    loadDashboard();
  }

  if (document.getElementById("timersTable")) {
    loadMissions();
  }

});

/* ===================================================== */
/* ================= DASHBOARD ========================= */
/* ===================================================== */

function loadDashboard() {

  fetch("data/dashboard.json")
    .then(r => r.json())
    .then(planets => {

      const container = document.getElementById("dashboard");

      planets.forEach(planet => {

        const card = document.createElement("div");
        card.className = "planet-card";

        const title = document.createElement("div");
        title.className = "planet-title";
        title.innerHTML = `${planet.icon} ${planet.title}`;

        card.appendChild(title);

        planet.categories.forEach(cat => {

          const storageKey = `timers_${planet.planet}_${cat}`;
          const stored = JSON.parse(localStorage.getItem(storageKey)) || {};

          const now = Date.now();
          const activeCount = Object.values(stored)
            .filter(m => m.timerEnd && m.timerEnd > now).length;

          const btn = document.createElement("a");
          btn.className = "category-button";
          btn.href = `missions.html?planet=${planet.planet}&category=${cat}`;

          btn.innerHTML = `
            ${cat}
            ${activeCount ? `<span class="badge-active">${activeCount}</span>` : ""}
          `;

          card.appendChild(btn);
        });

        container.appendChild(card);
      });
    });
}

/* ===================================================== */
/* ================= MISSIONS ========================== */
/* ===================================================== */
function formatTime(ms) {
  const total = Math.floor(ms/1000);
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

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

      const showSelectedOnly = document.getElementById("showSelectedOnly");
      const saved = localStorage.getItem(topbarKey);
      if (saved === "true") showSelectedOnly.checked = true;

      showSelectedOnly.addEventListener("change", e => {
        localStorage.setItem(topbarKey, e.target.checked);
        renderMissions(data, stored, storageKey, e.target.checked);
      });

      renderMissions(data, stored, storageKey, showSelectedOnly.checked);

      // UPDATE TIMER DISPLAY ONLY
      setInterval(() => {

        const now = Date.now();

        Object.keys(stored).forEach(id => {
          const state = stored[id];

          if (state.timerEnd && state.timerEnd > now) {

            const remaining = state.timerEnd - now;
            const el = document.querySelector(`[data-timer="${id}"]`);

            if (el) {
              el.textContent = formatTime(remaining);
            }

          }
        });

      }, 1000);

    });
}

function renderMissions(data, stored, storageKey, showSelected=false) {

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

  function formatTime(ms) {
    const total = Math.floor(ms/1000);
    const h = Math.floor(total/3600);
    const m = Math.floor((total%3600)/60);
    const s = total%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  function rowMission(m) {

    const state = stored[m.id];
    const row = document.createElement("tr");

    const isActive = state.timerEnd && state.timerEnd > now;

    const col1 = document.createElement("td");
    col1.style.width = "45px";
    col1.innerHTML = `
      <input type="checkbox" ${state.selected ? "checked" : ""}
        onchange="toggleSelect('${m.id}','${storageKey}')">
    `;

    const col2 = document.createElement("td");
    col2.style.textAlign = "left";
    col2.innerHTML = `
      ${m.name}
      ${isActive ? `<span class="badge-active">Actif</span>` : ""}
    `;

    const col3 = document.createElement("td");

    const remaining = isActive
      ? formatTime(state.timerEnd - now)
      : "--:--:--";

    col3.innerHTML = `
      <input type="checkbox"
        ${isActive ? "checked" : ""}
        onchange="toggleTimer('${m.id}',${m.durationHours},'${storageKey}')">
      <span class="timer-display" data-timer="${m.id}">
        ${remaining}
      </span>
    `;
	
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