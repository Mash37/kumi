import { create } from 'zustand';
import type { Datos } from './tipos';
import { copiaNativa, prepararNativa } from '../nativo';

export const CLAVE = 'kumi-datos-v1';

function cargar(): Datos {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    if (d && Array.isArray(d.equipo)) return d as Datos;
  } catch { /* datos dañados o sin acceso: se empieza de cero */ }
  return { equipo: [], semanas: {} };
}

interface Almacen {
  datos: Datos;
  /** Cambia los datos sobre una copia y la guarda: así React ve siempre un objeto nuevo. */
  cambiar: (receta: (d: Datos) => void) => void;
  reemplazar: (d: Datos) => void;
}

export const usarAlmacen = create<Almacen>((set, get) => ({
  datos: cargar(),
  cambiar: (receta) => {
    const copia = structuredClone(get().datos);
    receta(copia);
    set({ datos: copia });
  },
  reemplazar: (d) => set({ datos: d }),
}));

usarAlmacen.subscribe(({ datos }) => {
  const texto = JSON.stringify(datos);
  try { localStorage.setItem(CLAVE, texto); }
  catch { /* sin espacio o en modo privado: la pantalla avisa al guardar */ }
  copiaNativa(texto);
});

prepararNativa((texto) => {
  try { const d = JSON.parse(texto); if (d && Array.isArray(d.equipo)) usarAlmacen.setState({ datos: d }); } catch { /* copia dañada: se ignora */ }
}, !!localStorage.getItem(CLAVE));
