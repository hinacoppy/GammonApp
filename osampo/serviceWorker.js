/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'Osampo-v20250120';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
  ORIGIN + '/GammonApp/osampo/',
  ORIGIN + '/GammonApp/osampo/index.html',
  ORIGIN + '/GammonApp/osampo/manifest.json',
  ORIGIN + '/GammonApp/osampo/icon/favicon.ico',
  ORIGIN + '/GammonApp/osampo/icon/apple-touch-icon.png',
  ORIGIN + '/GammonApp/osampo/icon/android-chrome-96x96.png',
  ORIGIN + '/GammonApp/osampo/icon/android-chrome-192x192.png',
  ORIGIN + '/GammonApp/osampo/icon/android-chrome-512x512.png',
  ORIGIN + '/GammonApp/osampo/css/OsampoGammon.css',
  ORIGIN + '/GammonApp/osampo/js/BgBoard_class.js',
  ORIGIN + '/GammonApp/osampo/js/BgGame_class.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/js/fontawesome-inuse.min.js',
  ORIGIN + '/js/jquery-3.7.1.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(contentToCache);
    })
  );
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          if (e.request.url.startsWith('http')) { //ignore chrome-extention: request (refuse error msg)
            cache.put(e.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        const [kyappname, kyversion] = key.split('-');
        const [cnappname, cnversion] = cacheName.split('-');
        if (kyappname === cnappname && kyversion !== cnversion) {
          return caches.delete(key);
        }
      }));
    })
  );
});
