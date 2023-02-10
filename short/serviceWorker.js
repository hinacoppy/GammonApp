/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'ShortGammon-v20220308';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
  ORIGIN + '/GammonApp/short/',
  ORIGIN + '/GammonApp/short/index.html',
  ORIGIN + '/GammonApp/short/manifest.json',
  ORIGIN + '/GammonApp/short/icon/favicon.ico',
  ORIGIN + '/GammonApp/short/icon/apple-touch-icon.png',
  ORIGIN + '/GammonApp/short/icon/android-chrome-96x96.png',
  ORIGIN + '/GammonApp/short/icon/android-chrome-192x192.png',
  ORIGIN + '/GammonApp/short/icon/android-chrome-512x512.png',
  ORIGIN + '/GammonApp/css/bgboardapp.css',
  ORIGIN + '/css/bgAppBoard.css',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/js/fontawesome-all.min.js',
  ORIGIN + '/js/jquery-3.6.0.min.js',
  ORIGIN + '/js/inobounce.min.js',
  ORIGIN + '/js/BgAppBoard_class.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js',
  ORIGIN + '/GammonApp/js/BgClockStub_class.js',
  ORIGIN + '/GammonApp/js/BgKifuStub_class.js',
  ORIGIN + '/GammonApp/js/BgGame_class.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(contentToCache);
    })
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          cache.put(e.request, response.clone());
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
