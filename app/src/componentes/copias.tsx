import { usarAlmacen } from '../datos/almacen';
import { archivoCopia, leerCopia } from '../dominio/copia';
import { MESES } from '../dominio/fechas';
import { usarUi } from '../estado/ui';
import { compartirArchivo, descargar } from './archivos';

export async function guardarCopia() {
  const ahora = new Date();
  const archivo = archivoCopia(usarAlmacen.getState().datos, ahora);
  try { if (!(await compartirArchivo(archivo, 'Copia de Kumi'))) descargar(archivo); }
  catch { descargar(archivo); }
  usarAlmacen.getState().cambiar((x) => { x.ultimaCopia = ahora.getTime(); });
  usarUi.getState().avisar('Copia guardada: ' + archivo.name);
}

// Abre el selector de archivos del móvil y, si es una copia de Kumi, la recupera (con «Deshacer»).
export function recuperarCopia() {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'application/json,.json';
  entrada.onchange = async () => {
    const archivo = entrada.files?.[0];
    if (!archivo) return;
    const { avisar, ofrecerDeshacer } = usarUi.getState();
    const copia = leerCopia(await archivo.text());
    if (!copia) { avisar('Ese archivo no es una copia de Kumi'); return; }
    const cuando = copia.fecha ? ' del ' + copia.fecha.getDate() + ' de ' + MESES[copia.fecha.getMonth()] + ' de ' + copia.fecha.getFullYear() : '';
    if (!confirm('Se va a cambiar todo lo que hay en este móvil por la copia' + cuando + ' (' + copia.datos.equipo.length + ' personas en el equipo). ¿Seguir?')) return;
    const antes = usarAlmacen.getState().datos;
    // Por si acaso: lo que había queda guardado aparte antes de restaurar.
    try { localStorage.setItem('kumi-antes-de-restaurar', JSON.stringify(antes)); } catch { /* sin espacio */ }
    usarAlmacen.getState().reemplazar(copia.datos);
    ofrecerDeshacer('Copia recuperada', () => usarAlmacen.getState().reemplazar(antes));
  };
  entrada.click();
}
