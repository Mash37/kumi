import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans/wght.css';
import './estilos/legado.css';
import './estilos/hoja.css';
import './estilos/kumi.css';
import { App } from './App';

// Los datos solo viven en este dispositivo: se pide al navegador que no los borre cuando le falte espacio.
navigator.storage?.persist?.().catch(() => {});
// La versión 2 guardaba la app en cachés «kumi-app-v1…v5»: la 3 usa otra, así que esas solo ocupan sitio.
// Ojo: Kumi Mara vive en el mismo dominio con cachés «kumi-v…»; esas no se tocan.
window.caches?.keys().then((claves) => claves.filter((k) => /^kumi-app-v\d+$/.test(k)).forEach((k) => caches.delete(k))).catch(() => {});

createRoot(document.getElementById('raiz')!).render(<StrictMode><App /></StrictMode>);
