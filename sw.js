// Primero intenta la red (para recibir mejoras); sin conexión, sirve lo guardado.
// Nombre propio: en el mismo dominio puede haber otras apps con su propia caché, y no se tocan.
const CACHE = 'kumi-app-v3';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './fuentes/PlayfairDisplay-Italic.woff2', './fuentes/GreatVibes.woff2', './fuentes/Jost.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('kumi-app-') && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // «no-cache» pregunta siempre al servidor: sin él, el móvil se queda hasta 10 minutos con la versión anterior.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
