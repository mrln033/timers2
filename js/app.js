
  fetch(file)
    .then(r => {
      if (!r.ok) throw new Error("Fichier introuvable");
      return r.json();
    })
    .then(data => {

      data.sort((a,b)=>
        a.name.localeCompare(b.name,'fr',{sensitivity:'base'})
      );

      let stored = JSON.parse(localStorage.getItem(storageKey)) || {};

      data.forEach(m => {
        if (!stored[m.id]) {
          stored[m.id] = {
            isActive:false,
            selected:false,
            count:0
          };
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));

      renderMissions(data, stored, storageKey);

      document.getElementById("showSelectedOnly")
        ?.addEventListener("change", e => {
          renderMissions(data, stored, storageKey, e.target.checked);
        });
    })
    .catch(err => console.error(err));
}

function renderMissions(data, stored, storageKey, showSelected=false) {

  const table = document.getElementById("timersTable");
  table.innerHTML = "";

  let selectedCount = 0;

  const active = [];
  const inactive = [];

  data.forEach(m => {
    const state = stored[m.id];

    if (showSelected && !state.selected) return;

    if (state.selected) selectedCount++;

    if (state.isActive) active.push(m);
    else inactive.push(m);
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
    const row = document.createElement("tr");

    if (state.isActive) row.classList.add("active-row");

    row.innerHTML = `
      <td>
        <input type="checkbox" ${state.selected ? "checked" : ""}
          onchange="toggleSelect('${m.id}','${storageKey}')">
      </td>
      <td style="text-align:left;">
        ${m.info ?
          `<span class="name-wrapper">
             ${m.name}
             <span class="info-icon">ℹ
               <span class="info-tooltip">${m.info}</span>
             </span>
           </span>`
          : m.name}
      </td>
      <td>
        <button onclick="toggleActive('${m.id}','${storageKey}')">
          ${state.isActive ? "Stop" : "Start"}
        </button>
        <button onclick="incrementCounter('${m.id}','${storageKey}')">+</button>
        <span class="counter">${state.count ?? 0}</span>
      </td>
      <td>
        ${m.wp ? `<button onclick="navigator.clipboard.writeText('${m.wp}')">Copier</button>` : ""}
      </td>
    `;

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