/* ================= STORAGE UTILS ================= */

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || {};
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initMissionStorage(storageKey, missions) {

  let stored = getStorage(storageKey);

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

  return Object.values(stored)
    .filter(m => m.endTime && m.endTime > now).length;
}

function countSelectedTimers(storageKey) {
  const stored = getStorage(storageKey);

  return Object.values(stored)
    .filter(m => m.selected === true).length;
}

