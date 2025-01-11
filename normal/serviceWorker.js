/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'BackGammon-v20250111';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
  ORIGIN + '/GammonApp/normal/',
  ORIGIN + '/GammonApp/normal/index.html',
  ORIGIN + '/GammonApp/normal/manifest.json',
  ORIGIN + '/GammonApp/normal/icon/favicon.ico',
  ORIGIN + '/GammonApp/normal/icon/apple-touch-icon.png',
  ORIGIN + '/GammonApp/normal/icon/android-chrome-96x96.png',
  ORIGIN + '/GammonApp/normal/icon/android-chrome-192x192.png',
  ORIGIN + '/GammonApp/normal/icon/android-chrome-512x512.png',
  ORIGIN + '/GammonApp/css/bgboardapp.css',
  ORIGIN + '/GammonApp/js/BgClock_class.js',
  ORIGIN + '/GammonApp/js/BgKifu_class.js',
  ORIGIN + '/GammonApp/js/BgGame_class.js',
  ORIGIN + '/css/bgAppBoard.css',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/js/BgAppBoard_class.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js',
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
