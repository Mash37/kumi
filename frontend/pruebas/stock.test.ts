import { describe, expect, it } from 'vitest';
import * as v3 from '../src/dominio/stock';
import { iniciales } from '../src/dominio/personas';
import type { Datos } from '../src/datos/tipos';
import { cargarLegado } from './legado';
import { generador } from './azar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v2 = cargarLegado<Record<string, (...a: any[]) => any>>(
  ['stock', 'productosActivos', 'producto', 'leerNumero', 'fechaCorta', 'cantidadTxt', 'estadoProducto', 'hayQuePedir', 'listaPedir', 'comprasDelMes', 'informeStock', 'iniciales'],
  ['DIAS_ABREV', 'cifra'],
);
// «Sin definir» y «vacío» (undefined y null) significan lo mismo para quien usa el resultado.
const normal = (x: unknown) => JSON.parse(JSON.stringify(x, (_k, v) => (v === undefined ? null : v)));
const igual = (a: unknown, b: unknown) => expect(normal(a)).toEqual(normal(b));

function stockAlAzar(semilla: number): Datos {
  const { azar, entre, uno } = generador(semilla);
  const base = new Date(2026, 8, 1).getTime(), dia = 86400000;
  const NOMBRES = ['Salmón', 'atún', 'Arroz', 'wasabi', 'Ñora', 'Ébano', 'Zanahoria', 'aguacate', 'Nori'];
  const productos = Array.from({ length: entre(1, 8) }, (_, i) => ({ id: 's' + i, nombre: uno(NOMBRES) + (i % 3 ? '' : ' ' + i), unidad: uno(v3.UNIDADES), categoria: uno(v3.CATEGORIAS),
    minimo: azar() < 0.7 ? entre(0, 60) : null, precio: azar() < 0.6 ? entre(1, 40) / 2 : null, ...(azar() < 0.15 ? { archivado: true } : {}) }));
  const compras = Array.from({ length: entre(0, 25) }, (_, i) => ({ id: 'c' + i, p: uno(productos).id, cant: entre(1, 20) / 2, coste: entre(1, 300), ts: base + entre(0, 70) * dia + entre(0, 80000000) }));
  const recuentos = Array.from({ length: entre(0, 25) }, (_, i) => ({ id: 'r' + i, p: uno(productos).id, cant: entre(0, 30) / 2, ts: base + entre(0, 70) * dia + entre(0, 80000000) }));
  return { equipo: [{ id: 'a', nombre: 'ANA' }, { id: 'b', nombre: 'ANDRÉS' }, { id: 'c', nombre: 'LUIS' }], semanas: {}, stock: { productos, compras, recuentos } };
}

describe('stock: igual que en la versión 2 en 300 cocinas al azar', () => {
  it('lo que queda, qué pedir, compras del mes e informe', () => {
    for (let s = 1; s <= 300; s++) {
      const d = stockAlAzar(s);
      v2.ponerDatos(structuredClone(d));
      for (const p of d.stock!.productos) igual(v3.estadoProducto(d, p), v2.estadoProducto(p));
      // Cambio a propósito (pedido por Mara): mismos productos que la v2, pero por orden alfabético.
      const alfabetico = (xs: { p: { nombre: string } }[]) => [...xs].sort((x, y) => x.p.nombre.localeCompare(y.p.nombre, 'es', { sensitivity: 'base' }));
      igual(v3.listaPedir(d), alfabetico(v2.listaPedir()));
      for (const mes of [8, 9, 10]) {
        igual(v3.comprasDelMes(d, 2026, mes), v2.comprasDelMes(2026, mes));
        igual(v3.informeStock(d, 2026, mes), v2.informeStock(2026, mes));
      }
    }
  });
  it('el generador produce listas de pedido con varios productos (si no, el orden no se pondría a prueba)', () => {
    let varios = 0;
    for (let s = 1; s <= 300; s++) if (v3.listaPedir(stockAlAzar(s)).length >= 2) varios++;
    expect(varios).toBeGreaterThan(50);
    expect(new Set(Array.from({ length: 300 }, (_, i) => stockAlAzar(i + 1).stock!.productos.length)).size).toBeGreaterThanOrEqual(6);
  });
  it('sumas al contar («14+3»): mejora pedida por Mara', () => {
    expect(v3.leerNumero('14+3')).toBe(17);
    expect(v3.leerNumero('1,5 + 2,5')).toBe(4);
    expect(v3.leerNumero('3+')).toBeNaN();
    expect(v3.leerNumero('+3')).toBeNaN();
    expect(v3.leerNumero('2+-1')).toBeNaN();
  });
  it('leer números, fechas cortas y cantidades', () => {
    for (const t of ['', '  ', '1,5', '1.5', '3', '-2', 'abc', '0', ' 2 ,5', '1e3', '7,']) {
      const a = v3.leerNumero(t), b = v2.leerNumero(t);
      if (Number.isNaN(b)) expect(a).toBeNaN(); else expect(a).toBe(b);
    }
    for (let i = 0; i < 40; i++) {
      const ts = new Date(2026, 0, 1).getTime() + i * 9 * 86400000;
      expect(v3.fechaCorta(ts)).toBe(v2.fechaCorta(ts));
      expect(v3.cantidadTxt(i * 1.25, { unidad: 'kg' })).toBe(v2.cantidadTxt(i * 1.25, { unidad: 'kg' }));
    }
  });
  it('iniciales, también con nombres que empiezan igual', () => {
    const d = stockAlAzar(1);
    v2.ponerDatos(d);
    for (const n of ['ANA', 'ANDRÉS', 'LUIS', ' sofía ', '', 'X']) expect(iniciales(d, n)).toBe(v2.iniciales(n));
  });
});

describe('pedido al proveedor', () => {
  it('pide lo que falta hasta el doble del mínimo, en enteros si la unidad no se parte', () => {
    expect(v3.cantidadSugerida({ minimo: 10, unidad: 'kg' }, 3)).toBe(17);
    expect(v3.cantidadSugerida({ minimo: 5, unidad: 'kg' }, 2.3)).toBe(8);
    expect(v3.cantidadSugerida({ minimo: 3, unidad: 'caja' }, 0.5)).toBe(6);
    expect(v3.cantidadSugerida({ minimo: 4, unidad: 'L' }, 9)).toBe(0);
    expect(v3.cantidadSugerida({ minimo: null, unidad: 'kg' }, 1)).toBe(0);
  });
  it('la hoja de pedido lista solo lo que está por debajo del mínimo, con su importe', async () => {
    const { htmlPedido } = await import('../src/dominio/informes');
    const d: Datos = { equipo: [], semanas: {}, restaurante: { nombre: 'Casa <Kumi>' }, stock: {
      productos: [
        { id: 'a', nombre: 'Arroz', unidad: 'kg', categoria: 'Arroz y secos', minimo: 10, precio: 1.5 },
        { id: 't', nombre: 'Tomate', unidad: 'kg', categoria: 'Verdura y fruta', minimo: 5, precio: null },
        { id: 's', nombre: 'Sal', unidad: 'kg', categoria: 'Salsas y condimentos', minimo: 1, precio: 0.6 },
      ],
      compras: [],
      recuentos: [{ id: 'r1', p: 'a', cant: 4, ts: 1 }, { id: 'r2', p: 't', cant: 1, ts: 1 }, { id: 'r3', p: 's', cant: 3, ts: 1 }],
    } };
    const html = htmlPedido(d, new Date(2026, 9, 17), 'Cualquier cocina')!;
    expect(html).toContain('Pedido · 17 de octubre de 2026');
    expect(html).toContain('Casa &lt;Kumi&gt;');
    expect(html).toContain('Arroz');
    expect(html).toContain('Tomate');
    expect(html).not.toContain('Sal<');
    expect(html).toContain('<b>16 kg</b>');
    expect(html).toContain(v3.euros.format(24));
    expect(htmlPedido({ equipo: [], semanas: {} }, new Date(), 'x')).toBeNull();
  });
});
