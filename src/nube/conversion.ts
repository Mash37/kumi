// Lo que se sube al publicar: equipo y turnos de la semana (sin stock, notas ni nóminas). Y al revés, en el móvil del equipo.
import type { Datos } from '../datos/tipos';
import { quitarLibre } from '../datos/acciones';
import { claveSemana, fechaDeClave, sumarDias } from '../dominio/fechas';
import { esLibre, libresDelDia } from '../dominio/horario';
import type { SemanaNube } from './firebase';

export function semanaANube(d: Datos, clave: string): SemanaNube {
  const lun = fechaDeClave(clave), sem = d.semanas[clave] || {}, turnos: Record<string, string[]> = {}, libres: Record<string, number[]> = {};
  d.equipo.forEach((p) => {
    if (sem[p.id]) turnos[p.id] = sem[p.id].map((t) => t.join('|'));
    const l = [0, 1, 2, 3, 4, 5, 6].filter((i) => esLibre(d, sumarDias(lun, i), p.id));
    if (l.length) libres[p.id] = l;
  });
  return { equipo: d.equipo.map((p) => ({ id: p.id, nombre: p.nombre, contrato: p.contrato || null })), turnos, libres };
}
export function semanaDesdeNube(d: Datos, s: SemanaNube & { clave: string }) {
  const lun = fechaDeClave(s.clave), sem: Datos['semanas'][string] = {};
  Object.entries(s.turnos || {}).forEach(([pid, dias]) => { sem[pid] = dias.map((x) => x.split('|') as [string, string, string, string]); });
  d.semanas[s.clave] = sem;
  for (let i = 0; i < 7; i++) { const f = sumarDias(lun, i); Object.keys(libresDelDia(d, f)).forEach((id) => quitarLibre(d, f, id)); }
  Object.entries(s.libres || {}).forEach(([pid, ds]) => ds.forEach((i) => {
    const k = claveSemana(sumarDias(lun, i));
    d.libres = d.libres || {};
    (d.libres[k] = d.libres[k] || {})[pid] = ['', '', '', ''];
  }));
}
