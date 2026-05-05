// ═══════════════════════════════════════════════════════════════
// WOLVEPACK SERVICE WORKER
// Background sync + periodic wake-up for Galaxy Watch & mobile
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'wolvepack-v1';
const CACHE_PATHS = [
  './',
  './index.html',
  './manifest.json',
  'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
];

// ─── INSTALL: Cache essential files ───
self.addEventListener('install', (evt) => {
  console.log('[SW] Installing WolvePack service worker...');
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      // Only cache files that definitely exist
      return cache.addAll(['./index.html', './manifest.json']).catch(() => {
        console.log('[SW] Some files not cacheable (expected for data URIs)');
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: Clean up old caches ───
self.addEventListener('activate', (evt) => {
  console.log('[SW] Activating...');
  evt.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => {
          console.log('[SW] Deleting old cache:', n);
          return caches.delete(n);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH: Network-first with cache fallback ───
self.addEventListener('fetch', (evt) => {
  const { request } = evt;

  // Skip non-GET, cross-origin, or chrome extensions
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Network-first: try live, fall back to cache
  evt.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && !request.url.includes('extension')) {
          const cache_clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cache_clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Last resort: offline page
          if (request.destination === 'document') {
            return new Response('Offline. Open WolvePack to reconnect.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            });
          }
          return null;
        });
      })
  );
});

// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC: Detect device motion while app is closed
// ═══════════════════════════════════════════════════════════════

self.addEventListener('sync', (evt) => {
  console.log('[SW] Background Sync fired:', evt.tag);

  if (evt.tag === 'sync-steps') {
    evt.waitUntil(
      (async () => {
        try {
          // Open the IDB store to access persisted game state
          const db = await openGameStateDB();
          const state = await readGameState(db);

          // Emit an event to any open client about sync completion
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'BACKGROUND_SYNC_COMPLETE',
              timestamp: Date.now(),
              stepsCount: state.todaySteps || 0,
            });
          });

          console.log('[SW] Sync completed. Steps:', state.todaySteps);
        } catch (e) {
          console.error('[SW] Sync error:', e);
          throw e; // Retry the sync
        }
      })()
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// PERIODIC BACKGROUND SYNC: Wake up every 15 mins (if supported)
// ═══════════════════════════════════════════════════════════════

self.addEventListener('periodicsync', (evt) => {
  console.log('[SW] Periodic Sync fired:', evt.tag);

  if (evt.tag === 'refresh-steps') {
    evt.waitUntil(
      (async () => {
        try {
          const db = await openGameStateDB();
          const state = await readGameState(db);

          // Check for any challenges that have been completed
          // and award XP if needed
          const today = new Date().toISOString().slice(0, 10);
          const xpToAward = await checkAndAwardChallenges(state, today, db);

          if (xpToAward > 0) {
            console.log('[SW] Awarded', xpToAward, 'XP from periodic sync');
          }

          // Notify any open client
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC_UPDATE',
              timestamp: Date.now(),
              xpAwarded: xpToAward,
              stepsCount: state.todaySteps || 0,
            });
          });
        } catch (e) {
          console.error('[SW] Periodic sync error:', e);
          throw e; // Retry
        }
      })()
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// INDEXED DB: Persist game state separate from localStorage
// ═══════════════════════════════════════════════════════════════

function openGameStateDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('WolvePack', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state');
      }
      if (!db.objectStoreNames.contains('challenges')) {
        const store = db.createObjectStore('challenges', { keyPath: 'id' });
        store.createIndex('awardedAt', 'awardedAt', { unique: false });
      }
    };
  });
}

function readGameState(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readonly');
    const store = tx.objectStore('state');
    const req = store.get('gs');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const data = req.result || {};
      resolve(data);
    };
  });
}

function writeGameState(db, state) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    const req = store.put(state, 'gs');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

function getOrCreateChallengeRecord(db, id, date) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('challenges', 'readwrite');
    const store = tx.objectStore('challenges');
    const idx = store.index('awardedAt');
    const req = idx.get(date);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const records = [];
      const records_req = idx.getAll(date);
      records_req.onsuccess = () => {
        const byId = records_req.result.find((r) => r.id === id);
        if (byId) {
          resolve(byId);
        } else {
          const newRecord = { id, awardedAt: date, xp: 0 };
          const add_req = store.add(newRecord);
          add_req.onsuccess = () => resolve(newRecord);
          add_req.onerror = () => reject(add_req.error);
        }
      };
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// CHALLENGE CHECKING: Run in background sync
// ═══════════════════════════════════════════════════════════════

const CHALLENGES = [
  { id: 'half', minSteps: 0.5, xp: 50 },
  { id: 'sev', minSteps: 0.7, xp: 80 },
  { id: 'goal', minSteps: 1.0, xp: 150 },
  { id: '2k', minSteps: 2000, xp: 20 },
  { id: '5k', minSteps: 5000, xp: 45 },
  { id: '8k', minSteps: 8000, xp: 70 },
  { id: '10k', minSteps: 10000, xp: 100 },
];

async function checkAndAwardChallenges(state, today, db) {
  const steps = state.todaySteps || 0;
  const goal = state.goal || 10000;
  let totalXpAwarded = 0;

  for (const ch of CHALLENGES) {
    const minVal = ch.minSteps < 1 ? goal * ch.minSteps : ch.minSteps;
    if (steps >= minVal) {
      const record = await getOrCreateChallengeRecord(db, ch.id, today);
      if (!record.awarded) {
        record.awarded = true;
        totalXpAwarded += ch.xp;
        // Update the challenge record
        await new Promise((resolve, reject) => {
          const tx = db.transaction('challenges', 'readwrite');
          const store = tx.objectStore('challenges');
          const req = store.put(record);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve();
        });
      }
    }
  }

  if (totalXpAwarded > 0) {
    state.xp = (state.xp || 0) + totalXpAwarded;
    await writeGameState(db, state);
  }

  return totalXpAwarded;
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLER: Receive commands from the app
// ═══════════════════════════════════════════════════════════════

self.addEventListener('message', (evt) => {
  const { type, payload } = evt.data || {};
  console.log('[SW] Message received:', type);

  if (type === 'REGISTER_BACKGROUND_SYNC') {
    if ('SyncManager' in self) {
      self.registration.sync
        .register('sync-steps')
        .then(() => console.log('[SW] Background sync registered'))
        .catch((e) => console.error('[SW] Sync registration failed:', e));
    }
  }

  if (type === 'REGISTER_PERIODIC_SYNC') {
    if ('PeriodicSyncManager' in self) {
      self.registration.periodicSync
        .register('refresh-steps', { minInterval: 15 * 60 * 1000 }) // 15 mins
        .then(() => console.log('[SW] Periodic sync registered'))
        .catch((e) => console.error('[SW] Periodic sync registration failed:', e));
    }
  }

  if (type === 'KEEP_ALIVE') {
    // App is asking SW to stay active — echo back to confirm
    evt.ports[0]?.postMessage({ type: 'KEEP_ALIVE_ACK' });
  }
});

console.log('[SW] WolvePack service worker loaded. Background sync ready! 🐺');
