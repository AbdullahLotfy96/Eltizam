const CACHE_NAME = 'mohasaba-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version; fall back to cache only when offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('notificationclick', (event) => {
  const key = event.notification.data && event.notification.data.prayerKey;
  event.notification.close();
  if(event.action === 'no'){ return; }
  if(!key) return;
  event.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then((clientList) => {
      for(const client of clientList){
        if('focus' in client){
          client.postMessage({type:'mark-prayer', key});
          return client.focus();
        }
      }
      return self.clients.openWindow('./index.html?markPrayer='+key);
    })
  );
});
