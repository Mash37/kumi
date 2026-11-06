import { describe, expect, it } from 'vitest';
import { moverTarjeta, ordenInicio, tarjetaVisible } from '../src/dominio/inicio';

describe('tarjetas de Inicio', () => {
  it('sin nada guardado, sale el orden de siempre', () => {
    expect(ordenInicio({})).toEqual(['servicio', 'semana', 'tablon', 'horas', 'stock', 'dato']);
  });
  it('respeta el orden guardado y añade al final las que falten', () => {
    expect(ordenInicio({ inicioOrden: ['stock', 'servicio'] })).toEqual(['stock', 'servicio', 'semana', 'tablon', 'horas', 'dato']);
  });
  it('ignora nombres que ya no existen', () => {
    expect(ordenInicio({ inicioOrden: ['vieja' as never, 'dato'] })[0]).toBe('dato');
  });
  it('sube y baja, y no se sale de los extremos', () => {
    const o = ordenInicio({});
    expect(moverTarjeta(o, 'semana', -1).slice(0, 2)).toEqual(['semana', 'servicio']);
    expect(moverTarjeta(o, 'servicio', -1)).toBe(o);
    expect(moverTarjeta(o, 'dato', 1)).toBe(o);
  });
  it('solo se oculta lo que se apagó a propósito', () => {
    expect(tarjetaVisible({}, 'stock')).toBe(true);
    expect(tarjetaVisible({ inicio: { stock: false } }, 'stock')).toBe(false);
  });
});
