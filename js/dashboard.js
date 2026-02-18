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

let planets = await planetsRes.json();
const files = await filesRes.json();

/* 🔹 TRI ALPHABÉTIQUE DES PLANÈTES */
planets.sort((a, b) =>
  a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
);

    planets.forEach(planet => {

      const card = document.createElement("div");
      card.className = "planet-card";

      const title = document.createElement("div");
      title.className = "planet-title";
      title.innerHTML = `${planet.icon} ${planet.title}`;
      card.appendChild(title);

      // filtrer les fichiers correspondant à la planète
let planetFiles = files
  .filter(f => f.startsWith(`timers_${planet.planet}_`))
  .sort((a, b) => {
    const catA = a.replace(".json","").split("_").slice(2).join("_");
    const catB = b.replace(".json","").split("_").slice(2).join("_");
    return catA.localeCompare(catB, "fr", { sensitivity: "base" });
  })
  
// 🚧 Si aucune catégorie pour cette planète
if (planetFiles.length === 0) {
  const soon = document.createElement("div");
  soon.className = "coming-soon";
  soon.textContent = "(🚧 bientôt)";
  card.appendChild(soon);

  container.appendChild(card);
  return; // important : on saute la création des boutons
}
  
      let totalActivePlanet = 0;

      planetFiles.forEach(file => {

        // extraire la catégorie depuis le nom
        const parts = file
          .replace(".json","")
          .split("_");

        const category = parts.slice(2).join("_");

        const storageKey =
          file.replace(".json","");

        const activeCount = countActiveTimers(storageKey);
        const selectedCount = countSelectedTimers(storageKey);

        totalActivePlanet += activeCount;

        const btn = document.createElement("a");
        btn.className = "category-button";
        btn.href =
          `missions.html?planet=${planet.planet}&category=${category}`;

btn.innerHTML = `
  <span class="badge-left">
    ${activeCount ? `<span class="badge-active">${activeCount}</span>` : ""}
  </span>

  <span class="category-name">
    ${category.charAt(0).toUpperCase() + category.slice(1)}
  </span>

  <span class="badge-right">
    ${selectedCount ? `<span class="badge-selected">${selectedCount}</span>` : ""}
  </span>
`;
        card.appendChild(btn);
      });

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erreur dashboard :", err);
  }
}