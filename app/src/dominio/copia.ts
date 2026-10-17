// Copia de seguridad: un archivo con todos los datos de este móvil. El formato es el mismo que el de la versión 2,
// así que una copia vieja se puede recuperar en la nueva y al revés.
import type { Datos } from '../datos/tipos';
import { MESES, claveSemana } from './fechas';

export function textoUltimaCopia(d: Datos, ahora = Date.now()): string {
  if (!d.ultimaCopia) return 'Todavía no has guardado ninguna copia.';
  const f = new Date(d.ultimaCopia);
  const dias = Math.floor((ahora - d.ultimaCopia) / 86400000);
  return 'Última copia: ' + f.getDate() + ' de ' + MESES[f.getMonth()] + (dias === 0 ? ' (hoy)' : dias === 1 ? ' (ayer)' : ' (hace ' + dias + ' días)') + '.';
}
export function archivoCopia(d: Datos, ahora: Date): File {
  // La copia lleva su propia fecha: al recuperarla, la app sabe cuándo se hizo.
  const contenido = JSON.stringify({ app: 'kumi-kitchen', version: 1, fecha: ahora.toISOString(), datos: { ...d, ultimaCopia: ahora.getTime() } }, null, 1);
  return new File([contenido], 'kumi-copia-' + claveSemana(ahora) + '.json', { type: 'application/json' });
}
export function leerCopia(texto: string): { datos: Datos; fecha: Date | null } | null {
  let obj: { app?: string; datos?: Datos; fecha?: string } & Partial<Datos>;
  try { obj = JSON.parse(texto); } catch { return null; }
  const d = (obj && obj.app === 'kumi-kitchen' ? obj.datos : obj) as Datos | undefined;
  if (!d || !Array.isArray(d.equipo) || typeof d.semanas !== 'object') return null;
  return { datos: d, fecha: obj.fecha ? new Date(obj.fecha) : null };
}
