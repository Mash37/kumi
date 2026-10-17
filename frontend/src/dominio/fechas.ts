// Fechas de la cocina: la semana va de lunes a domingo y se guarda con la fecha de su lunes («2026-10-19»).
export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const DIAS_ABREV = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;

export function lunesDe(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
export function sumarDias(fecha: Date, n: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}
// Sirve para cualquier día, no solo para lunes: es la fecha en formato año-mes-día.
export function claveSemana(fecha: Date): string {
  return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
}
export function fechaDeClave(clave: string): Date {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d);
}
export function rango(lunes: Date, largo: boolean): string {
  const domingo = sumarDias(lunes, 6);
  const m = largo ? MESES : MESES_CORTOS;
  const de = largo ? ' de ' : ' ';
  if (lunes.getMonth() === domingo.getMonth()) return lunes.getDate() + ' al ' + domingo.getDate() + de + m[domingo.getMonth()];
  return lunes.getDate() + de + m[lunes.getMonth()] + ' al ' + domingo.getDate() + de + m[domingo.getMonth()];
}
