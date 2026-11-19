var CACHE = 's1xck-store-shell-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  // GitHub API, аватарки, скачивание APK/ZIP — не трогаем вообще
  if(url.origin !== location.origin) return;

  // Страница: сначала сеть (чтоб обновления приходили), офлайн — кэш
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        if(res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        }
        return res;
      }).catch(function(){ return caches.match('./index.html'); })
    );
    return;
  }

  // Статика своего сайта: кэш, потом сеть
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        if(res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});