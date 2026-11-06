import type { Datos } from '../datos/tipos';

// Tarjetas de Inicio: cada jefe elige cuáles ver y en qué orden (Ajustes → Pantalla de inicio).
export type TarjetaInicio = 'servicio' | 'semana' | 'tablon' | 'horas' | 'stock' | 'dato';
export const TARJETAS_INICIO: Record<TarjetaInicio, string> = {
  servicio: 'El servicio de hoy', semana: 'Semana que viene', tablon: 'Tablón de avisos', horas: 'Horas de cada uno', stock: 'Stock', dato: 'Palabra / dato del día',
};
const POR_DEFECTO = Object.keys(TARJETAS_INICIO) as TarjetaInicio[];

/** El orden guardado, con las tarjetas que falten (nuevas o de una copia vieja) al final. */
export function ordenInicio(d: Pick<Datos, 'inicioOrden'>): TarjetaInicio[] {
  const guardado = (d.inicioOrden || []).filter((k): k is TarjetaInicio => k in TARJETAS_INICIO);
  return [...new Set([...guardado, ...POR_DEFECTO])];
}
export function tarjetaVisible(d: Pick<Datos, 'inicio'>, k: TarjetaInicio): boolean { return d.inicio?.[k] !== false; }
/** Sube (-1) o baja (+1) una tarjeta; en los extremos no cambia nada. */
export function moverTarjeta(orden: TarjetaInicio[], k: TarjetaInicio, paso: -1 | 1): TarjetaInicio[] {
  const i = orden.indexOf(k), j = i + paso;
  if (i < 0 || j < 0 || j >= orden.length) return orden;
  const nuevo = [...orden];
  [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
  return nuevo;
}
