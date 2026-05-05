// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC INIT
// Run in the main app to register service worker & background sync
// ═══════════════════════════════════════════════════════════════

(function initBackgroundSync() {
  console.log('🐺 Initializing background sync...');

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js', { scope: './' })
      .then((reg) => {
        console.log('🐺 Service Worker registered!', reg.scope);

        // Request background sync permission
        if ('SyncManager' in window) {
          reg.sync
            .register('sync-steps')
            .then(() => console.log('🐺 Background sync enabled'))
            .catch((e) => console.log('Background sync unavailable:', e.message));
        } else {
          console.log('Background Sync API not available on this browser');
        }

        // Request periodic sync (15-minute intervals)
        if ('PeriodicSyncManager' in window) {
          reg.periodicSync
            .register('refresh-steps', { minInterval: 15 * 60 * 1000 })
            .then(() => console.log('🐺 Periodic sync enabled (15 mins)'))
            .catch((e) => console.log('Periodic Sync API not available:', e.message));
        }
      })
      .catch((e) => {
        console.error('🐺 Service Worker registration failed:', e);
      });
  }

  // Listen for sync messages from the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (evt) => {
      const { type, stepsCount, xpAwarded, timestamp } = evt.data || {};

      if (type === 'BACKGROUND_SYNC_COMPLETE') {
        console.log('🐺 Background sync complete. Steps:', stepsCount);
        // Update UI if app is open
        const countEl = document.getElementById('step-count');
        if (countEl) {
          // Force a UI refresh
          if (typeof updateUI === 'function') updateUI();
        }
      }

      if (type === 'PERIODIC_SYNC_UPDATE') {
        console.log('🐺 Periodic update. XP awarded:', xpAwarded, 'Steps:', stepsCount);
        // Refresh UI
        if (typeof updateUI === 'function') updateUI();
      }
    });
  }

  // Request wake lock while the app is active (keeps it from sleeping)
  if ('wakeLock' in navigator) {
    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        console.log('🐺 Wake lock acquired — screen will stay on');
        // Release on visibility change
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            lock.release();
            console.log('🐺 Wake lock released (app in background)');
          }
        });
      } catch (e) {
        console.log('Wake lock unavailable:', e.message);
      }
    };
    // Request on first interaction (required by spec)
    document.addEventListener(
      'click',
      () => {
        requestWakeLock();
      },
      { once: true }
    );
  }

  console.log('🐺 Background sync initialized. Your pack is hunting 24/7!');
})();
