document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});

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
          const activeCount = countActiveTimers(storageKey);

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