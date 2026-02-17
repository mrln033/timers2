document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dashboard")) {
    loadDashboard();
  }

  if (document.getElementById("activeContainer")) {
    loadMissions();
  }
});

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
      card.className = "planet-card";

      let totalActivePlanet = 0;

      const title = document.createElement("h2");
      title.innerHTML = `${planet.icon} ${planet.title}`;
      card.appendChild(title);

      const catContainer = document.createElement("div");
      catContainer.className = "category-container";

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

          btn.innerHTML = `${info.category}`;

          if (activeCount > 0) {
            const badge = document.createElement("span");
            badge.className = "badge";
            badge.textContent = activeCount;
            btn.appendChild(badge);
          }

          catContainer.appendChild(btn);
        }
      });

      if (totalActivePlanet > 0) {
        const counter = document.createElement("span");
        counter.className = "planet-counter";
        counter.textContent = `${totalActivePlanet} actifs`;
        title.appendChild(counter);
      }

      card.appendChild(catContainer);
      container.appendChild(card);
    });
  });
}

function loadMissions() {

  const params = new URLSearchParams(window.location.search);
  const planet = params.get("planet");
  const category = params.get("category");

  const file = `timers_${planet}_${category}.json`;
  const storageKey = `timers_${planet}_${category}`;

  fetch(file)
    .then(r => r.json())
    .then(data => {

      let stored = JSON.parse(localStorage.getItem(storageKey)) || {};

      data.sort((a,b)=>
        a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
      );

      data.forEach(mission => {
        if (!stored[mission.id]) {
          stored[mission.id] = { isActive:false, selected:false };
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));

      renderMissions(data, stored, storageKey);

      document.getElementById("showSelectedOnly")
        .addEventListener("change", e => {
          renderMissions(data, stored, storageKey, e.target.checked);
        });
    });
}

function renderMissions(data, stored, storageKey, showSelected=false) {

  const activeContainer = document.getElementById("activeContainer");
  const inactiveContainer = document.getElementById("inactiveContainer");

  activeContainer.innerHTML = "";
  inactiveContainer.innerHTML = "";

  let selectedCount = 0;

  data.forEach(mission => {

    const state = stored[mission.id];

    if (showSelected && !state.selected) return;

    if (state.selected) selectedCount++;

    const div = document.createElement("div");
    div.className = "mission";

    div.innerHTML = `
      <span>${mission.name}</span>
      <div>
        <input type="checkbox" ${state.selected?"checked":""}
          onchange="toggleSelect('${mission.id}','${storageKey}')">
        <button onclick="toggleActive('${mission.id}','${storageKey}')">
          ${state.isActive?"Stop":"Start"}
        </button>
      </div>
    `;

    if (state.isActive)
      activeContainer.appendChild(div);
    else
      inactiveContainer.appendChild(div);
  });

  document.getElementById("counter").textContent =
    `${selectedCount} / ${data.length} sélectionnés`;
}

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
