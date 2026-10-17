import type { Semana, Turnos } from '../datos/tipos';

export function aMinutos(h: string): number {
  const [a, b] = h.split(':');
  return +a * 60 + +b;
}
// Un turno que acaba a las 0:00 o más tarde cruza la medianoche.
export function tramo(entrada: string, salida: string): [number, number] | null {
  if (!entrada || !salida) return null;
  const a = aMinutos(entrada);
  let b = aMinutos(salida);
  if (b <= a) b += 24 * 60;
  return [a, b];
}
export function minutosTurnos(t: Turnos): number {
  return [tramo(t[0], t[1]), tramo(t[2], t[3])].reduce((s, x) => s + (x ? x[1] - x[0] : 0), 0);
}
export function textoHoras(min: number): string {
  const h = min / 60;
  return (Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')) + ' h';
}
export function semanaTieneDatos(sem: Semana | undefined): boolean {
  return !!sem && Object.values(sem).some((dias) => dias.some((t) => t.some(Boolean)));
}

// Acepta «12», «1234», «12:34», «12.34» o «12h»; devuelve «12:34», '' si está vacío o null si no es una hora.
export function normalizarHora(texto: string): string | null {
  const v = texto.trim().toLowerCase().replace(/h$/, '');
  if (!v) return '';
  let h: string, m: string;
  const partes = v.split(/[:.,h\s]+/);
  if (partes.length > 1) { h = partes[0]; m = partes[1] || '0'; }
  else if (/^\d{1,2}$/.test(v)) { h = v; m = '0'; }
  else if (/^\d{3}$/.test(v)) { h = v[0]; m = v.slice(1); }
  else if (/^\d{4}$/.test(v)) { h = v.slice(0, 2); m = v.slice(2); }
  else return null;
  if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) return null;
  const hh = +h === 24 ? 0 : +h, mm = +m;
  if (hh > 23 || mm > 59) return null;
  return hh + ':' + String(mm).padStart(2, '0');
}
// La casilla usa el selector de hora del móvil, que solo entiende «09:30»; los datos guardan «9:30».
export function aCasilla(valor: string): string { return valor ? valor.padStart(5, '0') : ''; }
