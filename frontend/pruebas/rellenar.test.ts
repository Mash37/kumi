import { describe, expect, it } from 'vitest';
import type { Franja, Turnos } from '../src/datos/tipos';
import { alternarServicio, horaCorta, huecoDeServicio, turnoCorto } from '../src/dominio/rellenar';

const mediodia: Franja = { id: 'm', nombre: 'Mediodía', icono: '', desde: '12:00', hasta: '16:00', minimo: 2, dias: [0] };
const noche: Franja = { id: 'n', nombre: 'Noche', icono: '', desde: '20:00', hasta: '0:00', minimo: 2, dias: [0] };
const tarde: Franja = { id: 't', nombre: 'Tarde', icono: '', desde: '17:00', hasta: '19:00', minimo: 1, dias: [0] };

describe('servicios como atajo en Rellenar', () => {
  it('pone el servicio en el primer turno libre', () => {
    expect(alternarServicio(['', '', '', ''], mediodia)).toEqual(['12:00', '16:00', '', '']);
    expect(alternarServicio(['12:00', '16:00', '', ''], noche)).toEqual(['12:00', '16:00', '20:00', '0:00']);
  });
  it('lo quita si ya estaba y sube el turno que queda', () => {
    expect(alternarServicio(['12:00', '16:00', '20:00', '0:00'], mediodia)).toEqual(['20:00', '0:00', '', '']);
    expect(alternarServicio(['12:00', '16:00', '20:00', '0:00'], noche)).toEqual(['12:00', '16:00', '', '']);
  });
  it('reconoce el servicio aunque la hora esté escrita con cero delante', () => {
    expect(huecoDeServicio(['20:00', '00:00', '', ''], noche)).toBe(0);
  });
  it('deja el turno de antes como turno 1', () => {
    expect(alternarServicio(['20:00', '0:00', '', ''], mediodia)).toEqual(['12:00', '16:00', '20:00', '0:00']);
  });
  it('no pisa nada si ya hay dos turnos', () => {
    const t: Turnos = ['12:00', '16:00', '20:00', '0:00'];
    expect(alternarServicio(t, tarde)).toBe('lleno');
    expect(t).toEqual(['12:00', '16:00', '20:00', '0:00']);
  });
  it('acorta las horas en punto', () => {
    expect(horaCorta('12:00')).toBe('12');
    expect(horaCorta('12:30')).toBe('12:30');
    expect(turnoCorto('20:00', '0:00')).toBe('20–0');
    expect(turnoCorto('', '')).toBe('');
  });
});
