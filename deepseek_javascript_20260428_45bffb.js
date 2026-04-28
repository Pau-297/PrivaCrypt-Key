// Service Worker para PrivaCrypt Key
// Estrategia: cache-first con fallback a index.html para soporte offline completo

const CACHE_NAME = 'privacrypt-cache-v1';
const urlsToCache = [
  '/privacrypt/',
  '/privacrypt/index.html',
  '/privacrypt/manifest.json'
];

// Instalación: cachear recursos esenciales
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: estrategia cache-first con fallback a index.html
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devuelve de caché si existe
        if (response) {
          return response;
        }
        
        // Si no está en caché, intenta la red
        return fetch(event.request).then(
          function(response) {
            // Verifica si la respuesta es válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la respuesta para cachearla y devolverla
            var responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        ).catch(function() {
          // Si falla la red, devuelve index.html como fallback (para navegación)
          if (event.request.mode === 'navigate') {
            return caches.match('/privacrypt/index.html');
          }
        });
      })
  );
});