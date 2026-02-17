document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});

async function loadDashboard() {

  const container = document.getElementById("dashboard");

  try {
    const [planetsRes, filesRes] = await Promise.all([
      fetch("data/dashboard.json"),
      fetch("data/files.json")
    ]);

    const planets = await planetsRes.json();
    const files = await filesRes.json();

    planets.forEach(planet => {

      const card = document.createElement("div");
      card.className = "planet-card";

      const title = document.createElement("div");
      title.className = "planet-title";
      title.innerHTML = `${planet.icon} ${planet.title}`;
      card.appendChild(title);

      // filtrer les fichiers correspondant à la planète
      const planetFiles = files.filter(f =>
        f.startsWith(`timers_${planet.planet}_`)
      );

      let totalActivePlanet = 0;

      planetFiles.forEach(file => {

        // extraire la catégorie depuis le nom
        const parts = file
          .replace(".json","")
          .split("_");

        const category = parts.slice(2).join("_");

        const storageKey =
          file.replace(".json","");

        const activeCount =
          countActiveTimers(storageKey);

        totalActivePlanet += activeCount;

        const btn = document.createElement("a");
        btn.className = "category-button";
        btn.href =
          `missions.html?planet=${planet.planet}&category=${category}`;

        btn.innerHTML = `
          ${category}
          ${activeCount
            ? `<span class="badge-active">${activeCount}</span>`
            : ""}
        `;

        card.appendChild(btn);
      });

      // Badge global planète
      if (totalActivePlanet > 0) {
        const badge = document.createElement("span");
        badge.className = "planet-badge";
        badge.textContent = totalActivePlanet;
        title.appendChild(badge);
      }

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erreur dashboard :", err);
  }
}