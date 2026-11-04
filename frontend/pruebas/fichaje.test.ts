import { describe, expect, it } from 'vitest';
import { claveMes, dentroDesde, diaTramo, minutosTramo, mesAnterior, sinCerrar, tramosFichados, vigentes, type Fichaje } from '../src/dominio/fichaje';

const h = (dia: number, hora: number, min = 0) => new Date(2026, 10, dia, hora, min).getTime();
let n = 0;
const f = (personaId: string, tipo: Fichaje['tipo'], cuando: number, extra: Partial<Fichaje> = {}): Fichaje =>
  ({ id: 'f' + ++n, uid: 'u-' + personaId, personaId, tipo, cuando, mes: '2026-11', ...extra });

describe('fichaje: lo que cuenta', () => {
  it('empareja entrada y salida y cuenta los minutos', () => {
    const t = tramosFichados([f('ana', 'entrada', h(3, 12, 2)), f('ana', 'salida', h(3, 16, 10))]);
    expect(t).toHaveLength(1);
    expect(minutosTramo(t[0])).toBe(248);
    expect(diaTramo(t[0])).toBe('2026-11-03');
  });

  it('un turno que pasa de medianoche cuenta en el día en que empieza', () => {
    const t = tramosFichados([f('ana', 'entrada', h(3, 20)), f('ana', 'salida', h(4, 0, 30))]);
    expect(diaTramo(t[0])).toBe('2026-11-03');
    expect(minutosTramo(t[0])).toBe(270);
  });

  it('dos entradas seguidas dejan la primera sin salida, sin inventarse horas', () => {
    const t = tramosFichados([f('ana', 'entrada', h(2, 12)), f('ana', 'entrada', h(3, 12)), f('ana', 'salida', h(3, 16))]);
    expect(t.map((x) => [!!x.e, !!x.s, minutosTramo(x)])).toEqual([[true, false, 0], [true, true, 240]]);
    expect(sinCerrar(t[0], h(4, 12))).toBe(true);
  });

  it('una salida sin entrada queda sola y pide corrección', () => {
    const t = tramosFichados([f('ana', 'salida', h(3, 16))]);
    expect(t[0].e).toBeNull();
    expect(sinCerrar(t[0], h(3, 17))).toBe(true);
  });

  it('cada persona tiene sus tramos', () => {
    const t = tramosFichados([f('ana', 'entrada', h(3, 12)), f('luis', 'entrada', h(3, 12, 5)), f('ana', 'salida', h(3, 16)), f('luis', 'salida', h(3, 15))]);
    expect(t.map((x) => [x.personaId, minutosTramo(x)])).toEqual([['ana', 240], ['luis', 175]]);
  });
});

describe('fichaje: correcciones sin borrar nada', () => {
  it('cambiar la hora sustituye el registro y conserva el original en la lista', () => {
    const original = f('ana', 'salida', h(3, 23, 50));
    const lista = [f('ana', 'entrada', h(3, 12)), original, f('ana', 'salida', h(3, 23, 51), { uid: 'jefa', hora: h(3, 16), corrige: original.id, motivo: 'Se olvidó de fichar' })];
    const t = tramosFichados(lista);
    expect(minutosTramo(t[0])).toBe(240);
    expect(t[0].s!.corregida).toBe(true);
    expect(lista).toContain(original);
  });

  it('anular quita el registro de la cuenta', () => {
    const doble = f('ana', 'entrada', h(3, 12, 1));
    const lista = [f('ana', 'entrada', h(3, 12)), doble, f('ana', 'salida', h(3, 16)), f('ana', 'anula', h(3, 17), { uid: 'jefa', hora: doble.cuando, corrige: doble.id, motivo: 'Fichó dos veces' })];
    expect(vigentes(lista)).toHaveLength(2);
    expect(minutosTramo(tramosFichados(lista)[0])).toBe(240);
  });

  it('una corrección de una corrección cuenta la última', () => {
    const a = f('ana', 'entrada', h(3, 12));
    const b = f('ana', 'entrada', h(3, 13), { hora: h(3, 11), corrige: a.id, motivo: 'x' });
    const c = f('ana', 'entrada', h(3, 14), { hora: h(3, 11, 30), corrige: b.id, motivo: 'y' });
    expect(vigentes([a, b, c]).map((m) => m.h)).toEqual([h(3, 11, 30)]);
  });

  it('un fichaje olvidado se añade sin sustituir a nadie', () => {
    const lista = [f('ana', 'entrada', h(3, 12)), f('ana', 'salida', h(4, 9), { hora: h(3, 16), corrige: null, motivo: 'Se olvidó' })];
    expect(minutosTramo(tramosFichados(lista)[0])).toBe(240);
  });
});

describe('fichaje: quién está dentro', () => {
  it('dentro desde la entrada, fuera tras la salida', () => {
    const e = f('ana', 'entrada', h(3, 12));
    expect(dentroDesde([e], 'ana', h(3, 14))!.h).toBe(h(3, 12));
    expect(dentroDesde([e, f('ana', 'salida', h(3, 16))], 'ana', h(3, 17))).toBeNull();
  });
  it('pasadas 16 horas sin salida, ya no cuenta como dentro', () => {
    expect(dentroDesde([f('ana', 'entrada', h(3, 12))], 'ana', h(4, 4, 1))).toBeNull();
  });
  it('los meses se nombran igual que en la nube', () => {
    expect(claveMes(new Date(2026, 0, 31))).toBe('2026-01');
    expect(mesAnterior(new Date(2026, 0, 31))).toBe('2025-12');
  });
});
