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
      header.classNa
