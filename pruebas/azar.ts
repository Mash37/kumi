import type { Datos, Incidencia, Turnos } from '../src/datos/tipos';
import { claveSemana, sumarDias } from '../src/dominio/fechas';

// Generador repetible: la misma semilla da siempre el mismo restaurante, para poder reproducir un fallo.
export function generador(semilla: number) {
  // Las semillas pequeñas (1, 2, 3…) dan primeros números casi nulos: se mezclan y se descartan los primeros.
  let x = (Math.imul(semilla, 0x9e3779b1) ^ 0x85ebca6b) >>> 0 || 1;
  const azar = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  for (let i = 0; i < 20; i++) azar();
  const entre = (a: number, b: number) => a + Math.floor(azar() * (b - a + 1));
  const uno = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)];
  return { azar, entre, uno };
}

const HORAS = ['', '08:00', '10:30', '11:30', '12:00', '13:00', '16:00', '17:00', '19:30', '20:00', '23:30', '00:00', '00:30', '02:00'];

export function restauranteAlAzar(semilla: number, lunes: Date): Datos {
  const { azar, entre, uno } = generador(semilla);
  const turno = (): Turnos => {
    if (azar() < 0.25) return ['', '', '', ''];
    const t: Turnos = [uno(HORAS), uno(HORAS), '', ''];
    if (azar() < 0.4) { t[2] = uno(HORAS); t[3] = uno(HORAS); }
    return t;
  };
  const equipo = Array.from({ length: entre(1, 6) }, (_, i) => ({ id: 'p' + i, nombre: ['ANA', 'LUIS', 'MARTA', 'PEDRO', 'SOFÍA', 'ÑITO'][i], contrato: azar() < 0.4 ? entre(20, 45) : null }));
  const ids = [...equipo.map((p) => p.id), 'baja1'];
  const d: Datos = { equipo, semanas: {}, bajas: { baja1: 'Rosa' } };
  for (let s = -1; s <= 1; s++) {
    if (s !== 0 && azar() < 0.3) continue;
    const k = claveSemana(sumarDias(lunes, s * 7));
    d.semanas[k] = {};
    ids.forEach((id) => { if (azar() < 0.85) d.semanas[k][id] = Array.from({ length: 7 }, turno); });
  }
  d.libres = {}; d.incidencias = {};
  for (let i = -7; i < 14; i++) {
    const k = claveSemana(sumarDias(lunes, i));
    if (azar() < 0.2) d.libres[k] = { [uno(ids)]: ['', '', '', ''] };
    if (azar() < 0.35) {
      const a = uno(ids), b = uno(ids);
      const incs: Incidencia[] = [
        { tipo: 'falta', motivo: uno(['Enfermedad o baja', 'Vacaciones', 'Otro']) },
        { tipo: 'cambio', turnos: turno() },
        { tipo: 'cubre', a: b, turnos: turno() },
      ];
      d.incidencias[k] = { [a]: uno(incs) };
      if (azar() < 0.5 && a !== b) d.incidencias[k][b] = { tipo: 'cubre', a, turnos: turno() };
    }
  }
  if (azar() < 0.5) d.reglas = { entreDias: entre(8, 14), maxDia: entre(6, 12) };
  if (azar() < 0.5) d.franjas = [
    { id: 'm', nombre: 'Mañana', icono: '☀️', desde: uno(['11:00', '12:00']), hasta: uno(['15:00', '16:30']), minimo: entre(0, 3), dias: [0, 1, 2, 3, 4] },
    { id: 'n', nombre: 'Noche', icono: '🌙', desde: '20:00', hasta: uno(['0:00', '23:30', '1:00']), minimo: entre(1, 3), dias: [4, 5, 6] },
  ];
  return d;
}
