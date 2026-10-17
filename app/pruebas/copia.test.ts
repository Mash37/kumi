import { describe, expect, it } from 'vitest';
import { archivoCopia, leerCopia, textoUltimaCopia } from '../src/dominio/copia';
import { cargarLegado } from './legado';
import { restauranteAlAzar } from './azar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v2 = cargarLegado<Record<string, (...a: any[]) => any>>(['leerCopia']);

describe('copia de seguridad: compatible con la versión 2 en los dos sentidos', () => {
  it('una copia hecha con la v3 la lee la v2 y al revés', async () => {
    for (let s = 1; s <= 50; s++) {
      const d = restauranteAlAzar(s, new Date(2026, 9, 19));
      const texto = await archivoCopia(d, new Date(2026, 9, 14, 10)).text();
      const a = leerCopia(texto)!, b = v2.leerCopia(texto);
      expect(JSON.stringify(a.datos)).toBe(JSON.stringify(b.datos));
      expect(a.fecha!.getTime()).toBe(b.fecha.getTime());
      expect(a.datos.ultimaCopia).toBe(new Date(2026, 9, 14, 10).getTime());
    }
  });
  it('rechaza lo mismo que la v2 (archivos que no son copias)', () => {
    for (const t of ['', 'hola', '{}', '[]', 'null', '{"equipo":[],"semanas":{}}', '{"app":"kumi-kitchen","datos":{"equipo":"x"}}', '{"app":"otra","equipo":[],"semanas":{}}']) {
      expect(!!leerCopia(t)).toBe(!!v2.leerCopia(t));
    }
  });
  it('dice cuándo fue la última copia', () => {
    const ahora = new Date(2026, 9, 14, 12).getTime();
    expect(textoUltimaCopia({ equipo: [], semanas: {} }, ahora)).toBe('Todavía no has guardado ninguna copia.');
    expect(textoUltimaCopia({ equipo: [], semanas: {}, ultimaCopia: ahora - 3600000 }, ahora)).toBe('Última copia: 14 de octubre (hoy).');
    expect(textoUltimaCopia({ equipo: [], semanas: {}, ultimaCopia: ahora - 86400000 }, ahora)).toBe('Última copia: 13 de octubre (ayer).');
    expect(textoUltimaCopia({ equipo: [], semanas: {}, ultimaCopia: ahora - 5 * 86400000 }, ahora)).toBe('Última copia: 9 de octubre (hace 5 días).');
  });
});
