import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos/legado.css';
import './estilos/hoja.css';
import { App } from './App';

// Los datos solo viven en este dispositivo: se pide al navegador que no los borre cuando le falte espacio.
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('raiz')!).render(<StrictMode><App /></StrictMode>);
