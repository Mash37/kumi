// Stock de cocina: recuento semanal + compras. Consumo = lo que había + lo que entró − lo que queda.
import type { Datos, Producto, Recuento, Stock } from '../datos/tipos';
import { DIAS_ABREV, claveSemana } from './fechas';

export const UNIDADES = ['kg', 'g', 'L', 'ud', 'paquete', 'caja', 'bote', 'bandeja', 'manojo', 'barril'];
export const CATEGORIAS = ['Carnes', 'Pescado y marisco', 'Arroz y secos', 'Verdura y fruta', 'Lácteos y huevos', 'Panadería y repostería', 'Salsas y condimentos', 'Bebidas', 'Envases y limpieza', 'Otros'];
export const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const cifra = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

const VACIO: Stock = { productos: [], compras: [], recuentos: [] };
export function stockDe(d: Datos): Stock { return d.stock ?? VACIO; }
// Siempre por orden alfabético, como una hoja de inventario en papel: un producto nuevo cae en su sitio (mejora pedida por Mara).
export function productosActivos(d: Datos): Producto[] {
  return stockDe(d).productos.filter((p) => !p.archivado).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}
export function producto(d: Datos, id: string): Producto | undefined { return stockDe(d).productos.find((p) => p.id === id); }

// Admite «1,5», «1.5», sumas como «14+3» (lo que se cuenta en dos sitios) y vacío;
// devuelve null si está vacío y NaN si no es un número válido.
export function leerNumero(texto: string): number | null {
  const v = String(texto).trim().replace(/\s/g, '').replace(/,/g, '.');
  if (!v) return null;
  // Cada parte tiene que ser un número de cero en adelante: «2+-1» no es una cantidad contada.
  const n = v.split('+').reduce((s, x) => s + (x === '' || Number(x) < 0 ? NaN : Number(x)), 0);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}
export function fechaCorta(ts: number): string { const f = new Date(ts); return DIAS_ABREV[(f.getDay() + 6) % 7] + ' ' + f.getDate() + '/' + (f.getMonth() + 1); }
export function cantidadTxt(n: number, p: Pick<Producto, 'unidad'>): string { return cifra.format(n) + ' ' + p.unidad; }

export interface Estado { cantidad: number | null; ult: Recuento | null; compras: number }
// Lo que queda: el último recuento más lo comprado después (no se apunta el gasto diario, así que es «como mucho»).
export function estadoProducto(d: Datos, p: Producto): Estado {
  const st = stockDe(d);
  const ult = st.recuentos.filter((r) => r.p === p.id).sort((a, b) => b.ts - a.ts)[0];
  const despues = st.compras.filter((c) => c.p === p.id && (!ult || c.ts > ult.ts));
  if (!ult && !despues.length) return { cantidad: null, ult: null, compras: 0 };
  return { cantidad: (ult ? ult.cant : 0) + despues.reduce((s, c) => s + c.cant, 0), ult: ult ?? null, compras: despues.length };
}
export function hayQuePedir(p: Producto, e: Estado): boolean { return p.minimo != null && e.cantidad != null && e.cantidad < p.minimo; }
export function listaPedir(d: Datos) {
  return productosActivos(d).map((p) => ({ p, e: estadoProducto(d, p) })).filter((x) => hayQuePedir(x.p, x.e));
}
export function comprasDelMes(d: Datos, anio: number, mes: number) {
  return stockDe(d).compras.filter((c) => { const f = new Date(c.ts); return f.getFullYear() === anio && f.getMonth() === mes; });
}
export function informeStock(d: Datos, anio: number, mes: number) {
  const st = stockDe(d);
  const enMes = (ts: number) => { const f = new Date(ts); return f.getFullYear() === anio && f.getMonth() === mes; };
  return st.productos.map((p) => {
    const compras = st.compras.filter((c) => c.p === p.id && enMes(c.ts));
    const recs = st.recuentos.filter((r) => r.p === p.id).sort((a, b) => a.ts - b.ts);
    let consumo = 0, conConsumo = false;
    for (let i = 1; i < recs.length; i++) {
      if (!enMes(recs[i].ts)) continue;
      const entradas = st.compras.filter((c) => c.p === p.id && c.ts > recs[i - 1].ts && c.ts <= recs[i].ts).reduce((s, c) => s + c.cant, 0);
      consumo += recs[i - 1].cant + entradas - recs[i].cant;
      conConsumo = true;
    }
    const comprado = compras.reduce((s, c) => s + c.cant, 0);
    const gastado = compras.reduce((s, c) => s + c.coste, 0);
    return { p, comprado, gastado, consumo, conConsumo, costeConsumo: conConsumo && p.precio ? consumo * p.precio : null };
  }).filter((f) => f.comprado || f.conConsumo);
}

// --- Hoja de inventario: una fila por producto y una columna por día de recuento, el último a la derecha ---
export interface Columna { k: string; ts: number; mes: boolean; valores: Record<string, number> }
export function columnasHoja(d: Datos): Columna[] {
  const dias = new Map<string, Columna>();
  stockDe(d).recuentos.slice().sort((a, b) => a.ts - b.ts).forEach((r) => {
    const k = claveSemana(new Date(r.ts));
    if (!dias.has(k)) dias.set(k, { k, ts: r.ts, mes: false, valores: {} });
    const col = dias.get(k)!;
    col.valores[r.p] = r.cant;
    if (r.tipo === 'mes') col.mes = true;
  });
  return [...dias.values()];
}
export function productosEnOrden(d: Datos): Producto[] {
  const activos = productosActivos(d);
  return CATEGORIAS.flatMap((cat) => activos.filter((p) => p.categoria === cat));
}
export function recuentosDelDia(d: Datos, k: string): Recuento[] { return stockDe(d).recuentos.filter((r) => claveSemana(new Date(r.ts)) === k); }

// Unidades que se piden enteras: no se piden 2,5 cajas.
const ENTERAS = ['ud', 'paquete', 'caja', 'bote', 'bandeja', 'manojo', 'barril', 'docena', 'rollo'];
// Cuánto pedir: lo que falta para llegar al doble del mínimo, para no quedarse corto antes del siguiente pedido.
export function cantidadSugerida(p: Pick<Producto, 'minimo' | 'unidad'>, quedan: number): number {
  if (p.minimo == null) return 0;
  const falta = Math.max(0, p.minimo * 2 - quedan);
  return ENTERAS.includes(p.unidad) ? Math.ceil(falta) : Math.ceil(falta * 2) / 2;
}
