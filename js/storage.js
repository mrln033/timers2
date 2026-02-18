/* ================= STORAGE UTILS ================= */

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || {};
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initMissionStorage(storageKey, missions) {

  let stored = getStorage(storageKey);

  // Initialiser _settings si absent
  if (!stored._settings) {
    stored._settings = {
      showSelected: false
    };
  }

  missions.forEach(m => {
    if (!stored[m.id]) {
      stored[m.id] = {
        selected: false,
        endTime: null
      };
    }
  });

  setStorage(storageKey, stored);
  return stored;
}

function getShowSelected(storageKey) {
  const stored = getStorage(storageKey);
  return stored._settings?.showSelected || false;
}

function setShowSelected(storageKey, value) {
  const stored = getStorage(storageKey);
  if (!stored._settings) stored._settings = {};
  stored._settings.showSelected = value;
  setStorage(storageKey, stored);
}

function toggleSelected(storageKey, id) {
  const stored = getStorage(storageKey);
  stored[id].selected = !stored[id].selected;
  setStorage(storageKey, stored);
}

function toggleTimerState(storageKey, id, durationHours) {

  const stored = getStorage(storageKey);
  const now = Date.now();

  if (stored[id].endTime && stored[id].endTime > now) {
    stored[id].endTime = null;
  } else {
    stored[id].endTime = now + (durationHours * 3600 * 1000);
  }

  setStorage(storageKey, stored);
}

function countActiveTimers(storageKey) {
  const stored = getStorage(storageKey);
  const now = Date.now();

  return Object.entries(stored)
    .filter(([key]) => key !== "_settings")
    .map(([, m]) => m)
    .filter(m => m.endTime && m.endTime > now)
    .length;
}

function countSelectedTimers(storageKey) {
  const stored = getStorage(storageKey);

  return Object.entries(stored)
    .filter(([key]) => key !== "_settings")
    .map(([, m]) => m)
    .filter(m => m.selected === true)
    .length;
}

