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

function extractCategory(filename) {
  const parts = filename.replace("timers_", "").replace(".json", "").split("_");
  return {
    planet: parts[0],
    category: parts.slice(1).join("-")
  };
}

function loadDashboard() {

  Promise.all([
    fetch("data/dashboard.json").then(r => r.json()),
    fetch("data/files.json").then(r => r.json())
  ])
  .then(([planets, files]) => {

    const container = document.getElementById("dashboard");

    planets.forEach(planet => {

      const card = document.createElement("div");
      card.className = "planet-card card";

      let totalActivePlanet = 0;

      const header = document.createElement("div");
      header.className = "planet-header";

      const title = document.createElement("div");
      title.className = "planet-title";
      title.innerHTML = `${planet.icon} ${planet.title}`;

      const catContainer = document.createElement("div");

      files.forEach(file => {
        const info = extractCategory(file);

        if (info.planet === planet.planet) {

          const storageKey = `timers_${info.planet}_${info.category}`;
          const stored = JSON.parse(localStorage.getItem(storageKey)) || {};

          const activeCount = Object.values(stored)
            .filter(t => t.isActive).length;

          totalActivePlanet += activeCount;

          const btn = document.createElement("a");
          btn.className = "category-button";
          btn.href = `missions.html?planet=${info.planet}&category=${info.category}`;

          btn.innerHTML = `
            <span>${info.category}</span>
            ${activeCount > 0 ? `<span class="badge">${activeCount}</span>` : ""}
          `;

          catContainer.appendChild(btn);
        }
      });

      if (totalActivePlanet > 0) {
        const counter = document.createElement("div");
        counter.className = "planet-counter";
        counter.textContent = totalActivePlanet;
        header.appendChild(counter);
      }

      header.prepend(title);
      card.appendChild(header);
      card.appendChild(catContainer);
      container.appendChild(card);
    });
  });
}

/* ===================================================== */
/* ================= MISSIONS ========================== */
/* ===================================================== */

function loadMissions() {

  const params = new URLSearchParams(window.location.search);
  const planet = params.get("planet");
  const category = params.get("category");

  if (!planet || !category) return;

  const file = `data/timers_${planet}_${category}.json`;
  const storageKey = `timers_${planet}_${category}`;

  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error("Fichier introuvable : " + file);
      }
      return response.json();
    })
    .then(data => {

      // TRI ALPHABÉTIQUE
      data.sort((a,b)=>
        a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
      );

      let stored = JSON.parse(localStorage.getItem(storageKey)) || {};

      // INITIALISATION PROPRE
      data.forEach(mission => {

        if (!stored[mission.id]) {
          stored[mission.id] = {
            isActive: false,
            selected: false,
            count: 0
          };
        }

        if (stored[mission.id].count === undefined) {
          stored[mission.id].count = 0;
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));

      renderMissions(data, stored, storageKey);

      document.getElementById("showSelectedOnly")
        .addEventListener("change", e => {
          renderMissions(data, stored, storageKey, e.target.checked);
        });
    })
    .catch(error => console.error(error));
}

function renderMissions(data, stored, storageKey, showSelected=false) {

  const tableBody = document.getElementById("timersTable");
  tableBody.innerHTML = "";

  let selectedCount = 0;

  const activeMissions = [];
  const inactiveMissions = [];

  data.forEach(mission => {

    const state = stored[mission.id];

    if (showSelected && !state.selected) return;

    if (state.selected) selectedCount++;

    if (state.isActive)
      activeMissions.push(mission);
    else
      inactiveMissions.push(mission);
  });

  function createSectionRow(title) {
    const row = document.createElement("tr");
    row.className = "section-header";

    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = title;

    row.appendChild(cell);
    return row;
  }

  function createMissionRow(mission) {

    const state = stored[mission.id];
    const row = document.createElement("tr");

    if (state.isActive) row.classList.add("active-row");

    // COL 1 - Sélection
    const selCell = document.createElement("td");
    selCell.innerHTML = `
      <input type="checkbox" ${state.selected ? "checked" : ""}
        onchange="toggleSelect('${mission.id}','${storageKey}')">
    `;

    // COL 2 - Nom
    const nameCell = document.createElement("td");
    nameCell.style.textAlign = "left";

    if (mission.info) {
      nameCell.innerHTML = `
        <span class="name-wrapper">
          ${mission.name}
          <span class="info-icon">
            ℹ
            <span class="info-tooltip">${mission.info}</span>
          </span>
        </span>
      `;
    } else {
      nameCell.textContent = mission.name;
    }

    // COL 3 - Actif / compteur
    const controlCell = document.createElement("td");
    controlCell.className = "control-cell";

    controlCell.innerHTML = `
      <div class="control-wrapper">
        <button onclick="toggleActive('${mission.id}','${storageKey}')">
          ${state.isActive ? "Stop" : "Start"}
        </button>
        <button onclick="incrementCounter('${mission.id}','${storageKey}')">+</button>
        <span class="counter">${state.count ?? 0}</span>
      </div>
    `;

    // COL 4 - WP
    const wpCell = document.createElement("td");
    if (mission.wp) {
      wpCell.innerHTML = `
        <button onclick="navigator.clipboard.writeText('${mission.wp}')">
          Copier
        </button>
      `;
    }

    row.appendChild(selCell);
    row.appendChild(nameCell);
    row.appendChild(controlCell);
    row.appendChild(wpCell);

    return row;
  }

  if (activeMissions.length > 0) {
    tableBody.appendChild(createSectionRow("🔥 Timers actifs"));
    activeMissions.forEach(m =>
      tableBody.appendChild(createMissionRow(m))
    );
  }

  if (inactiveMissions.length > 0) {
    tableBody.appendChild(createSectionRow("⏳ Timers inactifs"));
    inactiveMissions.forEach(m =>
      tableBody.appendChild(createMissionRow(m))
    );
  }

  document.getElementById("counter").textContent =
    `${selectedCount} / ${data.length}`;
}

/* ===================================================== */
/* ================= ACTIONS =========================== */
/* ===================================================== */

function toggleSelect(id, storageKey) {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  stored[id].selected = !stored[id].selected;
  localStorage.setItem(storageKey, JSON.stringify(stored));
  location.reload();
}

function toggleActive(id, storageKey) {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  stored[id].isActive = !stored[id].isActive;
  localStorage.setItem(storageKey, JSON.stringify(stored));
  location.reload();
}

function incrementCounter(id, storageKey) {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  stored[id].count++;
  localStorage.setItem(storageKey, JSON.stringify(stored));
  location.reload();
}