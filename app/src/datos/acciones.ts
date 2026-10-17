// Cambios sobre los datos. Se usan dentro de usarAlmacen.cambiar(), que trabaja sobre una copia.
import type { Datos, Incidencia, Semana, Turnos } from './tipos';
import { recuentosDelDia } from '../dominio/stock';
import { claveSemana, sumarDias } from '../dominio/fechas';
import { libresDelDia } from '../dominio/horario';

export function semanaDe(d: Datos, lunes: Date): Semana {
  const k = claveSemana(lunes);
  if (!d.semanas[k]) d.semanas[k] = {};
  return d.semanas[k];
}
export function turnosDe(sem: Semana, id: string, dia: number): Turnos {
  if (!sem[id]) sem[id] = Array.from({ length: 7 }, () => ['', '', '', ''] as Turnos);
  return sem[id][dia];
}
export function quitarLibre(d: Datos, fecha: Date, id: string) {
  const k = claveSemana(fecha);
  if (!d.libres || !d.libres[k]) return;
  delete d.libres[k][id];
  if (!Object.keys(d.libres[k]).length) delete d.libres[k];
}
// Al copiar una semana entera, también se copian sus días libres.
export function copiarLibres(d: Datos, desdeLunes: Date, aLunes: Date) {
  for (let i = 0; i < 7; i++) {
    const origen = libresDelDia(d, sumarDias(desdeLunes, i));
    const destino = sumarDias(aLunes, i);
    Object.keys(libresDelDia(d, destino)).forEach((id) => quitarLibre(d, destino, id));
    Object.keys(origen).forEach((id) => {
      if (!d.libres) d.libres = {};
      (d.libres[claveSemana(destino)] = d.libres[claveSemana(destino)] || {})[id] = ['', '', '', ''];
    });
  }
}
export function copiarSemana(d: Datos, desdeLunes: Date, aLunes: Date) {
  d.semanas[claveSemana(aLunes)] = structuredClone(d.semanas[claveSemana(desdeLunes)] || {});
  copiarLibres(d, desdeLunes, aLunes);
}
export function ponerIncidencia(d: Datos, fecha: Date, id: string, inc: Incidencia | null) {
  if (!d.incidencias) d.incidencias = {};
  const k = claveSemana(fecha);
  if (inc) { (d.incidencias[k] = d.incidencias[k] || {})[id] = inc; return; }
  if (d.incidencias[k]) { delete d.incidencias[k][id]; if (!Object.keys(d.incidencias[k]).length) delete d.incidencias[k]; }
}

// «Libre»: se guarda lo que había para recuperarlo si se quita.
export function alternarLibre(d: Datos, lunes: Date, dia: number, id: string) {
  const fecha = sumarDias(lunes, dia);
  const t = turnosDe(semanaDe(d, lunes), id, dia);
  const k = claveSemana(fecha);
  const libre = !!(d.libres?.[k]?.[id]) && !t.some(Boolean);
  if (libre) {
    const antes = d.libres![k][id];
    quitarLibre(d, fecha, id);
    if (Array.isArray(antes)) antes.forEach((v, i) => { t[i] = v; });
  } else {
    if (!d.libres) d.libres = {};
    (d.libres[k] = d.libres[k] || {})[id] = [...t] as Turnos;
    t.fill('');
  }
}
export function vaciarSemana(d: Datos, lunes: Date) {
  d.semanas[claveSemana(lunes)] = {};
  for (let i = 0; i < 7; i++) { const f = sumarDias(lunes, i); Object.keys(libresDelDia(d, f)).forEach((id) => quitarLibre(d, f, id)); }
}

export const nuevoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// --- Corregir un recuento ya guardado (desde la hoja) ---
/** Cambia el día o el tipo de un recuento. Si ese día ya tenía otro, se juntan y en lo repetido manda el que se mueve. */
export function moverRecuento(d: Datos, k: string, nueva: string, tipo: 'semana' | 'mes', ahora: number) {
  const mover = new Set(recuentosDelDia(d, k));
  const otros = nueva === k ? [] : recuentosDelDia(d, nueva).filter((r) => [...mover].some((m) => m.p === r.p));
  d.stock!.recuentos = d.stock!.recuentos.filter((r) => !otros.includes(r));
  const [a, m, dd] = nueva.split('-').map(Number);
  // Hoy: la hora exacta. Otro día: a mediodía, para que quede bien ordenado respecto a las compras.
  const ts = nueva === k ? null : nueva === claveSemana(new Date(ahora)) ? ahora : new Date(a, m - 1, dd, 12).getTime();
  d.stock!.recuentos.forEach((r) => {
    if (!mover.has(r)) return;
    if (ts) r.ts = ts;
    if (tipo === 'mes') r.tipo = 'mes'; else delete r.tipo;
  });
}
export function borrarRecuento(d: Datos, k: string) {
  const quitar = new Set(recuentosDelDia(d, k));
  d.stock!.recuentos = d.stock!.recuentos.filter((r) => !quitar.has(r));
}
/** Corrige (o quita, con null) la cantidad de un producto en el recuento de ese día. */
export function corregirRecuento(d: Datos, k: string, pid: string, cant: number | null) {
  const delDia = recuentosDelDia(d, k);
  const mes = delDia.some((r) => r.tipo === 'mes');
  d.stock!.recuentos = d.stock!.recuentos.filter((r) => !(r.p === pid && delDia.includes(r)));
  if (cant !== null) d.stock!.recuentos.push({ id: nuevoId(), p: pid, cant, ts: delDia[0].ts, ...(mes ? { tipo: 'mes' as const } : {}) });
}
