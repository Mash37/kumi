// Fichaje: entradas y salidas de cada persona, guardadas en la nube con la hora del servidor.
// Un fichaje nunca se cambia ni se borra: corregirlo añade otro registro que dice a cuál sustituye.
import { claveSemana } from './fechas';

export type TipoFichaje = 'entrada' | 'salida' | 'anula';
/** cuando: hora del servidor al guardarlo. hora: la hora que pone la jefa al corregir. corrige: id del registro al que sustituye. */
export interface Fichaje { id: string; uid: string; personaId: string; tipo: TipoFichaje; cuando: number; mes: string; hora?: number; corrige?: string | null; motivo?: string }
/** Un registro que cuenta, con su hora efectiva. */
export interface Marca { f: Fichaje; h: number; corregida: boolean }
export interface TramoFichado { personaId: string; e: Marca | null; s: Marca | null }

/** Pasadas estas horas sin salida, la entrada se da por olvidada: la siguiente vez se ficha una entrada nueva. */
export const OLVIDO_SALIDA = 16 * 3600000;

export const claveMes = (f: Date) => f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0');
export const mesAnterior = (f: Date) => claveMes(new Date(f.getFullYear(), f.getMonth() - 1, 1));

/** Lo que cuenta: sin los registros sustituidos por una corrección ni las anulaciones. */
export function vigentes(lista: Fichaje[]): Marca[] {
  const sustituidos = new Set(lista.map((f) => f.corrige).filter((x): x is string => !!x));
  return lista
    .filter((f) => f.tipo !== 'anula' && !sustituidos.has(f.id))
    .map((f) => ({ f, h: f.hora ?? f.cuando, corregida: f.hora != null }))
    .sort((a, b) => a.h - b.h);
}

/** Empareja cada entrada con su salida. Una entrada sin salida o una salida sin entrada quedan solas para corregirlas. */
export function tramosFichados(lista: Fichaje[]): TramoFichado[] {
  const porPersona = new Map<string, Marca[]>();
  vigentes(lista).forEach((m) => { if (!porPersona.has(m.f.personaId)) porPersona.set(m.f.personaId, []); porPersona.get(m.f.personaId)!.push(m); });
  const tramos: TramoFichado[] = [];
  porPersona.forEach((marcas, personaId) => {
    let abierta: Marca | null = null;
    marcas.forEach((m) => {
      if (m.f.tipo === 'entrada') {
        if (abierta) tramos.push({ personaId, e: abierta, s: null });
        abierta = m;
      } else {
        tramos.push({ personaId, e: abierta, s: m });
        abierta = null;
      }
    });
    if (abierta) tramos.push({ personaId, e: abierta, s: null });
  });
  return tramos.sort((a, b) => horaTramo(a) - horaTramo(b));
}

export const horaTramo = (t: TramoFichado) => (t.e ?? t.s)!.h;
/** Los tramos que pasan de medianoche cuentan en el día en que empiezan, como en el horario. */
export const diaTramo = (t: TramoFichado) => claveSemana(new Date(horaTramo(t)));
export const minutosTramo = (t: TramoFichado) => (t.e && t.s ? Math.max(0, Math.floor(t.s.h / 60000) - Math.floor(t.e.h / 60000)) : 0);

/** Si la persona está dentro ahora: su entrada abierta, o null. */
export function dentroDesde(lista: Fichaje[], personaId: string, ahora: number): Marca | null {
  const suyos = tramosFichados(lista).filter((t) => t.personaId === personaId);
  const ultimo = suyos[suyos.length - 1];
  return ultimo && ultimo.e && !ultimo.s && ahora - ultimo.e.h < OLVIDO_SALIDA ? ultimo.e : null;
}

/** Entrada o salida que falta, según la hora: para avisar a la jefa. */
export const sinCerrar = (t: TramoFichado, ahora: number) => (!t.e) || (!t.s && ahora - t.e!.h >= OLVIDO_SALIDA);
