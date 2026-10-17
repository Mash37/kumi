import { describe, expect, it } from 'vitest';
import { claveSemana, lunesDe, rango, sumarDias } from '../src/dominio/fechas';
import { minutosTurnos, semanaTieneDatos, textoHoras, tramo } from '../src/dominio/horas';
import type { Turnos } from '../src/datos/tipos';
import { cargarLegado } from './legado';

type Funciones = Record<string, (...a: never[]) => unknown>;
const v2 = cargarLegado<Funciones>(
  ['lunesDe', 'sumarDias', 'claveSemana', 'rango', 'aMinutos', 'tramo', 'minutosTurnos', 'textoHoras', 'semanaTieneDatos'],
  ['MESES', 'MESES_CORTOS'],
);
const llamar = (f: string, ...a: unknown[]) => (v2[f] as (...x: unknown[]) => unknown)(...a);

// Un año entero, día a día, incluidos los cambios de hora y el paso de mes y de año.
const dias = Array.from({ length: 400 }, (_, i) => new Date(2026, 0, 1 + i));

describe('fechas: iguales que en la versión 2', () => {
  it('lunesDe y claveSemana', () => {
    for (const d of dias) {
      expect(claveSemana(lunesDe(d))).toBe(llamar('claveSemana', llamar('lunesDe', d)));
    }
  });
  it('rango corto y largo, también cuando la semana cruza de mes', () => {
    for (const d of dias) {
      const l = lunesDe(d);
      expect(rango(l, false)).toBe(llamar('rango', l, false));
      expect(rango(l, true)).toBe(llamar('rango', l, true));
    }
  });
  it('sumarDias atraviesa el cambio de hora sin perder el día', () => {
    expect(claveSemana(sumarDias(new Date(2026, 2, 28), 2))).toBe('2026-03-30');
    expect(claveSemana(sumarDias(new Date(2026, 9, 24), 2))).toBe('2026-10-26');
  });
});

describe('horas: iguales que en la versión 2', () => {
  const casos: Turnos[] = [
    ['12:00', '16:00', '19:30', '23:30'], ['19:30', '00:30', '', ''], ['08:00', '14:00', '', ''],
    ['', '', '', ''], ['12:00', '', '', ''], ['23:00', '23:00', '', ''], ['20:00', '02:15', '10:00', '10:45'],
  ];
  it('tramo y minutosTurnos', () => {
    for (const t of casos) {
      expect(tramo(t[0], t[1])).toEqual(llamar('tramo', t[0], t[1]));
      expect(minutosTurnos(t)).toBe(llamar('minutosTurnos', t));
    }
  });
  it('textoHoras', () => {
    for (const m of [0, 30, 60, 90, 255, 480, 510, 2550]) expect(textoHoras(m)).toBe(llamar('textoHoras', m));
  });
  it('semanaTieneDatos', () => {
    const vacia = { a: Array.from({ length: 7 }, () => ['', '', '', ''] as Turnos) };
    const llena = { a: [...vacia.a.slice(0, 6), ['12:00', '16:00', '', ''] as Turnos] };
    for (const s of [undefined, {}, vacia, llena]) expect(semanaTieneDatos(s)).toBe(llamar('semanaTieneDatos', s));
  });
});

describe('normalizar horas escritas a mano: igual que en la versión 2', () => {
  const v2h = cargarLegado<Record<string, (t: string) => unknown>>(['normalizarHora', 'aCasilla']);
  it('todos los formatos que admite y los que rechaza', async () => {
    const { normalizarHora, aCasilla } = await import('../src/dominio/horas');
    const casos = ['', ' ', '12', '9', '0', '24', '25', '930', '1234', '2400', '2360', '12:34', '12.34', '12,5', '12h', '12 30', '7h30', 'abc', '1:2:3', '12:', ':30', '09:05', '123456'];
    for (const c of casos) {
      expect(normalizarHora(c)).toBe(v2h.normalizarHora(c));
      const n = normalizarHora(c);
      if (n) expect(aCasilla(n)).toBe(v2h.aCasilla(n));
    }
  });
});
