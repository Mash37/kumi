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

const AVISO_SIN_GUARDAR_CADA = 10000;
let ultimoAvisoSinGuardar = 0;
usarAlmacen.subscribe(({ datos }) => {
  const texto = JSON.stringify(datos);
  try { localStorage.setItem(CLAVE, texto); }
  catch {
    // Sin espacio o en modo privado: lo que no se guarda se pierde al cerrar, así que se avisa (como mucho cada 10 s).
    // La pantalla se carga aquí y no arriba porque estado/ui ya importa este archivo.
    if (Date.now() - ultimoAvisoSinGuardar > AVISO_SIN_GUARDAR_CADA) {
      ultimoAvisoSinGuardar = Date.now();
      import('../estado/ui').then((m) => m.usarUi.getState().avisar('No se pudo guardar en este móvil. ¿Le queda espacio?'));
    }
  }
  copiaNativa(texto);
});

prepararNativa((texto) => {
  try { const d = JSON.parse(texto); if (d && Array.isArray(d.equipo)) usarAlmacen.setState({ datos: d }); } catch { /* copia dañada: se ignora */ }
}, !!localStorage.getItem(CLAVE));
