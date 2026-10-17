// Cálculos del horario: descansos, gente por servicio, faltas y coberturas, informe del mes.
// Funciones puras: reciben los datos y no cambian nada. Las pruebas las comparan con la versión 2.
import type { Datos, Franja, Incidencia, Reglas, Semana, Turnos } from '../datos/tipos';
import { DIAS, claveSemana, lunesDe, sumarDias } from './fechas';
import { tramo } from './horas';

export const REGLAS_ESTATUTO: Reglas = { entreDias: 12, semanal: 36, maxDia: 9, maxSemana: 40 };
export const MOTIVOS = ['Enfermedad o baja', 'Asunto propio', 'Vacaciones', 'Sin avisar', 'Otro'];
export const VACIO: Turnos = ['', '', '', ''];
export const FRANJAS_INICIALES: Franja[] = [
  { id: 'mediodia', nombre: 'Mediodía', icono: '☀️', desde: '12:00', hasta: '16:00', minimo: 2, dias: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'noche', nombre: 'Noche', icono: '🌙', desde: '20:00', hasta: '0:00', minimo: 2, dias: [0, 1, 2, 3, 4, 5, 6] },
];

type Tramo = [number, number];
export interface Aviso { id?: string; dia: number | null; texto: string; que?: string; icono?: string }

export function reglas(d: Datos): Reglas { return { ...REGLAS_ESTATUTO, ...(d.reglas || {}) }; }
export function franjas(d: Datos): Franja[] { return d.franjas ?? FRANJAS_INICIALES; }
export function nombreCorto(n: string): string { return n.charAt(0) + n.slice(1).toLowerCase(); }
// Exacto para la nómina: «152 h 30 min», nunca redondeado.
export function horasExactas(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? h + ' h ' + m + ' min' : h + ' h';
}
export function horaTxt(m: number): string { m = ((m % 1440) + 1440) % 1440; return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
export function textoTurnoCorto(a: string, b: string): string { return a || b ? (a || '?') + '–' + (b || '?') : ''; }
export function textoTurnos4(t: Turnos): string { return [textoTurnoCorto(t[0], t[1]), textoTurnoCorto(t[2], t[3])].filter(Boolean).join(' y '); }
export function tramosDe(t: Turnos): Tramo[] { return [tramo(t[0], t[1]), tramo(t[2], t[3])].filter((x): x is Tramo => !!x); }
export function minutosDe(tramos: Tramo[]): number { return tramos.reduce((s, [a, b]) => s + b - a, 0); }
function solape(a: number, b: number, c: number, e: number): number { return Math.max(0, Math.min(b, e) - Math.max(a, c)); }

export function nombreDe(d: Datos, id: string): string {
  const p = d.equipo.find((x) => x.id === id);
  if (p) return p.nombre.toUpperCase();
  return d.bajas && d.bajas[id] ? d.bajas[id].toUpperCase() + ' (baja)' : 'SIN NOMBRE';
}

// --- Plan, libres e incidencias de un día ---
export function turnosPlan(d: Datos, fecha: Date, id: string): Turnos {
  const sem = d.semanas[claveSemana(lunesDe(fecha))];
  return sem && sem[id] ? sem[id][(fecha.getDay() + 6) % 7] : VACIO;
}
export function libresDelDia(d: Datos, fecha: Date): Record<string, Turnos> { return (d.libres || {})[claveSemana(fecha)] || {}; }
export function esLibre(d: Datos, fecha: Date, id: string): boolean { return !!libresDelDia(d, fecha)[id] && !turnosPlan(d, fecha, id).some(Boolean); }
export function incidenciasDelDia(d: Datos, fecha: Date): Record<string, Incidencia> { return (d.incidencias || {})[claveSemana(fecha)] || {}; }
export function incidenciaDe(d: Datos, fecha: Date, id: string): Incidencia | null { return incidenciasDelDia(d, fecha)[id] || null; }
// Faltó: 0 · Cambió: sus horas reales · Cubre: su plan más el turno que cubre.
export function tramosReales(d: Datos, fecha: Date, id: string): Tramo[] {
  const plan = tramosDe(turnosPlan(d, fecha, id));
  const inc = incidenciaDe(d, fecha, id);
  if (!inc) return plan;
  if (inc.tipo === 'falta') return [];
  if (inc.tipo === 'cambio') return tramosDe(inc.turnos);
  return plan.concat(tramosDe(inc.turnos));
}
export function textoIncidencia(d: Datos, inc: Incidencia, fecha: Date, id: string): string {
  if (inc.tipo === 'falta') {
    const quien = Object.entries(incidenciasDelDia(d, fecha)).find(([, x]) => x.tipo === 'cubre' && x.a === id);
    return 'Faltó · ' + inc.motivo + (quien ? ' · cubre: ' + nombreDe(d, quien[0]) : '');
  }
  if (inc.tipo === 'cambio') return tramosDe(inc.turnos).length ? 'Hizo ' + textoTurnos4(inc.turnos) : 'No trabajó';
  return 'Cubre a ' + nombreDe(d, inc.a) + ' · ' + textoTurnos4(inc.turnos);
}

// --- Descansos y horas de la semana ---
export function avisosSemana(d: Datos, lunesSem: Date): Aviso[] {
  const sem: Semana = d.semanas[claveSemana(lunesSem)] || {};
  const anterior = d.semanas[claveSemana(sumarDias(lunesSem, -7))];
  const siguiente = d.semanas[claveSemana(sumarDias(lunesSem, 7))];
  const avisos: Aviso[] = [];
  const R = reglas(d);
  d.equipo.forEach((p) => {
    if (!sem[p.id]) return;
    // Cada día como tramos en minutos desde el lunes a las 0:00 (el domingo anterior es el día -1).
    const delDia = (fuente: Semana | undefined, i: number) => (fuente && fuente[p.id] ? tramosDe(fuente[p.id][i]) : []);
    const dias: { d: number; tramos: Tramo[] }[] = [];
    for (let i = -1; i <= 7; i++) {
      const t = i === -1 ? delDia(anterior, 6) : i === 7 ? delDia(siguiente, 0) : delDia(sem, i);
      dias.push({ d: i, tramos: t.map(([a, b]) => [a + i * 1440, b + i * 1440] as Tramo) });
    }
    const semana = dias.filter((x) => x.d >= 0 && x.d <= 6);
    const total = semana.reduce((s, x) => s + minutosDe(x.tramos), 0);
    if (!total) return;
    const nombre = nombreCorto(p.nombre);
    semana.forEach((x) => {
      const min = minutosDe(x.tramos);
      if (min > R.maxDia * 60) avisos.push({ id: p.id, dia: x.d, texto: nombre + ' trabaja ' + horasExactas(min) + ' el ' + DIAS[x.d] + ' (más de ' + R.maxDia + ' h en el día).' });
      const antes = dias.find((y) => y.d === x.d - 1)!;
      if (!x.tramos.length || !antes.tramos.length) return;
      const hueco = Math.min(...x.tramos.map((t) => t[0])) - Math.max(...antes.tramos.map((t) => t[1]));
      if (hueco < R.entreDias * 60) {
        avisos.push({ id: p.id, dia: x.d, texto: nombre + ' solo descansa ' + horasExactas(Math.max(0, hueco)) + ' entre el ' + (x.d === 0 ? 'domingo' : DIAS[x.d - 1]) + ' y el ' + DIAS[x.d] + ' (mínimo ' + R.entreDias + ' h).' });
      }
    });
    // Con horas de contrato se compara con su jornada; sin contrato, con el máximo semanal.
    const contrato = (+(p.contrato ?? 0) || 0) * 60;
    if (contrato && total > contrato) avisos.push({ id: p.id, dia: null, texto: nombre + ' suma ' + horasExactas(total) + '; su contrato es de ' + horasExactas(contrato) + ' (' + horasExactas(total - contrato) + ' de más).' });
    else if (contrato && total < contrato) avisos.push({ id: p.id, dia: null, texto: nombre + ' suma ' + horasExactas(total) + '; le faltan ' + horasExactas(contrato - total) + ' para sus ' + horasExactas(contrato) + ' de contrato.' });
    else if (!contrato && total > R.maxSemana * 60) avisos.push({ id: p.id, dia: null, texto: nombre + ' suma ' + horasExactas(total) + ' esta semana (más de ' + R.maxSemana + ' h).' });
    // Descanso semanal: el hueco más largo entre turnos. Si la semana de al lado no está rellena,
    // se supone que no se entra antes del mediodía (así no salta un falso aviso por librar el domingo).
    const todos = dias.flatMap((x) => x.tramos).sort((a, b) => a[0] - b[0]);
    const inicio = anterior ? -1440 : -720, fin = siguiente ? 8 * 1440 : 7 * 1440 + 720;
    let maxHueco = 0, ultimoFin = inicio;
    todos.forEach(([a, b]) => { maxHueco = Math.max(maxHueco, a - ultimoFin); ultimoFin = Math.max(ultimoFin, b); });
    maxHueco = Math.max(maxHueco, fin - ultimoFin);
    if (maxHueco < R.semanal * 60) avisos.push({ id: p.id, dia: null, texto: nombre + ' no tiene ' + R.semanal + ' h de descanso seguidas esta semana.' });
  });
  return avisos;
}

// --- Gente en cada servicio (con faltas y coberturas apuntadas) ---
export interface Cobertura { f: Franja; min: number; cortos: [number, number, number][]; todo: boolean }
// Devuelve null si ese día no trabaja nadie (se entiende que el restaurante cierra).
export function coberturaDia(d: Datos, fecha: Date): Cobertura[] | null {
  const dia = (fecha.getDay() + 6) % 7;
  const ayer = sumarDias(fecha, -1);
  const ids = new Set([...d.equipo.map((p) => p.id), ...Object.keys(incidenciasDelDia(d, fecha)), ...Object.keys(incidenciasDelDia(d, ayer))]);
  const intervalos: Tramo[] = [];
  ids.forEach((id) => {
    tramosReales(d, fecha, id).forEach((t) => intervalos.push(t));
    // Lo que alguien trabaja después de medianoche del día anterior también cuenta (madrugada).
    tramosReales(d, ayer, id).forEach(([a, b]) => { if (b > 1440) intervalos.push([a - 1440, b - 1440]); });
  });
  if (!intervalos.some(([a, b]) => b > 0 && a < 1440)) return null;
  return franjas(d).filter((f) => f.minimo > 0 && f.dias.includes(dia) && tramo(f.desde, f.hasta)).map((f) => {
    const [fa, fb] = tramo(f.desde, f.hasta)!;
    const puntos = new Set([fa, fb]);
    intervalos.forEach(([a, b]) => { if (a > fa && a < fb) puntos.add(a); if (b > fa && b < fb) puntos.add(b); });
    const orden = [...puntos].sort((x, y) => x - y);
    let min = Infinity;
    const cortos: [number, number, number][] = [];
    for (let i = 0; i < orden.length - 1; i++) {
      const ini = orden[i], fin = orden[i + 1], medio = (ini + fin) / 2;
      const n = intervalos.filter(([a, b]) => a <= medio && b > medio).length;
      min = Math.min(min, n);
      if (n >= f.minimo) continue;
      const ult = cortos[cortos.length - 1];
      if (ult && ult[1] === ini && ult[2] === n) ult[1] = fin; else cortos.push([ini, fin, n]);
    }
    return { f, min: min === Infinity ? 0 : min, cortos, todo: cortos.length === 1 && cortos[0][0] === fa && cortos[0][1] === fb };
  });
}
export function detalleCorto(r: Cobertura): string {
  const persona = (n: number) => n + (n === 1 ? ' persona' : ' personas');
  return r.todo ? 'todo el servicio con ' + persona(r.cortos[0][2])
    : r.cortos.map(([a, b, n]) => 'de ' + horaTxt(a) + ' a ' + horaTxt(b) + ', ' + persona(n)).join(' · ');
}
export function avisosCobertura(d: Datos, lunesSem: Date): Aviso[] {
  const avisos: Aviso[] = [];
  for (let i = 0; i < 7; i++) {
    (coberturaDia(d, sumarDias(lunesSem, i)) || []).forEach((r) => {
      if (!r.cortos.length) return;
      const que = r.f.nombre + ': falta gente, ' + detalleCorto(r) + ' (mínimo ' + r.f.minimo + ')';
      avisos.push({ dia: i, que, icono: r.f.icono, texto: DIAS[i][0].toUpperCase() + DIAS[i].slice(1) + ' · ' + que + '.' });
    });
  }
  return avisos;
}
// Lo que Cuadro enseña en «cosas que revisar»: la falta de gente repetida en varios días cuenta una vez.
export function cosasQueRevisar(d: Datos, lunesSem: Date): number {
  return avisosSemana(d, lunesSem).length + new Set(avisosCobertura(d, lunesSem).map((a) => a.que)).size;
}

// --- Informe del mes para la nómina ---
export interface DiaInforme { fecha: Date; idx: number; t: Turnos; min: number; inc: Incidencia | null; planMin: number; id: string }
interface Acumulado { dias: DiaInforme[]; min: number; noche: number; domingo: number; trabajados: number; faltas: number; coberturas: number }
export function informeMes(d: Datos, anio: number, mes: number) {
  const porPersona = new Map<string, Acumulado>();
  const sinHorario: number[] = [];
  const incidencias: { fecha: Date; idx: number; id: string; inc: Incidencia; planMin: number; min: number }[] = [];
  const nueva = (): Acumulado => ({ dias: [], min: 0, noche: 0, domingo: 0, trabajados: 0, faltas: 0, coberturas: 0 });
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  for (let n = 1; n <= ultimo; n++) {
    const fecha = new Date(anio, mes, n);
    const idx = (fecha.getDay() + 6) % 7;
    const sem: Semana = d.semanas[claveSemana(lunesDe(fecha))] || {};
    const delDia = incidenciasDelDia(d, fecha);
    let alguien = false;
    new Set([...Object.keys(sem), ...Object.keys(delDia)]).forEach((id) => {
      const t = sem[id] ? sem[id][idx] : VACIO;
      const inc = delDia[id] || null;
      const planMin = minutosDe(tramosDe(t));
      if (!planMin && !inc) return;
      alguien = true;
      if (!porPersona.has(id)) porPersona.set(id, nueva());
      const r = porPersona.get(id)!;
      const tramos = tramosReales(d, fecha, id);
      const min = minutosDe(tramos);
      // Horario nocturno según el Estatuto de los Trabajadores: de 22:00 a 6:00.
      r.noche += tramos.reduce((s, [a, b]) => s + solape(a, b, 0, 360) + solape(a, b, 1320, 1800), 0);
      if (idx === 6) r.domingo += min;
      r.min += min;
      if (min) r.trabajados++;
      if (inc && inc.tipo === 'falta') r.faltas++;
      if (inc && inc.tipo === 'cubre') r.coberturas++;
      r.dias.push({ fecha, idx, t, min, inc, planMin, id });
      if (inc) incidencias.push({ fecha, idx, id, inc, planMin, min });
    });
    if (!alguien) sinHorario.push(n);
  }
  const ids = d.equipo.map((p) => p.id).concat([...porPersona.keys()].filter((id) => !d.equipo.some((p) => p.id === id)));
  const filas = ids.map((id) => ({ id, nombre: nombreDe(d, id), ...(porPersona.get(id) || nueva()) }));
  return { filas, sinHorario, ultimo, incidencias };
}
// Lo que se hizo ese día, con la incidencia si la hubo.
export function textoDiaInforme(d: Datos, dia: DiaInforme): string {
  const plan = textoTurnos4(dia.t);
  if (!dia.inc) return plan;
  if (dia.inc.tipo === 'falta') return 'Faltó (' + dia.inc.motivo.toLowerCase() + ')' + (plan ? ' · tenía ' + plan : '');
  if (dia.inc.tipo === 'cambio') return (textoTurnos4(dia.inc.turnos) || 'no trabajó') + (plan ? ' · tenía ' + plan : '');
  return (plan ? plan + ' + ' : '') + 'cubre a ' + nombreDe(d, dia.inc.a) + ' ' + textoTurnos4(dia.inc.turnos);
}
// [2,3,4,9] → «2–4 y 9»
export function tramosDias(lista: number[]): string {
  const grupos: [number, number][] = [];
  lista.forEach((n) => {
    const ult = grupos[grupos.length - 1];
    if (ult && n === ult[1] + 1) ult[1] = n; else grupos.push([n, n]);
  });
  const txt = grupos.map(([a, b]) => (a === b ? String(a) : a + '–' + b));
  return txt.length > 1 ? txt.slice(0, -1).join(', ') + ' y ' + txt[txt.length - 1] : txt[0];
}
