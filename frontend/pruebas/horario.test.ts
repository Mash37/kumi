import { describe, expect, it } from 'vitest';
import * as v3 from '../src/dominio/horario';
import { lunesDe, sumarDias } from '../src/dominio/fechas';
import { cargarLegado } from './legado';
import { restauranteAlAzar } from './azar';

const NOMBRES = ['lunesDe', 'sumarDias', 'claveSemana', 'aMinutos', 'tramo', 'reglas', 'nombreCorto', 'avisosSemana', 'franjas', 'horaTxt',
  'coberturaDia', 'detalleCorto', 'avisosCobertura', 'cosasQueRevisar', 'libresDelDia', 'esLibre', 'incidenciasDelDia', 'incidenciaDe',
  'turnosPlan', 'tramosDe', 'minutosDe', 'tramosReales', 'textoTurnos4', 'textoIncidencia', 'solape', 'horasExactas', 'nombreDe',
  'informeMes', 'textoDiaInforme', 'tramosDias', 'textoTurnoCorto'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v2 = cargarLegado<Record<string, (...a: any[]) => any>>(NOMBRES, ['DIAS', 'REGLAS_ESTATUTO', 'FRANJAS_INICIALES', 'VACIO']);
// JSON: compara el contenido, no la identidad de los objetos (las fechas pasan a texto).
const igual = (a: unknown, b: unknown) => expect(JSON.parse(JSON.stringify(a))).toEqual(JSON.parse(JSON.stringify(b)));

const SEMILLAS = Array.from({ length: 300 }, (_, i) => i + 1);
const LUNES = [new Date(2026, 9, 19), new Date(2026, 2, 23), new Date(2026, 11, 28)]; // normal, cambio de hora, cambio de año

describe('cálculos del horario: iguales que en la versión 2 en 300 restaurantes al azar', () => {
  it('descansos, gente por servicio y cosas que revisar', () => {
    for (const s of SEMILLAS) for (const lunes of LUNES) {
      const d = restauranteAlAzar(s, lunes);
      v2.ponerDatos(structuredClone(d));
      igual(v3.avisosSemana(d, lunes), v2.avisosSemana(lunes));
      igual(v3.avisosCobertura(d, lunes), v2.avisosCobertura(lunes));
      expect(v3.cosasQueRevisar(d, lunes)).toBe(v2.cosasQueRevisar(lunes));
      for (let i = -1; i < 8; i++) igual(v3.coberturaDia(d, sumarDias(lunes, i)), v2.coberturaDia(sumarDias(lunes, i)));
    }
  });
  it('libres, incidencias y sus textos', () => {
    for (const s of SEMILLAS) {
      const lunes = LUNES[s % 3];
      const d = restauranteAlAzar(s, lunes);
      v2.ponerDatos(structuredClone(d));
      for (let i = -7; i < 14; i++) {
        const f = sumarDias(lunes, i);
        for (const id of [...d.equipo.map((p) => p.id), 'baja1', 'nadie']) {
          expect(v3.esLibre(d, f, id)).toBe(v2.esLibre(f, id));
          igual(v3.tramosReales(d, f, id), v2.tramosReales(f, id));
          const inc = v3.incidenciaDe(d, f, id);
          if (inc) expect(v3.textoIncidencia(d, inc, f, id)).toBe(v2.textoIncidencia(inc, f, id));
        }
      }
    }
  });
  it('informe del mes para la nómina', () => {
    for (const s of SEMILLAS) {
      const lunes = LUNES[s % 3];
      const d = restauranteAlAzar(s, lunes);
      v2.ponerDatos(structuredClone(d));
      for (const f of [lunes, sumarDias(lunes, 10)]) {
        const a = v3.informeMes(d, f.getFullYear(), f.getMonth()), b = v2.informeMes(f.getFullYear(), f.getMonth());
        igual(a, b);
        a.filas.forEach((fila) => fila.dias.forEach((dia, i) => expect(v3.textoDiaInforme(d, dia)).toBe(v2.textoDiaInforme(b.filas.find((x: { id: string }) => x.id === fila.id).dias[i]))));
        if (a.sinHorario.length) expect(v3.tramosDias(a.sinHorario)).toBe(v2.tramosDias(b.sinHorario));
      }
    }
  });
  it('el generador produce casos variados (si no, las pruebas de arriba no demostrarían nada)', () => {
    let avisos = 0, cortos = 0, faltas = 0;
    for (const s of SEMILLAS) {
      const d = restauranteAlAzar(s, LUNES[0]);
      avisos += v3.avisosSemana(d, LUNES[0]).length;
      cortos += v3.avisosCobertura(d, LUNES[0]).length;
      faltas += v3.informeMes(d, 2026, 9).filas.reduce((n, f) => n + f.faltas, 0);
    }
    const tamanos = new Set(SEMILLAS.map((s) => restauranteAlAzar(s, LUNES[0]).equipo.length));
    expect(tamanos.size).toBeGreaterThanOrEqual(5);
    expect(avisos).toBeGreaterThan(100);
    expect(cortos).toBeGreaterThan(100);
    expect(faltas).toBeGreaterThan(20);
    expect(lunesDe(LUNES[1]).getDay()).toBe(1);
  });
});
