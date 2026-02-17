(function () {

  /* ===========================
     DASHBOARD
  ============================ */

  function loadDashboard() {
    const container = document.getElementById("dashboard");
    if (!container) return;

    fetch("data/dashboard.json")
      .then(res => res.json())
      .then(data => {
        data.forEach(item => {

          const card = document.createElement("a");
          card.className = "dashboard-card";
          card.href =
            `missions.html?planet=${item.planet}&category=${item.category}`;

          card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <div class="title">${item.title}</div>
          `;

          container.appendChild(card);
        });
      });
  }

  /* ===========================
     MISSIONS PAGE
  ============================ */

  function loadMissions() {

    const tableBody = document.getElementById("timersTable");
    if (!tableBody) return;

    const params = new URLSearchParams(window.location.search);
    const planet = params.get("planet");
    const category = params.get("category");

    if (!planet || !category) return;

    const jsonPath = `data/timers_${planet}_${category}.json`;
    const storageKey = `timers_${planet}_${category}`;

    document.getElementById("pageTitle").textContent =
      `${planet.toUpperCase()} - ${category.toUpperCase()}`;

    initTimers(jsonPath, storageKey);
  }

  /* ===========================
     TIMER ENGINE (ton système)
  ============================ */

  function initTimers(configUrl, storageKey) {

    let configTimers = [];
    let state = {};
    let rowsMap = {};

    const tableBody = document.getElementById("timersTable");
    const selectionCounter = document.getElementById("selectionCounter");
    const filterCheckbox = document.getElementById("filterSelected");

    fetch(configUrl)
      .then(res => res.json())
      .then(data => {
        configTimers = data;
        loadState();
        render();
        setInterval(updateTimers, 1000);
      });

    function loadState() {
      const saved = localStorage.getItem(storageKey);
      state = saved ? JSON.parse(saved) : {};

      configTimers.forEach(t => {
        if (!state[t.id]) {
          state[t.id] = { endTime: null, selected: false };
        }
      });
    }

    function saveState() {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function render() {

      tableBody.innerHTML = "";
      rowsMap = {};

      const active = [];
      const inactive = [];

      configTimers.forEach(t => {
        state[t.id].endTime ? active.push(t) : inactive.push(t);
      });

      const sort = (a,b)=>
        a.name.localeCompare(b.name,"fr",{sensitivity:"base"});

      active.sort(sort);
      inactive.sort(sort);

      [...active, ...inactive].forEach(addRow);

      updateSelectionCounter();
    }

    function addRow(timer) {

      const s = state[timer.id];
      const isActive = !!s.endTime;

      const row = document.createElement("tr");

      /* Sél */
      const selectCell = document.createElement("td");
      const selectBox = document.createElement("input");
      selectBox.type = "checkbox";
      selectBox.checked = s.selected;

      selectBox.onchange = () => {
        s.selected = selectBox.checked;
        saveState();
        render();
      };

      selectCell.appendChild(selectBox);

      /* Nom */
      const nameCell = document.createElement("td");
      nameCell.textContent = timer.name;

      /* Timer */
      const timerCell = document.createElement("td");

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = isActive;

      const counter = document.createElement("span");
      counter.className = "counter";

      toggle.onchange = () => {
        s.endTime = toggle.checked
          ? Date.now() + timer.durationHours*3600*1000
          : null;
        saveState();
        render();
      };

      timerCell.appendChild(toggle);
      timerCell.appendChild(counter);

      /* Copy */
      const copyCell = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "📋";

      btn.onclick = async () => {
        await navigator.clipboard.writeText(timer.coords);
        btn.textContent = "✔";
        setTimeout(()=>btn.textContent="📋",1000);
      };

      copyCell.appendChild(btn);

      row.append(selectCell,nameCell,timerCell,copyCell);
      tableBody.appendChild(row);

      rowsMap[timer.id] = { counter };
    }

    function updateTimers() {
      configTimers.forEach(timer => {
        const row = rowsMap[timer.id];
        if (!row) return;

        const s = state[timer.id];
        const total = timer.durationHours*3600*1000;

        if (!s.endTime) {
          display(row.counter,total);
          return;
        }

        const remaining = s.endTime - Date.now();

        if (remaining<=0){
          s.endTime=null;
          saveState();
          render();
          return;
        }

        display(row.counter,remaining);
      });
    }

    function display(el,ms){
      const t=Math.floor(ms/1000);
      const h=Math.floor(t/3600);
      const m=Math.floor((t%3600)/60);
      const s=t%60;
      el.textContent=
        `${h.toString().padStart(2,"0")}h `+
        `${m.toString().padStart(2,"0")}m `+
        `${s.toString().padStart(2,"0")}s`;
    }

    function updateSelectionCounter(){
      const total=configTimers.length;
      const sel=configTimers.filter(t=>state[t.id].selected).length;
      selectionCounter.textContent=`Sélectionnés : ${sel}/${total}`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadMissions();
  });

})();
