import { describe, expect, it } from 'vitest';
import { borrarRecuento, corregirRecuento, moverRecuento } from '../src/datos/acciones';
import { columnasHoja, productosEnOrden } from '../src/dominio/stock';
import type { Datos } from '../src/datos/tipos';

// Mejoras pedidas por Mara: la hoja de inventario y corregir un recuento ya guardado.
const dia = (d: number, h = 12) => new Date(2026, 8, d, h).getTime();
function cocina(): Datos {
  return { equipo: [], semanas: {}, stock: {
    productos: [
      { id: 'z', nombre: 'Zanahoria', unidad: 'kg', categoria: 'Verdura y fruta', minimo: null, precio: null },
      { id: 'a', nombre: 'aguacate', unidad: 'kg', categoria: 'Verdura y fruta', minimo: null, precio: null },
      { id: 's', nombre: 'Salmón', unidad: 'kg', categoria: 'Pescado y marisco', minimo: null, precio: null },
    ],
    compras: [],
    recuentos: [
      { id: '1', p: 'z', cant: 5, ts: dia(14, 9) }, { id: '2', p: 'a', cant: 2, ts: dia(14, 9) },
      { id: '3', p: 'z', cant: 4, ts: dia(30), tipo: 'mes' },
    ] } };
}

describe('hoja de inventario', () => {
  it('una columna por día, ordenadas, y productos por categoría y por nombre', () => {
    const d = cocina();
    expect(columnasHoja(d).map((c) => [c.k, c.mes, c.valores])).toEqual([['2026-09-14', false, { z: 5, a: 2 }], ['2026-09-30', true, { z: 4 }]]);
    expect(productosEnOrden(d).map((p) => p.nombre)).toEqual(['Salmón', 'aguacate', 'Zanahoria']);
  });
  it('cambiar la fecha de un recuento (el caso de Mara: guardado hoy, era del 30)', () => {
    const d = cocina();
    moverRecuento(d, '2026-09-14', '2026-09-29', 'mes', dia(14, 18));
    expect(columnasHoja(d).map((c) => [c.k, c.mes])).toEqual([['2026-09-29', true], ['2026-09-30', true]]);
  });
  it('si el día ya tenía recuento se juntan, y en lo repetido manda el que se mueve', () => {
    const d = cocina();
    moverRecuento(d, '2026-09-14', '2026-09-30', 'semana', dia(14, 18));
    const [col] = columnasHoja(d);
    expect(columnasHoja(d)).toHaveLength(1);
    expect(col.valores).toEqual({ z: 5, a: 2 });
    expect(col.mes).toBe(false);
  });
  it('corregir una cantidad mantiene el día y el tipo; vacía, la quita', () => {
    const d = cocina();
    corregirRecuento(d, '2026-09-30', 'z', 4.5);
    corregirRecuento(d, '2026-09-30', 'a', 1);
    expect(columnasHoja(d)[1]).toMatchObject({ mes: true, valores: { z: 4.5, a: 1 } });
    corregirRecuento(d, '2026-09-14', 'a', null);
    expect(columnasHoja(d)[0].valores).toEqual({ z: 5 });
  });
  it('borrar un recuento entero', () => {
    const d = cocina();
    borrarRecuento(d, '2026-09-14');
    expect(columnasHoja(d).map((c) => c.k)).toEqual(['2026-09-30']);
  });
});
