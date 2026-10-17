import { describe, expect, it } from 'vitest';
import { semanaANube, semanaDesdeNube } from '../src/nube/conversion';
import { claveSemana } from '../src/dominio/fechas';
import { cargarLegado } from './legado';
import { restauranteAlAzar } from './azar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v2 = cargarLegado<Record<string, (...a: any[]) => any>>(
  ['fechaDeClave', 'sumarDias', 'claveSemana', 'lunesDe', 'turnosPlan', 'libresDelDia', 'esLibre', 'quitarLibre', 'semanaANube', 'semanaDesdeNube'],
  ['VACIO'],
);

describe('publicar y recibir una semana: igual que en la versión 2', () => {
  const lunes = new Date(2026, 9, 19), clave = claveSemana(lunes);
  it('lo que se sube al publicar', () => {
    for (let s = 1; s <= 200; s++) {
      const d = restauranteAlAzar(s, lunes);
      v2.ponerDatos(structuredClone(d));
      expect(semanaANube(d, clave)).toEqual(v2.semanaANube(clave));
    }
  });
  it('lo que queda en el móvil del equipo al recibirla', () => {
    for (let s = 1; s <= 200; s++) {
      const d = restauranteAlAzar(s, lunes), recibe = restauranteAlAzar(s + 1000, lunes);
      const subida = { ...semanaANube(d, clave), clave };
      const a = structuredClone(recibe), b = structuredClone(recibe);
      semanaDesdeNube(a, subida);
      v2.ponerDatos(b); v2.semanaDesdeNube(subida);
      expect(a).toEqual(b);
    }
  });
});
